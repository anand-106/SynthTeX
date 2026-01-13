
from pathlib import Path

from e2b import Sandbox
from s3 import read_s3_bytes


def extract_relative_path(path: str) -> str:
    marker = ["/files/","/kb/"]
    for mk in marker:
        if mk in path:
            return path.split(mk, 1)[1]
    raise ValueError("Invalid storage path: missing '/files/' or '/kb/'")

def copy_project_to_e2b(files,sandbox:Sandbox,project_id:str):

    for f in files:

        content = read_s3_bytes(f["path"])

        local_path = f"/home/user/{project_id}/"+extract_relative_path(f["path"])

        path = Path(local_path)
        if path.parent != Path("."):
            sandbox.commands.run(f"mkdir -p {path.parent}")

        sandbox.files.write(
            local_path,
            content,
        )
        print(f"Copied file {local_path} to sandbox")