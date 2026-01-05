import { BsStars } from "react-icons/bs";
import { IconType } from "react-icons/lib";

type CardData = {
    icon:IconType,
    title:string,
    desc:string
}

const cards:CardData[] = [
    {
        icon:BsStars,
        title:"AI-Powered Assistant",
        desc:"Chat with an intelligent agent that understands LaTeX syntax, project structure, and can create, modify, and manage your files through natural language."
    }
]

export function Features(){
    return <div className="w-full flex flex-wrap justify-center">
        {
           cards.map((c,idx)=>{
return <Card key={idx} icon={c.icon} title={c.title} desc={c.desc} />
           }) 
        }
    </div>
}

function Card(data:CardData){
    return <div className="flex flex-col justify-center items-center p-5 w-[300px] text-center gap-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <data.icon size={40} />
        <h1 className="text-xl font-bold" >{data.title}</h1>
        <h1 className="text-sm text-white/80 ">{data.desc}</h1>
    </div>
}