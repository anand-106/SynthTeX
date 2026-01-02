"use client"
import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation"
import { useRef, useState } from "react";
import { BsArrowRepeat } from "react-icons/bs";


export function ActionBar(){

    const [compileID,setCompileID] = useState("")
    const [compileStatus,setCompileStatus] = useState<"idle"|"queued"|"running"|"success"|"failed">("idle")

    

    const param = useParams()
    const activeFileName = useEditorStore(state=>state.selectedFilePath)
    const filename = activeFileName?.split('/').pop()
    const project_id = param.id;
    const intervalRef = useRef<any| null>(null);

    const {getToken} = useAuth()

    const getCompileStatus =async(jobID:string)=>{
        setCompileStatus("queued")
        try{
            const token = await getToken()

            const res = await axiosClient.get(`/compile/${jobID}/status`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })
            setCompileStatus(res.data.status)

            if(res.data.status==="success"||res.data.status==="failed"){
                setTimeout(setCompileStatus,5000,"idle")
                if(intervalRef.current)clearInterval(intervalRef.current)

            }
        }
        catch(err){
            console.log(err)
        }
    }



    const sendLatexCompileJob =async()=>{
        try{
            const token = await getToken()
           const res =  await axiosClient.post('/compile',{
                project_id:project_id
            },{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })

            setCompileID(res.data.job_id)

            setCompileStatus("queued")

             intervalRef.current = setInterval(getCompileStatus,2000,res.data.job_id)

        }catch(err){
            console.error(err)
        }
    }

    return <div className="h-[45px] bg-[#151515] flex items-center justify-between border-b border-white/20 mb-[15px] px-4">
        <h1 className=" font-semibold text-lg">{filename}</h1>
        <div>

        {/* <button className="bg-slate-700 rounded-full p-1 text-xs cursor-pointer"
        onClick={()=>{setActiveEditorTab("preview")}}
        >
            Preview
        </button> */}

        <CompileButton compileStatus={compileStatus} sendLatexCompileJob={sendLatexCompileJob} />
        
            </div>
    </div>
}

function CompileButton({sendLatexCompileJob,compileStatus}:{sendLatexCompileJob:() => Promise<void>,compileStatus:"idle"|"queued"|"running"|"success"|"failed"}){

    const CompileMsg ={
        "idle":"Compile",
        "queued":"Compiling",
        "running":"Compiling",
        "success": "Compiled",
        "failed": "Compile Failed"
    }

    const CompileCSSIcon ={
        "idle":"",
        "queued":"animate-spin",
        "running":"animate-spin",
        "success": "",
        "failed": ""
    }

    const CompileCSSButton ={
        "idle":"bg-white/20",
        "queued":"bg-white/20",
        "running":"bg-white/20",
        "success": "bg-green-400/50",
        "failed": "bg-red-500"
    }

return <button disabled={compileStatus==="queued"||compileStatus==="running"} className={`${CompileCSSButton[compileStatus]} rounded-full p-2 text-xs cursor-pointer flex justify-center items-center gap-1 disabled:cursor-not-allowed`}
onClick={sendLatexCompileJob}
>
    <h1 className="font-semibold text-sm">{CompileMsg[compileStatus]}</h1>
    <BsArrowRepeat size={18} className={`${CompileCSSIcon[compileStatus]}`} />
</button>
}