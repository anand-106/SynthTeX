import LatexEditor from "./latexEditor";



export function EditorSection({latex,setLatex}:{latex:string,setLatex:React.Dispatch<React.SetStateAction<string>>}){
    
    return <div className="h-full flex-1">
        <LatexEditor value={latex} onChange={setLatex} />
    </div>
}