import pprint
from langchain.tools import ToolRuntime, tool, InjectedToolArg
from typing import Annotated
from dotenv import load_dotenv
from pathlib import Path
import os
import json
from agent.tools.tool_context import AgentContext
from utils.agent_tools.file_reader import extract_text_from_docx_bytes, extract_text_from_pdf_bytes
from db.models import File
from db.db import SessionLocal
from utils.s3.uploader import read_s3_bytes, upload_bytes, delete_s3_key

load_dotenv()

S3_ENV_PREFIX=os.getenv("S3_ENV_PREFIX","dev")

def sanitize_relative_path(path: str) -> str:
    path = path.lstrip("/")
    path = path.replace("..", "")
    return path

def normalize_latex_string(s: str) -> str:
    s = s.replace("\\'", "'") 
    s = s.replace("\\\\", "\\")
    return s

@tool
def create_file(relative_path: str, content: str, runtime: Annotated[ToolRuntime[AgentContext], InjectedToolArg]):
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

        content = normalize_latex_string(content)

        key = f"{S3_ENV_PREFIX}/projects/{runtime.context.project_id}/files/{safe_path}"
        db = SessionLocal()

        file_check = db.query(File).filter(File.storage_path==key).first()

        if file_check:
            return json.dumps({
                "status" : "file already exits use, use the search_replace tool to update an existing file"
            })

        upload_bytes(
            key=key,
            content=content.encode("utf-8"),
            content_type="text/plain; charset=utf-8"
        )

        dir_path,file_name = os.path.split(safe_path)
        file_row = File(project_id=runtime.context.project_id,filename=file_name,file_type="source",storage_path=key,content=content)

        db.add(file_row)
        db.commit()
        db.refresh(file_row)
        db.close()

        print(f"created file {key}")


        return json.dumps({
            "tool_name":"create_file",
            "status": "created",
            "path": safe_path,
            "s3_key": key
        })
    except Exception as e:

        print(f"Error occurred while creating file {e}")

        return json.dumps({
            "status": "error creating file",
            "error": str(e)
        })


@tool
def list_files(runtime: Annotated[ToolRuntime[AgentContext], InjectedToolArg]):
    """
    List all files in the current LaTeX project.

    Use this tool FIRST before creating, reading, or modifying any files.
    This ensures you understand the current project structure and avoid conflicts.

    Purpose:
    - Discover existing project files before taking action
    - Verify whether a file exists before creating or updating it
    - Understand the project layout (main.tex, sections, assets, etc.)

    Rules:
    - ALWAYS call this tool before using create_file or get_file_content
    - Use the returned 'path' value when calling get_file_content

    Returns:
    A list of file objects, each containing:
    - file_name: the filename (e.g., 'main.tex', 'intro.tex')
    - file_type: the type of file ('source', 'asset', etc.)
    - path: the full storage path (use this for get_file_content)

    Returns an error message string if the operation fails.
    """

    print("List files tool accesed")

    project_id = runtime.context.project_id
    try:
        db = SessionLocal()

        files_db = db.query(File).filter(File.project_id==project_id).all()

        files= [{"file_name":f.filename,"file_type":f.file_type.value,"path":f.storage_path} for f in files_db ]

        pprint.pprint(files)
        db.close()
        return json.dumps({"tool_name":"list_files","files": files})
    
    except Exception as e:
        print(f"Error occured while listing files {e}")
        return json.dumps({"status": "error", "message": "Error listing files"})
    
@tool
def get_file_content(file_path: str, runtime: Annotated[ToolRuntime[AgentContext], InjectedToolArg]):
    """
    Read and return the contents of a file from the project or knowledge base.

    Use this tool to inspect existing files before making modifications,
    or to answer user questions about file contents. This tool can read
    both project source files and knowledge base files.

    Purpose:
    - Read LaTeX source files to understand their structure
    - Check existing content before suggesting edits
    - Retrieve configuration files, bibliographies, or style files
    - Read knowledge base files (PDF, DOCX, TXT) to use as context for document generation

    Args:
        file_path: The full storage path of the file to read.
                   This MUST be the 'path' value returned by list_files.
                   Examples:
                   - Project files: 'dev/projects/<project_id>/files/main.tex'
                   - Knowledge base files: 'dev/projects/<project_id>/kb/Anand-S-Resume-20251231.pdf'

    Supported File Types:
    - Text files (.tex, .txt, .bib, etc.): Returns UTF-8 decoded content
    - PDF files (.pdf): Extracts and returns text content from PDF documents
    - DOCX files (.docx): Extracts and returns text content from Word documents
    - Knowledge base files: Can read PDF and DOCX files from the knowledge base directory

    Rules:
    - ALWAYS call list_files first to get the correct file path
    - Do NOT guess or construct file paths manually
    - The file_path must be an exact match from list_files output
    - For knowledge base files, use paths that include '/kb/' in the storage path

    Returns:
    - The file content as a string (extracted text for PDF/DOCX, UTF-8 decoded for text files)
    - An error message string if the file cannot be read

    This tool does NOT:
    - Modify or update the file
    - Create new files
    - Delete files
    """
    print(f"get file content tool accessed for the file {file_path}")

    try:
        content = ""
        data = read_s3_bytes(file_path)
        ext = Path(file_path).suffix
        if ext == ".pdf":
            content = extract_text_from_pdf_bytes(data)
        elif ext == ".docx":
            content = extract_text_from_docx_bytes(data)
        else:
            content = data.decode("utf-8")
            
        return {
            "tool_name":"get_file_content",
            "file_path":file_path,
            "content":content
        }  
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return f"Error reading file: {str(e)}"



