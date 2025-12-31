import { create } from 'zustand'

interface EditorState {
  selectedFileId: string | null
  selectedFilePath: string | null
  fileType: "latex" | "pdf" | null
  latex: string
  activeEditorTab:"latex"| "preview" | null
  setActiveEditorTab:(tab: "latex"| "preview") => void
  setSelectedFile: (id: string, path: string, content: string,type:"latex" | "pdf") => void
  setLatex: (content: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedFileId: null,
  selectedFilePath: null,
  fileType: "latex",
  latex: '',
  activeEditorTab:"latex",
  setActiveEditorTab: (activeEditorTab)=> set({activeEditorTab}),
  setSelectedFile: (id, path, content,type) => set({ 
    selectedFileId: id, 
    selectedFilePath: path, 
    latex: content, 
    fileType:type
  }),
  setLatex: (latex) => set({ latex }),
}))