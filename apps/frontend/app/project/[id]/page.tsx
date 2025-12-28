"use client";

import axiosClient from "@/lib/axiosClient";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Chat } from "./chat";
import { EditorSection } from "./editor";
import { Project } from "@/types/types";
import { ProjectTree } from "./projectTree";

export default function ProjectPage() {
  const params = useParams();
  const { getToken } = useAuth();

  const projectId = params.id;

  if (!projectId) {
    return (
      <div>
        <h1>Invalid project ID</h1>
      </div>
    );
  }

  const getProject = async () => {
    try {
      const token = await getToken();
      const res = await axiosClient.get(`/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const { data, isLoading, error } = useQuery<Project>({
    queryKey: [`project_${projectId}`],
    queryFn: getProject,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading)
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  if (error)
    return (
      <div>
        <h1>Error getting data sources.</h1>
      </div>
    );
  if (data)
    return (
      <div className=" h-[calc(100vh-4rem)] w-screen flex flex-col">
        {/* <h1>{data.name}</h1> */}
        <div className="w-full flex-1 flex h-full">
        <ProjectTree />
        <EditorSection />
        <Chat />
        </div>
      </div>
    );
}
