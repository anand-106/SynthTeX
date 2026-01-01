"use client"
import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation"
import { BsArrowRepeat } from "react-icons/bs";


export function ActionBar(){

    const param = useParams()
    const {setActiveEditorTab} = useEditorStore.getState()
    const activeFileName = useEditorStore(state=>state.selectedFilePath)
    const filename = activeFileName?.split('/').pop()
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

    return <div className="h-[45px] bg-[#151515] flex items-center justify-between border-b border-white/20 mb-[15px]">
        <h1 className="pl-4 font-semibold text-lg">{filename}</h1>
        <div>

        {/* <button className="bg-slate-700 rounded-full p-1 text-xs cursor-pointer"
        onClick={()=>{setActiveEditorTab("preview")}}
        >
            Preview
        </button> */}
        <button className="bg-white/20 rounded-full p-2 text-xs cursor-pointer flex justify-center items-center gap-1"
        onClick={sendLatexCompileJob}
        >
            <h1 className="font-semibold text-sm">Compile</h1>
            <BsArrowRepeat size={18} />
        </button>
            </div>
    </div>
}