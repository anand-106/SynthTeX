"use client";

import { useEffect, useRef } from "react";
import { parse, HtmlGenerator } from "latex.js";

export default function LatexPreview({ source }: { source: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !source) return;

    try {
      const generator = new HtmlGenerator({ hyphenate: false });
      const doc = parse(source, { generator });
      
      // Get the full HTML document (includes proper <html>, <head>, <body>)
      const htmlDoc = doc.htmlDocument("https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/");
      
      // Write to iframe
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlDoc.documentElement.outerHTML);
        iframeDoc.close();
      }
    } catch (err) {
      console.error("LaTeX parse error:", err);
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          iframeDoc.body.innerText = "LaTeX render error: " + (err as Error).message;
        }
      }
    }
  }, [source]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 bg-white"
      title="LaTeX Preview"
    />
  );
}