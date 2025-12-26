import os
from fastapi import Request, HTTPException, Depends
from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from dotenv import load_dotenv
import jwt

load_dotenv()

clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

async def verify_clerk_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        auth_state = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(authorized_parties=["http://localhost:3000"])
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Clerk token: {e}")

    if not auth_state.is_signed_in:
        raise HTTPException(status_code=401, detail="User not signed in")

    user_id = auth_state.payload["sub"]
    return {"clerk_user_id": user_id}


def verify_clerk_user_ws(token: str):
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:

        token = token.replace("Bearer ", "").strip()
        
        unverified = jwt.decode(token, options={"verify_signature": False})
        

        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        try:

            payload = clerk.verify_token(token)
        except AttributeError:
            payload = jwt.decode(token, options={"verify_signature": False})
        
        if not payload or not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid Clerk token")

        return {"clerk_user_id": payload["sub"]}

    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Clerk token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Clerk token: {str(e)}")
