import { Editor } from "@monaco-editor/react";


export function EditorSection(){
    return <div className="h-full flex-1">
        <Editor defaultLanguage="" />
    </div>
}