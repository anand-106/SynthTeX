import os
from uuid import UUID
from typing_extensions import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.crud.file_tree_builder import build_file_tree
from utils.s3.uploader import generate_download_url, generate_presigned_upload_url, generate_presigned_url, object_check_s3, read_s3_bytes, upload_bytes
from db.get_db import get_db
from utils.auth.isSignedin import verify_clerk_user
from db.models import CompilationJob, CompileStatus, File, FileType, Project
from routes.crud.models import CompileIn, ConfirmFileIn, FileIn, PresignIn, ProjectModel, ProjectsOut
from dotenv import load_dotenv
from arq import create_pool
from arq.connections import RedisSettings

load_dotenv()

crud_router = APIRouter()

REDIS_URL_COMPILER = os.getenv("REDIS_URL_SYNCER", "redis://localhost:6379")
S3_ENV_PREFIX=os.getenv("S3_ENV_PREFIX","dev")

@crud_router.post('/project')
def create_project(project:ProjectModel,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    project_row = Project(name=project.name,description=project.description,user_id=auth_user["clerk_user_id"])
    db.add(project_row)
    db.commit()
    db.refresh(project_row)

    return {
        "message": "Project Created Successfully",
        "project_id": str(project_row.id)
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

@crud_router.put('/file/{file_id}')
def update_file(request:FileIn,file_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    try:
        
        file_data = db.query(File).filter(File.id==file_id).first()

        if not file_data:
            raise HTTPException(404,"File not found")
        
        upload_bytes(file_data.storage_path,request.content,"text/plain; charset=utf-8")

        return {
            "id":file_data.id,
            "file_name":file_data.filename,
            "status" : "updated"
        }
        
    except Exception as e:

        raise HTTPException(500,f"Error getting File {e}")


@crud_router.get('/file/{file_id}/url')
def get_file_url(file_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    try:
        
        file_data = db.query(File).filter(File.id==file_id).first()

        if not file_data:
            raise HTTPException(404,"File not found")
        
        url = generate_presigned_url(file_data.storage_path)

        return {
            "url":url
        }
        
    except Exception as e:

        raise HTTPException(500,f"Error getting File {e}")

@crud_router.get('/file/{file_id}/download')
def get_file_url(file_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    try:
        
        file_data = db.query(File).filter(File.id==file_id).first()

        if not file_data:
            raise HTTPException(404,"File not found")
        
        url = generate_download_url(file_data.storage_path)

        return {
            "url":url
        }
        
    except Exception as e:

        raise HTTPException(500,f"Error getting File {e}")

@crud_router.post('/{project_id}/file/presign')
def presign_upload(request:List[PresignIn],project_id:str,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    res =[]

    for f in request:

        key = f"{S3_ENV_PREFIX}/projects/{project_id}/kb/{f.filename}"

        print(f"getting presign url for {key}")

        upload_url = generate_presigned_upload_url(
        key=key,
        content_type=f.content_type
            )

        res.append({
        "upload_url": upload_url,
        "key": key,
        "expires_in": 300
        })
    

    return res

@crud_router.post('/file/confirm')
def confirm_file_upload(request:ConfirmFileIn,db:Session=Depends(get_db),auth_user=Depends(verify_clerk_user)):

    print(f"confirming file {request.filename}")

    try:
        if object_check_s3(request.key):
            file_row = File(project_id=request.project_id,filename=request.filename,file_type=FileType.knowledge_base,storage_path=request.key)
            db.add(file_row)
            db.commit()
            db.refresh(file_row)
        else:
            raise HTTPException(404,"File not found")
    except Exception as e:
        raise HTTPException(500,f"Error confirming file {e}")



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

@crud_router.get('/project/{project_id}/kb-files')
def get_kb_file_tree(project_id:str,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):
    try:
        file_data = db.query(File).filter(File.project_id == project_id,File.file_type=="knowledge_base").all()
        
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
        raise HTTPException(500,f"Error getting project KB file tree {e}")

@crud_router.get('/project/{project_id}/source-files')
def get_all_source_files(project_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    try:

        files = db.query(File).filter(File.project_id==project_id).all()

        result = []
        for f in files:
            try:
                if f.filename.endswith('.pdf'):
                    print(f"{f.filename} skipped")
                    continue
                content = read_s3_bytes(f.storage_path).decode('utf-8')
                result.append({
                    "id":str(f.id),
                    "filename":f.filename,
                    "content":content,
                    "path":f.storage_path
                })

            except Exception as e:
                print(f"Error reading file : {f.filename} path: {f.storage_path}")
                continue
        
        return {
            "files":result
        }
    except Exception as e:
        raise HTTPException(500,f"Error getting files {str(e)}")


@crud_router.post('/compile')
async def compile_latex_project(request:CompileIn,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    files_db = db.query(File).filter(File.project_id==request.project_id).all()

    files= [{"filename":f.filename,"file_type":f.file_type.value,"path":f.storage_path} for f in files_db ]

    compile_row = CompilationJob(project_id=request.project_id,status=CompileStatus.queued)

    db.add(compile_row)
    db.commit()
    db.refresh(compile_row)

    latex_compiler = await create_pool(RedisSettings.from_dsn(REDIS_URL_COMPILER))

    await latex_compiler.enqueue_job("latex_job_compiler",{     
                                                                "job_id":str(compile_row.id),
                                                                "project_id":request.project_id,
                                                                "user_id":auth_user["clerk_user_id"],
                                                                "files":files
                                                            })
    
    return {
        "job_id":compile_row.id,
        "status":compile_row.status.value
    }
    
@crud_router.get('/compile/{compile_id}/status')
def get_compile_status(compile_id:UUID,auth_user=Depends(verify_clerk_user),db:Session=Depends(get_db)):

    compile_job = db.query(CompilationJob).filter(CompilationJob.id==compile_id).first()

    if not compile_job:
        raise HTTPException(404,"Comile job not found")
    if compile_job.pdf_path:
        return {
        "status":compile_job.status,
        "path":compile_job.pdf_path
    }
    return {
        "status":compile_job.status
    }
