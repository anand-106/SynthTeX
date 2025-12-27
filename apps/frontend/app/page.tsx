import Link from "next/link";
import { MdOutlineArrowOutward } from "react-icons/md";

export default function Home() {
  return (
    <div className="flex flex-col items-center h-screen w-screen bg-[#0A0A0A]">
      <div className="text-center mt-30">
        <h1 className="text-6xl font-black">SynthTex</h1>
        <h1 className="text-3xl font-bold">Cursor for LaTex</h1> 
      </div>
      <Link href='/dashboard'>
      <div className="flex justify-center gap-2 w-[200px] rounded-full bg-white/20 py-2 mt-14">
        <h1>Continue</h1>
        <MdOutlineArrowOutward size={24} />
      </div>
      </Link>
    </div>
  );
}
