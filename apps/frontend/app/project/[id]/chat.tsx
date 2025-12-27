"use client";
import { FaArrowCircleUp } from "react-icons/fa";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { ChatMessage } from "@/types/types";

export function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

  return (
    <div className="w-[400px] h-full border-l border-white/50 flex flex-col">
      <div className="w-full flex-1"></div>
      <div className="w-full p-2">
        <ChatBar setMessages={setMessages} />
      </div>
    </div>
  );
}

function ChatBar({setMessages}:{setMessages:Dispatch<SetStateAction<ChatMessage[]>>}) {

    const [userMessage, setUserMessage] = useState("");

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

          if (data.sender === "assistant") {
            const aiMessage: ChatMessage = {
              id: data.id,
              project_id:data.project_id,
              created_at:data.created_at,
              content: data.content,
              role: "assistant",
            };
            setMessages((prev) => [...prev, aiMessage]);
          } else {
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
  return (
    <div className="w-full border border-white/20 rounded-lg p-2 flex flex-col items-end">
      <input
        className="outline-0 h-[100px] w-full  p-2"
        value={userMessage}
        placeholder="Enter your message."
        onChange={(e) => setUserMessage(e.target.value)}
      />
      <div className=" cursor-pointer">
        <FaArrowCircleUp size={24} />
      </div>
    </div>
  );
}
