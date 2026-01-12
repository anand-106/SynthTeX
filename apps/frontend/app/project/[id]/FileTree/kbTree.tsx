"use client"

import axiosClient from "@/lib/axiosClient";
import { useEditorStore } from "@/stores/editorStore";
import { FileTreeNode, FileTreeResponse, SelectedFile } from "@/types/types";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { CSSProperties } from "react";
import { Tree, NodeApi } from "react-arborist";
import { FaRegFolder } from "react-icons/fa";
import { FaRegFolderOpen } from "react-icons/fa";
import { FaRegFile } from "react-icons/fa";
import { AddKBFiles } from "./addKBFiles";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { MdDeleteOutline } from "react-icons/md";

export function KBTree() {
  const { getToken } = useAuth();
  const param = useParams();
  const queryClient = useQueryClient();
  const projectId = param.id;
  const { setLatex, setSelectedFile, setActiveEditorTab } =
    useEditorStore.getState();

  const FetchFileContent = async (
    fileId: string,
    FileName: string,
    path: string
  ) => {
    try {
      const token = await getToken();
      const isPDF = FileName.toLowerCase().endsWith(".pdf");
      const isImg = FileName.toLowerCase().endsWith(".jpg") || FileName.toLowerCase().endsWith(".jpeg") || FileName.toLowerCase().endsWith(".png")
      if (isPDF || isImg) {
        const res = await axiosClient.get(`/file/${fileId}/url`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        isPDF ? setSelectedFile(fileId, path, res.data.url, "pdf"):setSelectedFile(fileId, path, res.data.url, "img")
      } else {
        const cached = queryClient.getQueryData<SelectedFile>(["file", path]);
        if (cached) {
          setSelectedFile(fileId, path, cached.content, "latex");
          setLatex(cached.content);
          setActiveEditorTab("latex");
        } else {
          const res = await axiosClient.get(`/file/${fileId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = {
            type: "latex" as const,
            content: res.data.content,
            path: path,
          };
          queryClient.setQueryData(["file", path], data);
          setSelectedFile(fileId, path, res.data.content, "latex");
          setLatex(res.data.content);
          setActiveEditorTab("latex");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getKBTree = async () => {
    try {
      const token = await getToken();
      const res = await axiosClient.get(`/project/${projectId}/kb-files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (err) {
      console.error(err);
    }
  };

  const { data, isLoading, error } = useQuery<FileTreeResponse>({
    queryKey: [`KB_tree_${projectId}`],
    queryFn: getKBTree,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading)
    return (
      <div className="h-1/2 w-[290px] shrink-0 bg-[#151515] border-r border-t border-white/20 px-4">
        <h1>Loading...</h1>
      </div>
    );
  if (error)
    return (
      <div className="h-1/2 w-[290px] shrink-0 bg-[#151515] border-r border-t border-white/20 px-4">
        <h1>Error getting KB files.</h1>
      </div>
    );

  return (
    <div className="flex-1 overflow-hidden w-[290px] shrink-0 bg-[#151515] border-r border-t border-white/20 px-4">
      <div className="flex justify-between">
        <h1>Kb Files</h1>
        <AddKBFiles />
      </div>
      <Tree
        data={data?.tree}
        width={250}
        openByDefault={false}
        indent={24}
        rowHeight={36}
        overscanCount={1}
        paddingTop={20}
      >
        {(props) => <Node {...props} onFileClick={FetchFileContent} />}
      </Tree>
    </div>
  );
}

function Node({
  node,
  style,
  onFileClick,
}: {
  node: NodeApi<FileTreeNode>;
  style: CSSProperties;
  onFileClick: (id: string, FileName: string, path: string) => Promise<void>;
}) {
  const isFolder = node.data.isFolder;
  return (
    <div style={style}>
      {isFolder ? (
        <Folder node={node} />
      ) : (
        <File onFileClick={onFileClick} node={node} />
      )}
    </div>
  );
}

function Folder({ node }: { node: NodeApi<FileTreeNode> }) {
  return (
    <div
      className="flex gap-2 items-center cursor-pointer min-w-0"
      onClick={() => node.toggle()}
    >
      {node.isOpen ? (
        <FaRegFolderOpen size={18} className="shrink-0" />
      ) : (
        <FaRegFolder size={18} className="shrink-0" />
      )}
      <h1 className="truncate min-w-0">{node.data.name}</h1>
    </div>
  );
}

function File({
  node,
  onFileClick,
}: {
  node: NodeApi<FileTreeNode>;
  onFileClick: (id: string, fileName: string, path: string) => void;
}) {
  const selectedFileId = useEditorStore((state) => state.selectedFileId);
  const {getToken} = useAuth()
  const queryClient = useQueryClient()
  const param = useParams()
  const projectId = param.id

  const deleteMutation = useMutation({
    mutationFn:async()=>{
        const token = await getToken()

        const res = await axiosClient.delete(`/file/${node.data.id}`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        return res.data
    },
    onSuccess:()=>{
        queryClient.invalidateQueries({
            queryKey:[`KB_tree_${projectId}`]
        })
    }
  })

  return (
    <ContextMenu.Root modal={true}>
      <ContextMenu.Trigger asChild>
        <div
          className={`flex gap-2 items-center rounded-lg px-2 py-1 cursor-pointer min-w-0 ${selectedFileId === node.data.id ? "bg-white/10" : ""}`}
          onClick={() => {
            onFileClick(node.data.id, node.data.name, node.data.path!);
          }}
        >
          <FaRegFile size={18} className="shrink-0" />
          <h1 className="truncate min-w-0">{node.data.name}</h1>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>

      <ContextMenu.Content className="bg-[#151515] border border-white/15 rounded-md w-40 z-50">
        <ContextMenu.Item className="px-4 py-2">
          <div className=" flex justify-between items-center cursor-pointer"
          onClick={()=>deleteMutation.mutate()}
          >
            <h1>Delete</h1>
            <MdDeleteOutline size={20} />
          </div>
        </ContextMenu.Item>
      </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
