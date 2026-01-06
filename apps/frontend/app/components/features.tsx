import { BsStars } from "react-icons/bs";
import { IconType } from "react-icons/lib";
import { FaCode } from "react-icons/fa6";
import { BsLayoutTextWindowReverse } from "react-icons/bs";

type CardData = {
    icon:IconType,
    title:string,
    desc:string,
    size:number
}

const cards:CardData[] = [
    {
        icon:BsStars,
        title:"AI-Powered Assistant",
        desc:"Chat with an intelligent agent that understands LaTeX syntax, project structure, and can create, modify, and manage your files through natural language.",
        size:40,
    },
    {
        icon:FaCode,
        title:"Smart LaTeX Editor",
        desc:"Monaco-based editor with LaTeX syntax highlighting, auto-completion, and intelligent code formatting for a seamless writing experience.",
        size:40
    },
    {
        icon:BsLayoutTextWindowReverse,
        title:"Start from Templates",
        desc: "Jumpstart your documents with pre-built LaTeX templates. One click to generate papers ready for journals, conferences, or classes—no setup required.",
        size:33
    }
]

export function Features(){
    return <div className="w-full flex flex-wrap justify-center gap-8">
        {
           cards.map((c,idx)=>{
return <Card key={idx} icon={c.icon} title={c.title} desc={c.desc} size={c.size} />
           }) 
        }
    </div>
}

function Card(data:CardData){
    return <div className="flex flex-col justify-center items-center p-5 w-[300px] text-center gap-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/15 hover:border-white/40 transition-colors duration-300 ease-out">
        <data.icon size={data.size} />
        <h1 className="text-xl font-semibold text-white/90" >{data.title}</h1>
        <h1 className="text-sm text-white/80 ">{data.desc}</h1>
    </div>
}