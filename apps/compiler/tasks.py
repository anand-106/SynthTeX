
from pprint import pprint
from e2b import Sandbox

from copy_project import copy_project_to_e2b

async def latex_job_compiler(ctx,job_data):

    sandbox = Sandbox.create(template="latex-compiler")

    entry_file = "main.tex"

    project_id = job_data.get("project_id","")

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
            f"{entry_file}"
        ),
        timeout=60,
    )

    pprint(result)

    

