from datetime import datetime
import pprint
from typing_extensions import List
from uuid import UUID
from fastapi import APIRouter,HTTPException,Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict
from agent.latex_agent import latex_agent
from db.models import ChatMessage, MessageRole, Project
from db.get_db import get_db
from utils.auth.isSignedin import verify_clerk_user, verify_clerk_user_ws
from sqlalchemy.orm import Session


chat_router = APIRouter()

class MessagesOut(BaseModel):
    id:UUID;
    project_id:UUID;
    role:MessageRole;
    content:str;
    created_at:datetime

    model_config=ConfigDict(from_attributes=True,use_enum_values=True)



@chat_router.websocket('/ws/project/{project_id}')
async def issue_chat_ws(websocket:WebSocket,project_id:str,db:Session=Depends(get_db)):
    await websocket.accept()
    auth_user = None

    try:
        token = websocket.query_params.get("token")

        if not token:
            await websocket.send_text("Missing Auth header")
            await websocket.close(code=1008)
            return

        auth_user = verify_clerk_user_ws(token)

        if not auth_user:
            await websocket.send_text("Invalid token.")
            await websocket.close(code=1008)
            return
        print(f"Websocket Connected :{auth_user['clerk_user_id']}")

        project = db.query(Project).filter(Project.id==project_id,Project.user_id == auth_user['clerk_user_id']).first()

        if not project:
            print("Project not found")
            return

        await websocket.send_text("Connected to issue chat")

        while True:

            message = await websocket.receive_json()

            user_content = message.get("content", "").strip()

            if not user_content:
                continue

            print("User:", user_content)

            messages_list = db.query(ChatMessage).filter(ChatMessage.project_id==project_id).all()

            user_msg = ChatMessage(
                project_id=project.id,
                role=MessageRole.user,
                content=user_content
            )
            db.add(user_msg)
            db.commit()

            db.refresh(project)

            await latex_agent(user_message=user_content,project_id=project_id,project=project,db=db,ws=websocket)


            # await websocket.send_json({"sender": "assistant", "content": response})

    except WebSocketDisconnect:
        print("Ws disconnected")
    except Exception as e:
        print("Error:", str(e))
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()



@chat_router.get('/chat/project/{project_id}',response_model=List[MessagesOut])
def get_chat_messages(project_id:str,db:Session=Depends(get_db),auth_user=Depends(verify_clerk_user)):

    try:

        messages = db.query(ChatMessage).filter(ChatMessage.project_id==project_id).all()

        return messages
    except Exception as e:

        print("error getting messages")
        raise HTTPException(500,"Error getting messages")

