
import os
from pprint import pprint
from e2b import Sandbox
from db.models import CompilationJob, CompileStatus, File, FileType
from db.db import SessionLocal
from s3 import upload_bytes
from copy_project import copy_project_to_e2b
from dotenv import load_dotenv

load_dotenv()

S3_ENV_PREFIX = os.getenv("S3_ENV_PREFIX")

async def latex_job_compiler(ctx,job_data):

    sandbox = Sandbox.create(template="latex-compiler")

    entry_file = "main"

    project_id = job_data.get("project_id","")
    job_id = job_data.get("job_id","")

    files = job_data.get("files",[])

    copy_project_to_e2b(files=files,sandbox=sandbox)

    result = sandbox.commands.run(
        cwd='/home/user',
        cmd=(
            "latexmk -pdf "
            "-interaction=nonstopmode "
            "-halt-on-error "
            "-file-line-error "
            "-outdir=output "
            f"{entry_file}.tex"
        ),
        timeout=60,
    )

    key = f"{S3_ENV_PREFIX}/projects/{project_id}/files/output/{entry_file}.pdf"

    content = sandbox.files.read(path=f"/home/user/output/{entry_file}.pdf",format="bytes")

    upload_bytes(key=key,content=content,content_type="application/pdf")

    db = SessionLocal()
    try:
        compile_job = db.query(CompilationJob).filter(CompilationJob.id == job_id).first()
        if compile_job:
            compile_job.pdf_path = key
            compile_job.status = CompileStatus.success
        
        file_row = File(project_id=project_id,filename=f"{entry_file}.pdf",storage_path=key,file_type=FileType.source,content="")
        db.add(file_row)
        db.commit()
        db.refresh(file_row)
    finally:
        db.close()

    pprint(result)

    

