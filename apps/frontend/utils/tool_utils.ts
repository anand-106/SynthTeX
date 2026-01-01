import { useEditorStore } from '@/stores/editorStore'

function normalizeLatexString(s: string): string {
  return s
    .replace(/\\'/g, "'")    
    .replace(/\\\\/g, "\\")   
}

export function searchAndReplace(old_string: string, new_string: string, path: string) {
  const { latex, setLatex, selectedFilePath } = useEditorStore.getState()
  
  // Normalize LLM escaping issues
  const normalizedOld = normalizeLatexString(old_string)
  const normalizedNew = normalizeLatexString(new_string)
  
  const replaced = latex.replace(normalizedOld, normalizedNew)
  if(selectedFilePath==path){
    console.log("The tab is open")
    setLatex(replaced)
  }
  
  return replaced
}