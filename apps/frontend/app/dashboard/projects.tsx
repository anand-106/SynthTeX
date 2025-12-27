"use client"

import axiosClient from "@/lib/axiosClient";
import { Project } from "@/types/types";
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function ProjectsList(){

    const {getToken} = useAuth()

    const getProjects =async ()=>{
        try{
            const token = await getToken();

            const res = await axiosClient.get('/projects',{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })

            return res.data
        }catch(e){
            console.error(e)
        }
    }

    const {data,isLoading,error} = useQuery<Project[]>({
        queryKey:["projects"],
        queryFn: getProjects,
        staleTime: 5*60*1000,
        refetchOnWindowFocus:false,
        refetchOnMount:false
    })

    if (isLoading) return <div><h1>Loading...</h1></div>
    if (error) return <div><h1>Error getting data sources.</h1></div>
    if (data) return data.map(pro=><ProjectCard project={pro} key={pro.id} />)
}

function ProjectCard({project}:{project:Project}){

    return   <Link href={`/project/${project.id}`}>
    <div>
        <h1>{project.name}</h1>
        {
            project.description&&(<h1>{project.description}</h1>)
        }
        <h1>{project.created_at}</h1>
    </div>
        </Link>
   
}
