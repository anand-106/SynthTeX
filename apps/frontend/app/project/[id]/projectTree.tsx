import axiosClient from "@/lib/axiosClient";
import { FileTreeNode, FileTreeResponse } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Tree,NodeRendererProps, NodeApi } from "react-arborist";
import { FaFolder } from "react-icons/fa";
import { FaFile } from "react-icons/fa";

export function ProjectTree(){

    const {getToken} = useAuth()
    const param = useParams()

    const projectId = param.id

    const getProjectTree= async()=>{
        try{
            const token = await getToken()

            const res = await axiosClient.get(`/project/${projectId}/files`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })

            return res.data
        }
        catch(err){
            console.error(err)
        }
    }

    const {data,isLoading,error} = useQuery<FileTreeResponse>({
        queryKey:[`Project_tree_${projectId}`],
        queryFn: getProjectTree,
        staleTime: 5*60*1000,
        refetchOnWindowFocus:false,
        refetchOnMount:false
    })

    if (isLoading) return <div className=" h-full w-[200px]"><h1>Loading...</h1></div>
    if (error) return <div className=" h-full w-[200px]"><h1>Error getting data sources.</h1></div>

    return <div className=" h-full w-[250px] border-r border-white/20 px-4">
        <Tree initialData={data?.tree}
        width={250}
        indent={16}
        rowHeight={28}

        >
        {Node}
        </Tree>
    </div>
}

function Node({node,style,dragHandle}:NodeRendererProps<FileTreeNode>){
    const isFolder = node.data.isFolder
    return <div style={style} ref={dragHandle}>
        {
            isFolder?<Folder node={node} />:<File node={node} />
        }
    </div>
}

function Folder({node}:{node:NodeApi<FileTreeNode>}){
    return <div className="flex">
        <FaFolder /> 
        <h1>{node.data.name}</h1>
    </div>
}

function File({node}:{node:NodeApi<FileTreeNode>}){
    return <div className="flex gap-2 items-center">
        <FaFile /> 
        <h1>{node.data.name}</h1>
    </div>
}