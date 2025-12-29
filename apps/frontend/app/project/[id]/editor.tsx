import { ActionBar } from "./actionBar";
import LatexEditor from "./latexEditor";



export function EditorSection({latex,setLatex}:{latex:string,setLatex:React.Dispatch<React.SetStateAction<string>>}){
    
    return <div className="h-full flex-1">
        <ActionBar/>
        <LatexEditor value={latex} onChange={setLatex} />
    </div>
}