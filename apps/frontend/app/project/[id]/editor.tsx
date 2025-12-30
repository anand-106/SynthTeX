import { ActionBar } from "./actionBar";
import LatexEditor from "./latexEditor";



export function EditorSection(){
    
    return <div className="h-full flex-1">
        <ActionBar/>
        <LatexEditor />
    </div>
}