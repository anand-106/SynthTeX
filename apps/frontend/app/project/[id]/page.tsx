"use client";

import axiosClient from "@/lib/axiosClient";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Chat } from "./chat";
import { EditorSection } from "./editor";
import { Project, SelectedFile } from "@/types/types";
import { ProjectTree } from "./projectTree";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editorStore";


const PDFViewer = dynamic(
  () => import('./pdfView').then(mod => mod.PDFViewer),
  { ssr: false }
);



export default function ProjectPage() {
  const params = useParams();
  const { getToken } = useAuth();
  
  const queryClient = useQueryClient();
  const selectedFileType = useEditorStore((state)=>state.fileType)
  const selectedFileContent = useEditorStore(state=>state.latex)
  const projectId = params.id;

  if (!projectId) {
    return (
      <div>
        <h1>Invalid project ID</h1>
      </div>
    );
  }

  const getProject = async () => {
    
      const token = await getToken();
      const res = await axiosClient.get(`/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
  };

  const preFetchProject =async ()=>{
    
      const token= await getToken()
      const res = await axiosClient.get(`/project/${projectId}/source-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      res.data.files.forEach((file:{id:string,filename:string,content:string,path:string})=>{
          queryClient.setQueryData(['file',file.path],{
            type:'latex',
            content: file.content
          })
      })

      console.log(res,data)

      return res.data
  }
  const projectLoad =useQuery({
    queryKey:[`project_source_files_${projectId}`],
    queryFn:preFetchProject,
    staleTime:10*60*1000,
    refetchOnWindowFocus:false,
    refetchOnMount:false
  })

  const { data, isLoading, error } = useQuery<Project>({
    queryKey: [`project_${projectId}`],
    queryFn: getProject,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading || projectLoad.isLoading)
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  if (error || projectLoad.error)
    return (
      <div>
        <h1>Error getting data sources.</h1>
      </div>
    );
  if (data && projectLoad.data)
    return (
      <div className=" h-[calc(100vh-4rem)] w-screen flex flex-col">
        {/* <h1>{data.name}</h1> */}
        <div className="w-full flex-1 flex h-full">
        <ProjectTree />
        {
          selectedFileType=="latex"?<EditorSection />:<PDFViewer url={selectedFileContent} />
        }
        
        <Chat />
        </div>
      </div>
    );
}
