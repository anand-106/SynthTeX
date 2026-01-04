"use client"

import { ProjectsList } from "./projects";

export default function DashBoard() {



  return (
    <div className=" h-[calc(100vh-4rem)] w-screen bg-[#151515] px-[200px] pt-[70px] flex flex-col gap-[70px]">
      <Header />
      <ProjectsList />
    </div>
  );
}

function Header(){
   return <div className="flex font-gsans font-bold text-6xl">
    <h1 className="bg-linear-to-l from-purple-400 via-white to-white bg-clip-text text-transparent">Welcome to Synth</h1>
    <h1 className="bg-linear-to-l from-purple-700 to-purple-400 bg-clip-text text-transparent">Tex</h1>
    </div>
}
