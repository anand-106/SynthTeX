"use client";
import { FaArrowCircleUp } from "react-icons/fa";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { ChatMessage } from "@/types/types";
import { ChatView } from "./chatView";
import axiosClient from "@/lib/axiosClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchAndReplace } from "@/utils/tool_utils";

export function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const param = useParams()
    
    const project_id = param.id
    const {getToken} = useAuth()

    const get_messages = async ()=>{
      try{
        const token = await getToken()
        const res = await axiosClient.get(`/chat/project/${project_id}`,{
          headers:{
            Authorization:`Bearer ${token}`
          }
        })
        setMessages(res.data)
        return res.data
      }
      catch(err){
        console.error(err)
      }
    }

    const {data,isLoading,error} = useQuery<ChatMessage[]>({
      queryKey:[`project_chat_${project_id}`],
      queryFn: get_messages,
      staleTime: 5*60*1000,
      refetchOnWindowFocus:false,
      refetchOnMount:false
  })

  if (isLoading) return <div><h1>Loading...</h1></div>
  if (error) return <div><h1>Error getting data sources.</h1></div>
  return (
    <div className="w-[400px] h-full border-l border-white/50 flex flex-col overflow-hidden">
      <div className="w-full flex-1 overflow-y-auto scrollbar-none">
        <ChatView messages={messages} />
      </div>

      <div className="w-full p-2">

        <ChatBar setMessages={setMessages} />
      </div>
    </div>
  );
}


function ChatBar({setMessages}:{setMessages:Dispatch<SetStateAction<ChatMessage[]>>}) {

    const [userMessage, setUserMessage] = useState("");
    const queryClient = useQueryClient();

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const { getToken } = useAuth();

  const params = useParams();
  const projectId = params.id;

  useEffect(() => {
    let ws: WebSocket;

    const connectWS = async () => {
      const token = await getToken();
    
      ws = new WebSocket(
        `ws://localhost:8000/ws/project/${projectId}?token=${encodeURIComponent(token || "")}`
      );

      ws.onopen = () => {
        console.log("WebSocket connected");
        retryRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.sender === "model") {
            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              project_id:data.project_id,
              created_at:data.created_at,
              content: data.content,
              role: "model",
            };
            setMessages((prev) => [...prev, aiMessage]);

            const parsedContent=JSON.parse(data.content)

            if(parsedContent.type=="tool_call" && parsedContent.name === "search_replace")
            {

              const args = parsedContent.args;
              const replaceText = searchAndReplace(args.old_string,args.new_string,args.file_path)
              queryClient.setQueryData(['file',args.file_path],replaceText)

            }
          }
          if (data.sender === "tools") {
            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              project_id:data.project_id,
              created_at:data.created_at,
              content: data.content,
              role: "tools",
            };
            setMessages((prev) => [...prev, aiMessage]);
          } 
          else {
            console.log("from ws: ", data);
          }
        } catch {
          console.log("Non-JSON message:", event.data);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        socketRef.current = null;
        retryConnection();
      };
      ws.onerror = (err) => {
        console.error(" WebSocket error:", err);
        socketRef.current = null;
        retryConnection();
      };

      socketRef.current = ws;
      setSocket(ws);
    };

    const retryConnection = () => {
      const maxRetries = 5;
      if (retryRef.current > maxRetries) {
        console.log("Maximum retries reached");
        return;
      }

      const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
      console.log(`retrying in ${delay}ms`);

      setTimeout(() => {
        retryRef.current += 1;
        connectWS();
      }, delay);
    };

    connectWS();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [projectId, getToken, setMessages]);

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    if(!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN){
      console.error("WebSocket is not connected");
      return;
    }

    const msg: ChatMessage = {
        id:null,
        project_id:projectId!.toString(),
      content: userMessage,
      created_at:null,
      role: "user",
    };

    
    setMessages((prev) => [...prev, msg]);

   
    socketRef.current.send(JSON.stringify({ content: userMessage }));

    setUserMessage("");
  };

  return (
    <div className="w-full border border-white/20 rounded-lg p-2 flex flex-col items-end">
      <textarea
        className="outline-0 h-[100px] w-full  p-2"
        value={userMessage}
        placeholder="Enter your message."
        onChange={(e) => setUserMessage(e.target.value)}
        onKeyDown={(e)=>{
          if(e.key=="Enter") sendMessage()
        }}
      />
      <div className=" cursor-pointer"
      onClick={sendMessage}
      
      >
        <FaArrowCircleUp size={24} />
      </div>
    </div>
  );
}
