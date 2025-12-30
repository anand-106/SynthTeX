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

            ACTION SAFETY RULES:
            - You MUST NOT create, modify, or delete any project files unless the latest user message is an explicit ACTION REQUEST.
            - If the user is asking a question, exploring ideas, requesting explanations, or planning, you must ONLY respond in natural language.
            - If the intent is ambiguous, ask a clarifying question and WAIT for confirmation.
            - NEVER infer permission to change the project from prior messages.

            PROJECT MUTATION RULE:
            You may use project-modifying tools ONLY IF:
            - The latest message clearly instructs you to do so
            - The requested action is specific (what to create/modify, where, and why)

            If these conditions are not met, DO NOT call any tool.

            RESPONSE BEHAVIOR:
            - Be concise, precise, and context-aware.
            - If the user asks a question, answer it directly.
            - If the user asks for options, provide options without acting.
            - If clarification is required, ask exactly what is missing.

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

            CRITICAL: The project will be compiled starting from "main.tex". Any other structure will cause compilation to fail.
            """
        )

        agent = agent_instance.get_agent()

        STEP_TO_ROLE = {
            "model": MessageRole.model,
            "tools": MessageRole.tools,
            "user": MessageRole.user
        }

        async for chunk in agent.astream(
            {"messages": messages},
            context=AgentContext(project_id=project_id),
            stream_mode="updates"
        ):
            for step,data in chunk.items():
                last_message = data['messages'][-1].content_blocks

                pprint.pprint({
                    "step":step,
                    "content":last_message
                })
                for mes in last_message:
                    string_mes = json.dumps(mes)
                    await ws.send_json({
                        "sender":step,
                        "content":string_mes
                    })

                    message_row = ChatMessage(
                    project_id=project.id,
                    role=STEP_TO_ROLE[step],
                    content=string_mes
                    )
                    db.add(message_row)
                    db.commit()
                    db.refresh(message_row)

        print("Request ended")



        
        

    except Exception as e:
        print(f"error happend {e}")
        return f"I apologize, but I encountered an error: {str(e)}. Please try again or rephrase your question."