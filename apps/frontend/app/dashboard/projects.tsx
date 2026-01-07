"use client";

import axiosClient from "@/lib/axiosClient";
import { Project } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import CreateProjectModal from "./createProjectModal";
import { useRouter } from "next/navigation";
import { SortArray } from "@/utils/sortItems";

export function ProjectsList() {
  const { getToken } = useAuth();

  const router = useRouter()

  const handleCreateProject =async (name: string, description: string) => {
    console.log("Create project:", name, description);

    try{
      const token =await getToken();
      const res = await axiosClient.post("/project",{name,description},{
        headers:{
          Authorization:`Bearer ${token}`
        }
    
      })
      router.push(`project/${res.data.project_id}`)
    }catch(e){
      console.error(e)
    }
  };

  const getProjects = async () => {
    try {
      const token = await getToken();

      const res = await axiosClient.get("/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const { data, isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading)
    return (
      <div className="w-full h-full flex justify-center items-center mt-[-200px]">
        <h1 className="text-white/50">Loading...</h1>
      </div>
    );
  if (error)
    return (
        <div className="w-full h-full flex justify-center items-center mt-[-200px]">
        <h1 className="text-white/50">Error getting data sources.</h1>
      </div>
    );
  if (data)
  {
    const sortedData = SortArray(data,"dsc")

    return (
      <div className="flex gap-6 flex-wrap fade-in">
        <CreateProjectModal onCreate={handleCreateProject} />
        {sortedData.map((pro) => (
          <ProjectCard project={pro} key={pro.id} />
        ))}
      </div>
    );
  }
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/project/${project.id}`}>
      <div className="h-[150px] w-[250px] flex flex-col justify-evenly bg-linear-to-tl from-white/20 to-transparent font-gsans p-4 rounded-2xl border border-white/15">
        <h1 className="font-bold text-lg">{project.name}</h1>
        {project.description && <h1>{project.description}</h1>}
        <div className="flex justify-between">

        <h1 className="text-sm text-white/50">
          {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(project.created_at))}
        </h1>
        <FaArrowRight />
      </div>
              </div>
    </Link>
  );
}
