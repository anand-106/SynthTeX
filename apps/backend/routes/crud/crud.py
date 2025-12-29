import os
from uuid import UUID
from typing_extensions import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.crud.file_tree_builder import build_file_tree
from utils.s3.uploader import read_s3_bytes
from db.get_db import get_db
from utils.auth.isSignedin import verify_clerk_user
from db.models import File, Project
from routes.crud.models import CompileIn, ProjectModel, ProjectsOut
from dotenv import load_dotenv
from arq import create_pool
from arq.connections import RedisSettings

load_dotenv()

crud_router = APIRouter()

REDIS_URL_COMPILER = os.getenv("REDIS_URL_SYNCER", "redis://localhost:6379")

@crud_router.post('/project')
def create_project(project:ProjectModel,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    project_row = Project(name=project.name,description=project.description,user_id=auth_user["clerk_user_id"])
    db.add(project_row)
    db.commit()
    db.refresh(project_row)

    return {
        "message":"Project Created Successfully"
    }

@crud_router.get('/projects',response_model=List[ProjectsOut])
def get_projects(auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    projects = db.query(Project).filter(Project.user_id == auth_user["clerk_user_id"]).all()

    return projects

@crud_router.get('/project/{project_id}',response_model=ProjectsOut)
def get_project(project_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    project = db.query(Project).filter(Project.user_id == auth_user["clerk_user_id"],Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404,detail="Project not Found")
    
    return project


@crud_router.get('/file/{file_id}')
def get_file(file_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    
    try:
        
        file_data = db.query(File).filter(File.id==file_id).first()

        if not file_data:
            raise HTTPException(404,"File not found")
        
        raw_data = read_s3_bytes(file_data.storage_path)

        return {
            "id":file_data.id,
            "file_name":file_data.filename,
            "content":raw_data.decode('utf-8')
        }
        
    except Exception as e:

        raise HTTPException(500,f"Error getting File {e}")


@crud_router.get('/project/{project_id}/files')
def get_file_tree(project_id:str,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    try:
        
        file_data = db.query(File).filter(File.project_id == project_id,File.file_type=="source").all()

        if not file_data:
            return {
            "project_id":project_id,
            "tree":[]
        }
        
        
        tree = build_file_tree(file_data,project_id)

        return {
            "project_id":project_id,
            "tree":tree
        }
        
    except Exception as e:

        raise HTTPException(500,f"Error getting project file tree {e}")

@crud_router.post('/compile')
async def compile_latex_project(request:CompileIn,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    latex_compiler = await create_pool(RedisSettings.from_dsn(REDIS_URL_COMPILER))

    await latex_compiler.enqueue_job("latex_job_compiler",{"project_id":request.project_id})