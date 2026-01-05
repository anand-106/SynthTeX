import BlurText from "@/components/BlurText";
import Link from "next/link";
import { MdOutlineArrowOutward } from "react-icons/md";
import { Features } from "./components/features";


export default function Home(){

  return <div className="min-h-screen w-full relative bg-[#0A0A0A]">

  <div
    className="absolute inset-0 z-0"
    style={{
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.25), transparent 70%), #000000",
    }}
  />

  <Page />
</div>
}
 function Page() {
  return (
    
    <div className="flex flex-col items-center h-screen w-screen  absolute inset-0 z-10 overflow-y-auto scrollbar scrollbar-none">
      <div className="text-center mt-48">
      <Header />
      </div>
      <Buttons />
      <div className="mt-[100px]">

      <Features />
      </div>
    </div>
  );
}


function Header(){
  return <div className="flex flex-col items-center bg-transparent">
<BlurText
        text="SynthTex"
        delay={150}
        animateBy="words"
        direction="top"
        className="text-8xl mb-8 font-gsans font-black"
      />
    <BlurText
        text="The Cursor for Latex!"
        delay={200}
        animateBy="words"
        direction="top"
        className="text-6xl mb-8 font-gsans font-bold"
      />
      <h1 className="text-white/70 max-w-[500px] fade-in">
      Write LaTeX documents with AI assistance. Chat with your code, preview in real-time, and compile to PDF—all in one place.
      </h1>
  </div>
}

function Buttons(){
  return <Link href='/dashboard'>
  <div className="flex justify-center gap-2 w-[200px] rounded-full backdrop-blur-2xl bg-white/10 border border-white/15 py-3 mt-14">
    <h1 className="font-semibold" >Continue</h1>
    <MdOutlineArrowOutward size={24} />
  </div>
  </Link>
}