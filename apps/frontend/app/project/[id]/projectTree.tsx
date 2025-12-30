import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { FileTreeNode, FileTreeResponse, SelectedFile } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { CSSProperties } from "react";
import { Tree,NodeRendererProps, NodeApi } from "react-arborist";
import { FaFolder } from "react-icons/fa";
import { FaFolderOpen } from "react-icons/fa";
import { FaFile } from "react-icons/fa";

export function ProjectTree(){

    const {getToken} = useAuth()
    const param = useParams()
    const queryClient = useQueryClient();

    const projectId = param.id
    const {setLatex} = useEditorStore.getState()
    const {setSelectedFile} = useEditorStore.getState()

    

    const FetchFileContent = async (fileId:string,FileName:string,path:string) =>{
        try{
            const token = await getToken();
            const isPDF = FileName.toLowerCase().endsWith('.pdf')
            if(isPDF){
                const res = await axiosClient.get(`/file/${fileId}/url`,{
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
            
                })
                console.log("received presigned url",res.data.url)
                setSelectedFile(fileId,path,res.data.url,"pdf")
            }
            else{

                const cached = queryClient.getQueryData<SelectedFile>(['file',path])

                if(cached){
                    setSelectedFile(fileId,path,cached.content,"latex")
                    setLatex(cached.content)
                }
                else{
                    const res = await axiosClient.get(`/file/${fileId}`,{
                        headers:{
                            Authorization:`Bearer ${token}`
                        }
                    })
                    const data =  {
                        "type":"latex" as const,
                        "content":res.data.content,
                        "path":path
                    }
                    queryClient.setQueryData(['file',path],data)
                    setSelectedFile(fileId,path,res.data.content,"latex")
                    setLatex(res.data.content)



                }

                
                
            }
        }
        catch(err){
            console.error(err)
        }
    }

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
        {(props)=><Node {...props} onFileClick={FetchFileContent} />}
        </Tree>
    </div>
}

function Node({node,style,onFileClick}:{node:NodeApi<FileTreeNode>,style:CSSProperties,onFileClick:(id:string,FileName:string,path:string)=>Promise<void>}){
    const isFolder = node.data.isFolder
    return <div style={style}>
        {
            isFolder?<Folder node={node} />:<File onFileClick={onFileClick} node={node} />
        }
    </div>
}

function Folder({node}:{node:NodeApi<FileTreeNode>}){
    return <div className="flex gap-2 items-center  cursor-pointer"
    onClick={()=>node.toggle()}
    >{

        node.isOpen?<FaFolderOpen/>:<FaFolder /> 
    }
        <h1>{node.data.name}</h1>
    </div>
}

function File({node,onFileClick}:{node:NodeApi<FileTreeNode>,onFileClick:(id:string,fileName:string,path:string)=>void}){




    return <div className="flex gap-2 items-center  cursor-pointer"
    onClick={()=>{
        onFileClick(node.data.id,node.data.name,node.data.path!)
    }}
    >
        <FaFile size={15} /> 
        <h1>{node.data.name}</h1>
    </div>
}