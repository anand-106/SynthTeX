from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from dotenv import load_dotenv
import os

from agent.tools.fs_tools import create_file, list_files, get_file_content, search_replace, delete_file

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=api_key,
    temperature=0.1,        
    max_tokens=4096,          
    max_retries=5,
)

# api_key = os.getenv("GOOGLE_API_KEY")
# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     google_api_key=api_key
# )

class RepoAgent:

    def __init__(self,system_prompt:str) -> None:
        self.system_prompt = system_prompt
        self.tools = [create_file, list_files, get_file_content, search_replace, delete_file]
        self.agent = self._create_agent()
        
    
    def _create_agent(self):
        return create_agent(model="groq:openai/gpt-oss-120b",system_prompt=self.system_prompt,tools=self.tools)

    def get_agent(self):
        return self.agent

