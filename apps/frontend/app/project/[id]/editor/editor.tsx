import { useEditorStore } from "@/stores/editorStore";
import { ActionBar } from "./actionBar";
import LatexEditor from "./latexEditor";
import LatexPreview from "./latexPreview";



export function EditorSection(){
    const latex = useEditorStore((state)=>state.latex)
    const activeEditorTab = useEditorStore((state)=>state.activeEditorTab)

    const EditorMap = {
        "latex" : <LatexEditor latex={latex} />,
        "preview" : <LatexPreview source={latex} />
    }

    
    return <div className="h-full flex-1 flex flex-col overflow-hidden">
        <ActionBar/>
        <div className="flex-1 overflow-hidden">
            {activeEditorTab && EditorMap[activeEditorTab]}
        </div>
    </div>
}