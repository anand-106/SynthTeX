export interface Project {
    id:string;
    name:string;
    description?:string | null;
    created_at: string;
}

export type ChatMessage = {
    id:number,
    project_id:string,
    content:string,
    created_at:string,
    role:"user"|"assistant",
}