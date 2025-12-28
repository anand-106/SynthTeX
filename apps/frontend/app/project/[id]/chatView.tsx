import { ChatMessage } from "@/types/types";

export function ChatView({messages}:{messages:ChatMessage[]}){
    return <div className="flex flex-col">
        {
            messages.map(mes=>{
                return mes.role==="user"?<UserMessage key={mes.id} message={mes} />:<AIMessage key={mes.id} message={mes} />
            })
        }
    </div>
  }

function UserMessage({message}:{message:ChatMessage}){
    return <div className="bg-slate-800 rounded-lg p-2">
        <h1>{message.content}</h1>
    </div>
}

function AIMessage({message}:{message:ChatMessage}){
    return <div className=" px-2 py-4">
        <h1 className="break-all whitespace-pre-wrap text-sm">
            {message.content}
        </h1>
    </div>
}
  