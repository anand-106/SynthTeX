from e2b import Template,default_build_logger
import os
from dotenv import load_dotenv

load_dotenv()

template = (
    Template().from_base_image().apt_install([
        "texlive-latex-base",
        "texlive-latex-recommended",
        "texlive-latex-extra",
        "texlive-fonts-recommended",
        "latexmk",
        "texlive-bibtex-extra",
        "texlive-science",
        "texlive-pictures"
    ]).set_workdir('/workspace')
)

Template.build(template=template,
alias="latex-compiler",
cpu_count=1,
memory_mb=1024,
on_build_logs=default_build_logger(),
)



print("✅ LaTeX compiler template created successfully")
