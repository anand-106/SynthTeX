"use client";

import { useEditorStore } from "@/stores/editorStore";
import Editor, { BeforeMount } from "@monaco-editor/react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function LatexEditor() {

  const latex = useEditorStore((state)=>state.latex)
  const setLatex = useEditorStore((state)=>state.setLatex)
  
  const handleBeforeMount: BeforeMount = (monaco) => {

    monaco.languages.register({ id: "latex" });


    monaco.languages.setLanguageConfiguration("latex", {
      comments: { lineComment: "%" },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
      ],
    });

 
    monaco.languages.setMonarchTokensProvider("latex", {
      tokenizer: {
        root: [
          [/\\[a-zA-Z@]+/, "keyword"],
          [/%.*$/, "comment"],
          [/\$\$[\s\S]*?\$\$/, "string"],
          [/\$[^$]*\$/, "string"],          
          [/[{}]/, "delimiter.bracket"],
        ],
      },
    });

  
    monaco.editor.defineTheme("latex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "C586C0" },
        { token: "comment", foreground: "6A9955" },
        { token: "string", foreground: "CE9178" },
      ],
      colors: {},
    });
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="latex"
      value={latex}
      onChange={(v) => setLatex(v ?? "")}
      theme="latex-dark"
      beforeMount={handleBeforeMount}
      options={{
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}