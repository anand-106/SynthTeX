import { Project } from "@/types/types";

export function SortArray(arr:Project[],order:"asc"|"dsc"){
    return arr.sort((a,b)=>{
        const DateA = new Date(a.created_at).getTime()
        const DateB = new Date(b.created_at).getTime()

        return order === "asc"?DateA-DateB:DateB-DateA
    })
}