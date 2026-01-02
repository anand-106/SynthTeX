

from e2b import Sandbox
from db.models import User
from db.db import SessionLocal


def get_sandbox(user_id:str):

    try:
        db = SessionLocal()

        user = db.query(User).filter(User.external_auth_id==user_id).first()

        if not user:
            raise ValueError(f"User not found: {user_id}")
            
        if user.sandbox_id:

            print(f"Sandbox found in db, ID : {user.sandbox_id}")
            try:
                sandbox = Sandbox.connect(sandbox_id=user.sandbox_id)

                return sandbox
            except Exception as e:
                print("Failed to connect to existing sandbox")
            
        print("Creating new sandbox")

        sandbox = Sandbox.create(template="latex-compiler")

        user.sandbox_id = sandbox.sandbox_id

        db.commit()

        return sandbox
            

    except Exception as e:
        print("Error getting sandbox")