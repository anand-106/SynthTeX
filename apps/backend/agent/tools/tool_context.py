from pydantic import BaseModel


class AgentContext(BaseModel):
    project_id:str