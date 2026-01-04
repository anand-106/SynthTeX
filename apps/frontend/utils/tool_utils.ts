import { useEditorStore } from '@/stores/editorStore'
import { SelectedFile } from '@/types/types'
import { QueryClient } from '@tanstack/react-query'

function normalizeLatexString(s: string): string {
  return s
    .replace(/\\'/g, "'")    
    .replace(/\\\\/g, "\\")   
}

export function searchAndReplace(old_string: string, new_string: string, path: string,queryClient:QueryClient) {
  const { setLatex, selectedFilePath } = useEditorStore.getState()
  

  const normalizedOld = normalizeLatexString(old_string)
  const normalizedNew = normalizeLatexString(new_string)

  const cached = queryClient.getQueryData<SelectedFile>(['file',path])

  const fileContent = cached?.content || ''
  
  const replaced = fileContent.replace(normalizedOld, normalizedNew)
  if(selectedFilePath==path){
    console.log("The tab is open")
    setLatex(replaced)
  }
  
  return replaced
}