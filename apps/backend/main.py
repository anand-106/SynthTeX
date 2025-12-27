from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.agent.chat import chat_router
from routes.crud.crud import crud_router
from routes.auth.auth import auth_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(crud_router)
app.include_router(chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
