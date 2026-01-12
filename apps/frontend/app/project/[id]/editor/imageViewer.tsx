import Image from "next/image";

export default function ImageViewer({url}:{url:string}){
    
    return <div className="h-full flex-1 overflow-auto bg-[#151515] relative">
        <Image 
        src={url}
        alt=""
        fill
        className="object-contain"
        unoptimized
        />
    </div>
}