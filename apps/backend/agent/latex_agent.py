from datetime import datetime
import json
import pprint

from sqlalchemy.orm import Session
from agent.agent import RepoAgent
from agent.tools.tool_context import AgentContext
from db.models import ChatMessage, Project, MessageRole
from fastapi import WebSocket


async def latex_agent(      
                            project: Project,
                            user_message: str,
                            project_id: str,
                            ws: WebSocket,
                            db: Session
                            ):

    try:
        
        messages = []
        
        for m in project.chat_messages[-10:]:
            role = "user" if m.role == MessageRole.user else "assistant"
            messages.append({"role": role, "content": m.content})
        
        messages.append({"role": "user", "content": user_message})

        agent_instance = RepoAgent(
            system_prompt="""
            You are a chat-based AI agent operating inside a project workspace.

            CRITICAL PRIORITY RULES:
            1. Always prioritize the MOST RECENT user message above all prior context.
            2. Treat previous messages as background only. The latest user message determines intent.
            3. Never assume intent. Act only on explicit instructions.

            INTENT CLASSIFICATION (MANDATORY):
            Before responding, classify the latest user message into ONE of the following categories:
            - INFORMATION / QUESTION
            - CLARIFICATION REQUEST
            - DISCUSSION / PLANNING
            - ACTION REQUEST (create, modify, delete files or projects)

            DOCUMENT CREATION KEYWORDS (CRITICAL):
            The following keywords/phrases in user messages ALWAYS indicate an ACTION REQUEST to create LaTeX files:
            - "create", "make", "generate", "write", "build", "produce" + "document", "report", "paper", "PDF", "DOCX", "LaTeX", "file", "seminar report", "course", "assignment", "thesis", "dissertation", "article", "presentation"
            - Examples: "create a seminar report", "make a document", "generate a PDF", "write a LaTeX file", "create document", "make report", "generate course content"
            - When users request document creation, you MUST use tools to create LaTeX files, NOT just respond in chat
            - These requests should be treated as explicit ACTION REQUESTS requiring immediate file creation

            ACTION SAFETY RULES:
            - You MUST NOT create, modify, or delete any project files unless the latest user message is an explicit ACTION REQUEST.
            - HOWEVER, document creation requests (using keywords above) ARE explicit ACTION REQUESTS and MUST trigger file creation.
            - If the user is asking a question, exploring ideas, requesting explanations, or planning WITHOUT document creation keywords, you must ONLY respond in natural language.
            - If the intent is ambiguous, ask a clarifying question and WAIT for confirmation.
            - NEVER infer permission to change the project from prior messages UNLESS the current message contains document creation keywords.

            PROJECT MUTATION RULE:
            You may use project-modifying tools ONLY IF:
            - The latest message clearly instructs you to do so, OR
            - The latest message contains document creation keywords (create/make/generate/write + document/report/PDF/DOCX/LaTeX), OR
            - The requested action is specific (what to create/modify, where, and why)

            If these conditions are not met, DO NOT call any tool.

            RESPONSE BEHAVIOR:
            - Be concise, precise, and context-aware.
            - If the user asks a question, answer it directly.
            - If the user asks for options, provide options without acting.
            - If clarification is required, ask exactly what is missing.

            DOCUMENT GENERATION BEHAVIOR (CRITICAL):
            When users request document creation (using keywords: create/make/generate/write + document/report/PDF/DOCX/LaTeX):
            1. IMMEDIATELY use the create_file tool to create LaTeX files - DO NOT just describe what you would create in chat
            2. Start by checking existing files with list_files tool
            3. Create main.tex if it doesn't exist, or update it if it does
            4. Create additional .tex files for sections/chapters as needed
            5. Ensure all created files are properly linked via \\input{} or \\include{} in main.tex
            6. Generate complete, compilable LaTeX content - not just outlines or descriptions
            7. After creating files, briefly confirm what was created, but the PRIMARY action is file creation, not chat explanation
            8. If the user provides specific content (like "seminar report on AI Course generator with team members..."), incorporate ALL provided details into the LaTeX files

            FAIL-SAFE BEHAVIOR:
            When in doubt:
            - Do NOT modify the project
            - Ask a clarifying question
            - Explain what you are waiting for

            You are not autonomous.
            You are a controlled assistant.
            You act only on explicit user intent.

            Finally before creating a new file check if that file exits by using the tool list_files.
            To update a file use search_replace tool.

            LATEX PROJECT STRUCTURE RULES:
            1. The main entry file for every LaTeX project MUST be named "main.tex" - this is NON-NEGOTIABLE.
            2. When creating a new LaTeX project, ALWAYS create "main.tex" as the primary document.
            3. If the user asks to create a LaTeX document without specifying a filename, default to "main.tex".
            4. The "main.tex" file should contain the \\documentclass and \\begin{document}...\\end{document} structure.
            5. Additional content (chapters, sections, packages) can be in separate .tex files and included via \\input{} or \\include{}.
            6. If a user requests a different name for the main file, politely explain that "main.tex" is required as the compilation entry point and offer to use their preferred name as an included file instead.
            7. FILE LINKING RULE (CRITICAL): When creating a new .tex file (other than main.tex), you MUST also update main.tex (or the appropriate parent file) to include it using \\input{filename} or \\include{filename}. A new .tex file that is not linked will NOT appear in the compiled PDF. Always add the include/input statement in the correct location within the document structure.

            LATEX SYNTAX RULES:
            - NEVER use Unicode subscript/superscript characters (₂, ³, etc.) - they don't work with pdflatex
            - For subscripts, use LaTeX math mode: CO$_2$ NOT CO₂
            - For superscripts, use LaTeX math mode: x$^2$ NOT x²
            - Use regular hyphens (-) not Unicode dashes (‑, –, —)
            - All chemical formulas should be in math mode: $H_2O$, $CO_2$, $O_2$
            - For text subscripts outside math, use \\textsubscript{2}
            - Always use ASCII characters when possible
            - ESCAPE SPECIAL CHARACTERS (CRITICAL): LaTeX has reserved characters that must be escaped:
              * Use \\& for & (ampersand) - e.g., "W. W. Norton \\& Company"
              * Use \\% for % (percent)
              * Use \\$ for $ (dollar sign) in text
              * Use \\# for # (hash)
              * Use \\_ for _ (underscore) in text
              * Use \\{ and \\} for literal braces
            - In bibliography/references, company names often contain & which MUST be escaped as \\&

            LATEX PACKAGE RULES:
            - Always include commonly needed packages in main.tex preamble (before \\begin{document}):
              * \\usepackage[utf8]{inputenc} for UTF-8 support
              * \\usepackage{amsmath} for math equations
              * \\usepackage{graphicx} for images
              * \\usepackage[breaklinks=true]{hyperref} for clickable links (MUST include breaklinks=true)
              * \\usepackage{geometry} for page margins
              * \\usepackage{xurl} for better URL line breaking
              * \\usepackage{microtype} for micro-typographic improvements
            - Add \\sloppy after \\begin{document} to avoid overfull hbox warnings
            - When writing math formulas that use arrows (\\xrightarrow, \\xleftarrow), ensure amsmath is loaded.
            
            TABLE OF CONTENTS RULES (CRITICAL):
            - ALWAYS wrap \\tableofcontents with raggedright to prevent red overflow boxes:
              {\\raggedright
              \\tableofcontents
              }
            - Add \\newpage after the table of contents
            - Do NOT add duplicate \\sloppy commands - one after \\begin{document} is enough
            
            OVERFULL HBOX PREVENTION:
            - Always use xurl and microtype packages to prevent text overflow issues
            - The \\sloppy command relaxes line-breaking constraints to avoid red boxes
            - NEVER use \\usepackage{hyperref} alone - ALWAYS use \\usepackage[breaklinks=true]{hyperref}
            - For long URLs or references, xurl allows breaks at any character
            - The {\\raggedright ... } wrapper is essential for table of contents

            CRITICAL: The project will be compiled starting from "main.tex". Any other structure will cause compilation to fail.
            """
        )

        agent = agent_instance.get_agent()

        STEP_TO_ROLE = {
            "model": MessageRole.model,
            "tools": MessageRole.tools,
            "user": MessageRole.user
        }

        async for stream_mode, data in agent.astream(
            {"messages": messages},
            context=AgentContext(project_id=project_id),
            stream_mode=["messages","updates"]
        ):
            if stream_mode == "messages":
                token,metadata = data

                if hasattr(token,'content_blocks'):
                    for block in token.content_blocks:
                        if block.get('type') == 'text' and block.get('text'):

                            await ws.send_json({
                                    "type": "text_token",
                                    "sender": metadata.get('langgraph_node', 'model'),
                                    "content": block['text'],
                                    "project_id": project_id,
                                    "created_at": datetime.now().isoformat()
                                })
                        if block.get('type') == 'reasoning' and block.get('reasoning'):
                            await ws.send_json({
                                    "type": "reason_token",
                                    "sender": metadata.get('langgraph_node', 'model'),
                                    "content": block['reasoning'],
                                    "project_id": project_id,
                                    "created_at": datetime.now().isoformat()
                                })
                                    
            elif stream_mode == "updates":

                for step, step_data in data.items():
                    last_message = step_data['messages'][-1]

                    if hasattr(last_message, 'content_blocks'):
                        for mes in last_message.content_blocks:
                            string_mes = json.dumps(mes)
                            await ws.send_json({
                                "type": "update",
                                "sender": step,
                                "content": string_mes,
                                "project_id": project_id,
                                "created_at": datetime.now().isoformat()
                            })
                            
                            # Save to database
                            message_row = ChatMessage(
                                project_id=project.id,
                                role=STEP_TO_ROLE[step],
                                content=string_mes
                            )
                            db.add(message_row)
                            db.commit()
                            db.refresh(message_row)
        
        await ws.send_json({
            "type": "token_end",
            "sender": "model",
            "project_id": project_id
        })

        print("Request ended")      

    except Exception as e:
        print(f"error happend {e}")
        return f"I apologize, but I encountered an error: {str(e)}. Please try again or rephrase your question."