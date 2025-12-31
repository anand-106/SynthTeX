"use client"
import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation"


export function ActionBar(){

    const param = useParams()
    const {setActiveEditorTab} = useEditorStore.getState()

    const project_id = param.id;

    const {getToken} = useAuth()

    const sendLatexCompileJob =async()=>{
        try{
            const token = await getToken()
            await axiosClient.post('/compile',{
                project_id:project_id
            },{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })
        }catch(err){
            console.error(err)
        }
    }

    return <div className="h-[25px] flex justify-end">
        <button className="bg-slate-700 rounded-full p-1 text-xs cursor-pointer"
        onClick={()=>{setActiveEditorTab("preview")}}
        >
            Preview
        </button>
        <button className="bg-slate-700 rounded-full p-1 text-xs cursor-pointer"
        onClick={sendLatexCompileJob}
        >
            Compile
        </button>
    </div>
}