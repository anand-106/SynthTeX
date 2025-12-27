from langchain.tools import ToolRuntime, tool
from dotenv import load_dotenv
import os
from agent.tools.tool_context import AgentContext
from db.models import File
from db.db import SessionLocal
from utils.s3.uploader import upload_bytes

load_dotenv()

S3_ENV_PREFIX=os.getenv("S3_ENV_PREFIX","dev")

def sanitize_relative_path(path: str) -> str:
    path = path.lstrip("/")
    path = path.replace("..", "")
    return path

@tool
def create_file(relative_path:str,content:str,runtime:ToolRuntime[AgentContext]):
    """
    Create a new file inside the current LaTeX project.

    Use this tool ONLY when the target file does not already exist.

    Purpose:
    - Initialize a blank project (e.g., create 'main.tex')
    - Add new LaTeX source files (sections, bibliography, styles)
    - Scaffold project structure before writing content

    Rules:
    - The path MUST be a relative path (e.g. 'main.tex', 'sections/introduction.tex')
    - Do NOT include leading slashes or '..'
    - This tool MUST NOT be used to modify existing files
    - If a file already exists, use the 'update_file' tool instead

    Behavior:
    - The file is created atomically in project storage
    - The content is stored as UTF-8 text
    - The project file tree is updated immediately

    Returns:
    - status: 'created' if successful, otherwise 'error'
    - path: normalized relative file path
    - s3_key: internal storage key (for backend use)

    This tool does NOT:
    - Compile the project
    - Delete or overwrite files
    - Modify any other project state
    """
    try:
        print("accessed create file tool")
        safe_path = sanitize_relative_path(relative_path)

        key = f"{S3_ENV_PREFIX}/projects/{runtime.context.project_id}/files/{safe_path}"

        upload_bytes(
            key=key,
            content=content.encode("utf-8"),
            content_type="text/plain; charset=utf-8"
        )

        db = SessionLocal()
        dir_path,file_name = os.path.split(safe_path)
        file_row = File(project_id=runtime.context.project_id,filename=file_name,file_type="source",storage_path=key,content=content)

        db.add(file_row)
        db.commit()
        db.refresh(file_row)
        db.close()

        print(f"created file {key}")


        return {
            "status": "created",
            "path": safe_path,
            "s3_key": key
        }
    except Exception as e:

        print(f"Error occurred while creating file {e}")

        return {
            "status":"error creating file"
        }


