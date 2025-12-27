export interface Project {
    id:string;
    name:string;
    description?:string | null;
    created_at: string;
}

export type ChatMessage = {
    id:number | null,
    project_id:string,
    content:string,
    created_at:string | null,
    role:"user"|"assistant",
}