import { create } from 'zustand'

interface EditorState {
  selectedFileId: string | null
  selectedFilePath: string | null
  fileType: "latex" | "pdf" | null
  latex: string
  setSelectedFile: (id: string, path: string, content: string,type:"latex" | "pdf") => void
  setLatex: (content: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedFileId: null,
  selectedFilePath: null,
  fileType: "latex",
  latex: '',
  setSelectedFile: (id, path, content,type) => set({ 
    selectedFileId: id, 
    selectedFilePath: path, 
    latex: content, 
    fileType:type
  }),
  setLatex: (latex) => set({ latex }),
}))