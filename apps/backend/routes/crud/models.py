from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ProjectModel(BaseModel):
    name:str
    description:str

class ProjectsOut(BaseModel):
    id:UUID
    name:str
    description:str
    created_at:datetime

    model_config = ConfigDict(from_attributes=True)

class CompileIn(BaseModel):
    project_id:str

class FileIn(BaseModel):
    content:str

class PresignIn(BaseModel):
    filename:str
    content_type:str

class ConfirmFileIn(BaseModel):
    key:str
    project_id:str
    filename:str