"use client"

import axiosClient from "@/lib/axiosClient";
import { KBFile } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { RiFileAddLine } from "react-icons/ri";
export function AddKBFiles(){
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[] | null>(null);

    const param = useParams()
    const {getToken} = useAuth()
    const queryClient = useQueryClient()

    const project_id = param.id;

    const openFileDialog=() =>{
        inputRef.current?.click()
    }

    const onFilesSelected = async (
        e: React.ChangeEvent<HTMLInputElement>
      ) =>{
    
            if(!e.target.files)return

            const token = await getToken();
            const selectedFiles = Array.from(e.target.files);
            setFiles(selectedFiles);

            const res = await axiosClient.post(`/${project_id}/file/presign`,selectedFiles.map(f=>({
                filename:f.name,
                content_type:f.type
            })),{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })

            const uploadURLS = res.data

            if(Array.isArray(uploadURLS)){

                await Promise.all(
                    uploadURLS.map(async (url:KBFile,i)=>{
                    const uploadRes = await fetch(url.upload_url, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": selectedFiles[i].type
                        },
                        body: selectedFiles[i]
                    });
                    if (!uploadRes.ok) {
                        throw new Error(`Upload failed: ${uploadRes.statusText}`);
                    }

                    const confirmRes = await axiosClient.post('/file/confirm',{
                        project_id: project_id,
                        key:url.key,
                        filename:selectedFiles[i].name
                    },{
                        headers:{
                            Authorization: `Bearer ${token}`
                        }
                    })

                    return confirmRes
                })
                
            )
            }


        queryClient.invalidateQueries({
            queryKey:[`KB_tree_${project_id}`]
        })
      }
    

    return <div className="cursor-pointer flex justify-center items-center "
    onClick={openFileDialog}
    >
        <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onFilesSelected}
        hidden={true}
        />
        <RiFileAddLine />
    </div>
}