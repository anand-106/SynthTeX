from uuid import UUID
from typing_extensions import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.background import P
from db.get_db import get_db
from utils.auth.isSignedin import verify_clerk_user
from db.models import Project
from routes.crud.models import ProjectModel, ProjectsOut

crud_router = APIRouter()

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

