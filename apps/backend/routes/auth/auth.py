from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from db.models import User
from db.get_db import get_db

auth_router = APIRouter(prefix='/auth')

@auth_router.post('/clerk/signup')
async def clerk_signup(request:Request,db:Session=Depends(get_db)):

    payload = await request.json()

    data = payload["data"]
    id = data["id"]
    email = data["email_addresses"][0]["email_address"]

    user = db.query(User).filter_by(external_auth_id=id).first()
    if not user:
        print("User not exists on db. adding user.")

        user = User(email=email,external_auth_id=id)
        db.add(user)
        db.commit()
        db.refresh(user)

        print("user added succesfully")
    else:
        print("User already exists on db")

    return {
        "message": "User verified successfully",
        "clerk_user_id": id,
        "user": email,
    }


