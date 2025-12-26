"use client"

import { FaRegPlusSquare } from "react-icons/fa";
import { ProjectsList } from "./projects";
import CreateProjectModal from "./createProjectModal";
import axiosClient from "@/lib/axiosClient";
import { useAuth } from "@clerk/nextjs";

export default function DashBoard() {

  const {getToken} = useAuth()

  const handleCreateProject =async (name: string, description: string) => {
    console.log("Create project:", name, description);

    try{
      const token =await getToken();
      await axiosClient.post("/project",{name,description},{
        headers:{
          Authorization:`Bearer ${token}`
        }
      })
    }catch(e){
      console.error(e)
    }
  };

  return (
    <div className=" h-screen w-screen bg-[#0A0A0A]">
      <CreateProjectModal onCreate={handleCreateProject} />
      <ProjectsList />
    </div>
  );
}