@tool
def search_replace(file_path: str, old_string: str, new_string: str, runtime: Annotated[ToolRuntime[AgentContext], InjectedToolArg]):
    """
    Modify an existing file by replacing a specific text string with new content.

    Use this tool to make targeted edits to existing LaTeX files without
    rewriting the entire file.

    Purpose:
    - Fix typos or errors in existing files
    - Update specific sections of LaTeX documents
    - Modify commands, environments, or text passages
    - Refactor variable names or labels

    Args:
        file_path: The full storage path of the file to modify.
                   This MUST be the 'path' value returned by list_files.
        old_string: The exact text to search for in the file.
                    Must match exactly, including whitespace and newlines.
                    Must be unique within the file (appears only once).
        new_string: The text to replace old_string with.
                    Can be empty string to delete the old_string.

    Rules:
    - ALWAYS call list_files first to get the correct file path
    - ALWAYS call get_file_content first to verify the exact text to replace
    - The old_string MUST be unique in the file (only one occurrence)
    - The old_string MUST match exactly (case-sensitive, whitespace-sensitive)
    - Include enough context in old_string to make it unique
    - Do NOT use this tool if old_string appears multiple times

    Returns:
    - status: 'replaced' if successful
    - occurrences: number of replacements made (should be 1)
    - path: the file path that was modified

    Error cases:
    - 'not_found': old_string was not found in the file
    - 'multiple_matches': old_string appears more than once (ambiguous)
    - 'error': an unexpected error occurred

    This tool does NOT:
    - Create new files (use create_file instead)
    - Delete files
    - Replace multiple different strings at once
    """
    print(f"search_replace tool accessed for file {file_path}")

    try:

        old_string = normalize_latex_string(old_string)
        new_string = normalize_latex_string(new_string)

        data = read_s3_bytes(file_path)
        content = data.decode("utf-8")

        normalized_content = normalize_latex_string(content)

      
        occurrences = normalized_content.count(old_string)

        if occurrences == 0:
            return json.dumps({
                "status": "not_found",
                "message": "The string was not found in the file. Use get_file_content to verify the exact text."
            })

        if occurrences > 1:
            return json.dumps({
                "status": "multiple_matches",
                "occurrences": occurrences,
                "message": f"The string appears {occurrences} times. Include more context to make it unique."
            })

        new_content = normalized_content.replace(old_string, new_string, 1)

        upload_bytes(
            key=file_path,
            content=new_content.encode("utf-8"),
            content_type="text/plain; charset=utf-8"
        )

      
        db = SessionLocal()
        file_record = db.query(File).filter(File.storage_path == file_path).first()
        
        if file_record:
            file_record.content = new_content
            db.commit()
        
        db.close()

        print(f"Successfully replaced text in {file_path}")

        return json.dumps({
            "tool_name":"search_replace",
            "status": "replaced",
            "occurrences": 1,
            "path": file_path
        })

    except Exception as e:
        print(f"Error in search_replace for {file_path}: {e}")
        return json.dumps({
            "status": "error",
            "message": f"Failed to update file: {str(e)}"
        })


@tool
def delete_file(file_path: str, runtime: Annotated[ToolRuntime[AgentContext], InjectedToolArg]):
    """
    Delete a file from the current LaTeX project.

    Use this tool to permanently remove files that are no longer needed.

    Purpose:
    - Remove obsolete or unwanted files from the project
    - Clean up temporary or test files
    - Remove files that are being replaced or refactored

    Args:
        file_path: The full storage path of the file to delete.
                   This MUST be the 'path' value returned by list_files.
                   Example: 'dev/projects/<project_id>/files/main.tex'

    Rules:
    - ALWAYS call list_files first to get the correct file path
    - Do NOT guess or construct file paths manually
    - The file_path must be an exact match from list_files output
    - This operation is PERMANENT and cannot be undone
    - Be careful not to delete critical files like main.tex

    Returns:
    - status: 'deleted' if successful
    - path: the file path that was deleted
    - tool_name: 'delete_file'

    Error cases:
    - 'not_found': file was not found in the database
    - 'error': an unexpected error occurred during deletion

    This tool does NOT:
    - Create new files
    - Modify existing files
    - Restore deleted files
    """
    print(f"delete_file tool accessed for file {file_path}")

    try:
        db = SessionLocal()
        
    
        file_record = db.query(File).filter(
            File.storage_path == file_path,
            File.project_id == runtime.context.project_id
        ).first()
        
        if not file_record:
            db.close()
            return json.dumps({
                "tool_name": "delete_file",
                "status": "not_found",
                "message": f"File not found at path: {file_path}. Use list_files to verify the correct path."
            })
        
       
        s3_deleted = delete_s3_key(file_path)
        
        if not s3_deleted:
            db.close()
            return json.dumps({
                "tool_name": "delete_file",
                "status": "error",
                "message": f"Failed to delete file from storage: {file_path}"
            })
        
      
        db.delete(file_record)
        db.commit()
        db.close()
        
        print(f"Successfully deleted file {file_path}")
        
        return json.dumps({
            "tool_name": "delete_file",
            "status": "deleted",
            "path": file_path
        })
        
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
        return json.dumps({
            "tool_name": "delete_file",
            "status": "error",
            "message": f"Failed to delete file: {str(e)}"
        })
