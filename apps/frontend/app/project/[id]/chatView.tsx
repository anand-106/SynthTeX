import { ChatMessage } from "@/types/types";

export function ChatView({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col">
      {messages.map((mes) => {
        return mes.role === "user" ? (
          <UserMessage key={mes.id} message={mes} />
        ) : (
          <AIMessage key={mes.id} message={mes} />
        );
      })}
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="bg-slate-800 rounded-lg p-2">
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
        <div className=" px-2 py-4">
          <h1 className="break-all whitespace-pre-wrap text-sm">
            {mes_dict.text}
          </h1>
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
  }
}
