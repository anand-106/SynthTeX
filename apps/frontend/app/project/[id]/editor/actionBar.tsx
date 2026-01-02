"use client"
import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { JobData } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react";
import { BsArrowRepeat } from "react-icons/bs";


export function ActionBar(){
    const [compileID, setCompileID] = useState<string | null>(null)

    const param = useParams()
    const activeFileName = useEditorStore(state=>state.selectedFilePath)
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
            queryClient.invalidateQueries({ queryKey: [`Project_tree_${project_id}`] })

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
        <div className="h-[45px] bg-[#151515] flex items-center justify-between border-b border-white/20 mb-[15px] px-4">
            <h1 className="font-semibold text-lg">{filename}</h1>
            <CompileButton 
                compileStatus={getDisplayStatus()} 
                onCompile={() => compileMutation.mutate()}
            />
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
            className={`${compileStatus === 'success' ? 'bg-green-400/50' : compileStatus === 'failed' ? 'bg-red-500' : 'bg-white/20'} rounded-full p-2 text-xs cursor-pointer flex justify-center items-center gap-1 disabled:cursor-not-allowed`}
            onClick={onCompile}
        >
            <h1 className="font-semibold text-sm">{CompileMsg[compileStatus]}</h1>
            <BsArrowRepeat size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
    )
}
