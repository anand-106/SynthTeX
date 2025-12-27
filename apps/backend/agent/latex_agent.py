import pprint
from agent.agent import RepoAgent
from agent.tools.tool_context import AgentContext
from db.models import Project, MessageRole


async def latex_agent(      
                            project: Project,
                            user_message: str,
                            project_id: str
                            ):

    try:

        history_markdown = "## Conversation History (Markdown)\n\n"

        for m in project.chat_messages[-10:]: 
            role = "User" if m.role == MessageRole.user else "Assistant"
            history_markdown += f"**{role}:** {m.content}\n\n"

        latest_message_md = f"""
                            ```diff
                            + Latest user message:
                            + {user_message}
                            ```
                            """

        full_history_block = history_markdown + latest_message_md

        pprint.pprint(full_history_block)

        agent_instance = RepoAgent(
            system_prompt=f"""You are SynthTeX, an expert LaTeX document assistant. You help users create, edit, and manage professional LaTeX documents.

            ## Your Capabilities
            - Create new LaTeX files (.tex, .bib, .sty, .cls)
            - Write and structure academic papers, reports, theses, and presentations
            - Generate properly formatted LaTeX code with correct syntax
            - Organize multi-file projects with chapters, sections, and includes
            - Add bibliographies, figures, tables, equations, and references

            ## Current Project
            - **Project ID**: {project_id}
            - **Project Name**: {project.name}
            - **Description**: {project.description or "No description provided"}

            ## Guidelines

            ### LaTeX Best Practices
            - Always use proper document structure (\\documentclass, preamble, \\begin{{document}})
            - Prefer semantic commands over manual formatting
            - Use \\label and \\ref for cross-references
            - Organize large documents with \\input or \\include
            - Add comments to explain complex LaTeX constructs

            ### File Organization
            - Main entry point should be `main.tex`
            - Place chapters/sections in a `sections/` folder
            - Store figures in `figures/` folder
            - Keep bibliography in `references.bib`

            ### Response Style
            - Be concise but thorough
            - Explain your changes briefly
            - When creating files, confirm what was created
            - If the user's request is ambiguous, ask for clarification
            - Proactively suggest improvements when appropriate

            ### Workflow
            1. Understand the user's intent
            2. Plan the document structure if needed
            3. Create or modify files using available tools
            4. Summarize what was done

            You have access to tools for file operations. Use them to build the user's LaTeX project incrementally."""
        )


        agent = agent_instance.get_agent()


        result =await agent.ainvoke({"messages":full_history_block},
                                    context=AgentContext(
                                        project_id=project_id
                                    )
                                    )
        

        return str(result["messages"][-1].content)

    except Exception as e:
        print(f"error happend {e}")
        return f"I apologize, but I encountered an error: {str(e)}. Please try again or rephrase your question."