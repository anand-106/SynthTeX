"use client"
import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { JobData } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react";
import { BsArrowRepeat } from "react-icons/bs";
import { FaRegSave } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";


export function ActionBar(){
    const [compileID, setCompileID] = useState<string | null>(null)

    const param = useParams()
    const activeFileName = useEditorStore(state=>state.selectedFilePath)
    const fileType = useEditorStore(state=>state.fileType)
    const filename = activeFileName?.split('/').pop()
    const project_id = param.id;

    const { getToken } = useAuth()
    const queryClient = useQueryClient()

    const fetchCompileStatus = async (jobID: string): Promise<JobData> => {
        const token = await getToken()
        const res = await axiosClient.get(`/compile/${jobID}/status`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        return res.data
    }


    const compileMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken()
            const res = await axiosClient.post('/compile', {
                project_id: project_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        },
        onSuccess: (data) => {
            setCompileID(data.job_id)  
        }
    })

    const { data: jobStatus } = useQuery<JobData>({
        queryKey: ['compile-job', compileID],
        queryFn: () => fetchCompileStatus(compileID!),
        enabled: !!compileID,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return (status === 'success' || status === 'failed') ? false : 2000
        }
    })

 
    useEffect(() => {
        if (jobStatus?.status === 'success') {

            setTimeout(() => setCompileID(null), 3000)
        }
        if (jobStatus?.status === 'failed') {
            setTimeout(() => setCompileID(null), 3000)
        }
    }, [jobStatus?.status, queryClient, project_id])

    const getDisplayStatus = (): "idle"|"queued"|"running"|"success"|"failed" => {
        if (compileMutation.isPending) return 'queued'
        if (jobStatus?.status) return jobStatus.status
        return 'idle'
    }

    return (
        <div className="h-[45px] bg-[#151515] flex items-center justify-between border-b border-white/20 px-4">
            <h1 className="font-semibold text-lg">{filename}</h1>
            <div className="flex gap-4">
                {

        fileType!="latex"?<DownloadButton />:<SaveButton />
                }
            <CompileButton 
                compileStatus={getDisplayStatus()} 
                onCompile={() => compileMutation.mutate()}
                />
                </div>
        </div>
    )
}

function CompileButton({ compileStatus, onCompile }: { 
    compileStatus: "idle"|"queued"|"running"|"success"|"failed",
    onCompile: () => void 
}){
    const CompileMsg = {
        "idle": "Compile",
        "queued": "Compiling",
        "running": "Compiling",
        "success": "Compiled",
        "failed": "Compile Failed"
    }

    const isLoading = compileStatus === "queued" || compileStatus === "running"

    return (
        <button 
            disabled={isLoading} 
            className={`${compileStatus === 'success' ? 'bg-green-400/50' : compileStatus === 'failed' ? 'bg-red-500' : 'bg-white/10'} rounded-lg p-2 text-xs cursor-pointer flex justify-center items-center gap-1 disabled:cursor-not-allowed`}
            onClick={onCompile}
        >
            <h1 className="font-semibold text-sm">{CompileMsg[compileStatus]}</h1>
            <BsArrowRepeat size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
    )
}

function SaveButton(){

    const {getToken} = useAuth()

    const queryClient = useQueryClient()

    const fileId = useEditorStore(state=>state.selectedFileId)
    const content = useEditorStore(state=>state.latex)
    const filePath = useEditorStore(state=>state.selectedFilePath)

    const saveFile =async ()=>{
        const token = await getToken()
        const res = await axiosClient.put(`/file/${fileId}`,{
            content:content
        },{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })

        return res.data
    }

    const saveMutation = useMutation({
        mutationFn:saveFile,

        onSuccess:()=>{
            if(filePath){
                queryClient.setQueryData(['file',filePath],{
                    type: "latex" as const,
                    content : content,
                    path: filePath
                })
            }
        }

    })

    return <button
    onClick={()=>saveMutation.mutate()}
    disabled={saveMutation.isPending}
    className={`cursor-pointer bg-white/10 rounded-lg flex gap-2 items-center justify-center disabled:cursor-not-allowed p-2`}
    >
        <h1 className="font-semibold text-sm">{
            saveMutation.isPending?"Saving...":"Save"
            }</h1>
            <FaRegSave size={18} />
    </button>
}


function DownloadButton() {
    const { getToken } = useAuth();
    const fileId = useEditorStore((state) => state.selectedFileId);
  
    const downloadMutation = useMutation({
      mutationFn: async () => {
        const token = await getToken();
  
        const res = await axiosClient.get(`/file/${fileId}/download`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        return res.data.url;
      },
      onSuccess: (downloadUrl) => {
        window.location.href = downloadUrl;
      },
    });
  
    return (
      <button
        disabled={downloadMutation.isPending}
        onClick={() => downloadMutation.mutate()}
        className="cursor-pointer bg-white/10 rounded-lg flex gap-2 items-center justify-center disabled:cursor-not-allowed p-2"
      >
        <h1 className="font-semibold text-sm">
        {downloadMutation.isPending ? "Preparing…" : "Download"}
        </h1>
        <FiDownload size={18} />
      </button>
    );
  }
  