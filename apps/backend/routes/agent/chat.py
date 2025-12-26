import pprint
from fastapi import APIRouter,HTTPException,Depends, WebSocket, WebSocketDisconnect
from agent.latex_agent import latex_agent
from db.models import ChatMessage, MessageRole, Project
from db.get_db import get_db
from utils.auth.isSignedin import verify_clerk_user, verify_clerk_user_ws
from sqlalchemy.orm import Session


chat_router = APIRouter(prefix="/github/chat")

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

            response = latex_agent(user_message=user_content,project_id=project_id,project=Project)

            assistant_msg = ChatMessage(
                project_id=project.id,
                role=MessageRole.assistant,
                content=response
            )
            db.add(assistant_msg)
            db.commit()

            await websocket.send_json({"sender": "assistant", "content": response})
            pprint.pprint(response)

    except WebSocketDisconnect:
        print("Ws disconnected")
    except Exception as e:
        print("Error:", str(e))
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()


