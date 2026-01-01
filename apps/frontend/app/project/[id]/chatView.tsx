"use client"

import { ChatMessage } from "@/types/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { components } from "./markdown/markdownComponents";
import { useEffect, useRef } from "react";

export function ChatView({ messages }: { messages: ChatMessage[] }) {

  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    messageEndRef.current?.scrollIntoView({behavior:"smooth"})
  }
  ,[messages])

  return (
    <div className="flex flex-col px-2">
      {messages.map((mes) => {
        return mes.role === "user" ? (
          <UserMessage key={mes.id} message={mes} />
        ) : (
          <AIMessage key={mes.id} message={mes} />
        );
      })}
      <div ref={messageEndRef} />
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
      <h1>{message.content}</h1>
    </div>
  );
}

function AIMessage({ message }: { message: ChatMessage }) {
  // console.log("Raw content:", message.content);
  // console.log("Type of content:", typeof message.content);
  const mes_dict = JSON.parse(message.content);
  if (message.role == "model") {
    if (mes_dict.type == "text")
      return (
        <div className=" px-2 py-4 overflow-hidden">
          <div className="wrap-break-word overflow-wrap-anywhere text-sm prose prose-sm max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} components={components}>
              {mes_dict.text}
            </Markdown>
          </div>
        </div>
      );

    if (mes_dict.type == "tool_call") {
      switch (mes_dict.name) {
        case "get_file_content": {
          const fileName = mes_dict.args.file_path.split("/").pop();

          return (
            <div className="px-2 py-4">
              <h1 className="break-all whitespace-pre-wrap text-sm">
                Reading {fileName}
              </h1>
            </div>
          );
        }
        case "search_replace": {
          const fileName = mes_dict.args.file_path.split("/").pop();

          return (
            <div className="px-2 py-4">
              <h1 className="break-all whitespace-pre-wrap text-sm">
                Updating {fileName}
              </h1>
            </div>
          );
        }
        case "list_files": {
          return (
            <div className="px-2 py-4">
              <h1 className="break-all whitespace-pre-wrap text-sm">
                Listing files...
              </h1>
            </div>
          );
        }
        case "create_file":
            const fileName = mes_dict.args.relative_path;
            return (
                <div className="px-2 py-4">
                  <h1 className="break-all whitespace-pre-wrap text-sm">
                    Creating file: {fileName}
                  </h1>
                </div>
              );
      }
    }
  } else {
    console.log(mes_dict)
    if(mes_dict.type=="text"){
      const mesContent = JSON.parse(mes_dict.text)
      switch(mesContent.tool_name){
        case "create_file":{
          return <div className="px-2 py-4">
          <h1 className="break-all whitespace-pre-wrap text-sm">
            {mesContent.status} {mesContent.path}
          </h1>
        </div>
        }
        case "list_files":{
          const files = mesContent.files
          if(Array.isArray(files) && files.length > 0){

          return <div className="px-2 py-4">
          <div className="break-all whitespace-pre-wrap text-sm">
            {
              files.map((f,idx)=>{
                return <h1 key={idx}>{f.file_name}</h1>
              })
            }
          </div>
        </div>
          }
        }
      }
    }
    return null
  }
}
