

from e2b import Sandbox
from e2b.api.client.models import sandbox
from db.models import User
from db.db import SessionLocal


def get_sandbox(user_id:str):

    try:
        db = SessionLocal()

        user = db.query(User).filter(User.external_auth_id==user_id).first()

        if not user:
            raise
            
        if not user.sandbox_id:
            print("Sandbox id not found in user db")
            print("Creating new sandbox")

            sandbox = Sandbox.create(template="latex-compiler")

            user.sandbox_id = sandbox.sandbox_id

            db.commit()

            return sandbox
        else:
            print(f"Sandbox found in db, ID : {user.sandbox_id}")
            sandbox = Sandbox.connect(sandbox_id=user.sandbox_id)

            return sandbox

    except Exception as e:
        print("Error getting sandbox")