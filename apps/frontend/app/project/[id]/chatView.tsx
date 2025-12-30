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
    // console.log("Raw content:", message.content);
    // console.log("Type of content:", typeof message.content);
    const mes_dict = JSON.parse(message.content)
    if (mes_dict.type == 'text')
     return <div className=" px-2 py-4">
        <h1 className="break-all whitespace-pre-wrap text-sm">
            {mes_dict.text}
        </h1>
    </div>

    if (mes_dict.type == 'tool_call'){

        console.log(mes_dict)
    return <div className=" px-2 py-4">
    <h1 className="break-all whitespace-pre-wrap text-sm">
        Tool Call: {mes_dict.name}
    </h1>
    </div>
    } 
}
  