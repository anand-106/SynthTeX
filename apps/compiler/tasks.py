
import os
from utils.e2b import get_sandbox
from db.models import CompilationJob, CompileStatus, File, FileType
from db.db import SessionLocal
from s3 import upload_bytes
from copy_project import copy_project_to_e2b
from dotenv import load_dotenv

load_dotenv()

S3_ENV_PREFIX = os.getenv("S3_ENV_PREFIX")

async def latex_job_compiler(ctx,job_data):


    entry_file = "main"

    project_id = job_data.get("project_id","")
    job_id = job_data.get("job_id","")
    user_id = job_data.get("user_id","")
    files = job_data.get("files",[])

    sandbox = get_sandbox(user_id=user_id)
    copy_project_to_e2b(files=files,sandbox=sandbox,project_id=project_id)

    try:
        # Ensure output directory exists and is clean
        sandbox.commands.run(
            cwd=f'/home/user/{project_id}',
            cmd="mkdir -p output && rm -rf output/*",
            timeout=30,
        )

        # Run pdflatex 3 times to resolve all references (TOC, citations, etc.)
        for i in range(3):
            try:
                result = sandbox.commands.run(
                    cwd=f'/home/user/{project_id}',
                    cmd=(
                        f"pdflatex "
                        f"-interaction=nonstopmode "
                        f"-file-line-error "
                        f"-output-directory=output "
                        f"{entry_file}.tex"
                    ),
                    timeout=120,
                )
                print(f"pdflatex pass {i+1} completed")
            except Exception as pass_error:
                print(f"pdflatex pass {i+1} completed with warnings/errors: {pass_error}")
            
    except Exception as e:
        print(f"Compilation had errors: {e}")

    key = f"{S3_ENV_PREFIX}/projects/{project_id}/files/output/{entry_file}.pdf"

    content = sandbox.files.read(path=f"/home/user/{project_id}/output/{entry_file}.pdf",format="bytes")

    upload_bytes(key=key,content=content,content_type="application/pdf")

    db = SessionLocal()
    try:
        compile_job = db.query(CompilationJob).filter(CompilationJob.id == job_id).first()
        if compile_job:
            compile_job.pdf_path = key
            compile_job.status = CompileStatus.success

            db.commit()
        
        file_row=db.query(File).filter(File.project_id==project_id,File.storage_path==key,File.file_type==FileType.source).first()
        if not file_row:

            file_row = File(project_id=project_id,filename=f"{entry_file}.pdf",storage_path=key,file_type=FileType.source,content="")
            db.add(file_row)
            db.commit()
            db.refresh(file_row)
        else:
            print("db record already exists")
    finally:
        
        db.close()

    

