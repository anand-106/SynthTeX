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
    role:"user"|"model"|"tools",
}

export type FileTreeNode = {
    id: string;
    name: string;
    isFolder: boolean;
    fileType?: "source" | "knowledge_base";
    children?: FileTreeNode[];
  };
  
  export type FileTreeResponse = {
    project_id: string;
    tree: FileTreeNode[];
  };


  export type SelectedFile ={
    type : "latex" | "pdf",
    content : string
  }