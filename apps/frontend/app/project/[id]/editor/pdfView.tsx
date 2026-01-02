"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useMemo, useRef, useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(()=>({
    httpHeaders:{},
    disableRange:true,
    disableStream:true
  }),[])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth((containerRef.current.clientWidth - 32));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div ref={containerRef} className="h-full flex-1 overflow-auto bg-[#151515] p-4 scrollbar scrollbar-track-[#171717] scrollbar-thumb-white/25">
      <div className="flex flex-col items-center">
        <Document file={url} options={options} onLoadSuccess={onDocumentLoadSuccess} loading={PdfLoading} scale={.8}>
          {numPages && containerWidth > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <Page key={`page_${i + 1}`} pageNumber={i + 1} className="mb-4" width={containerWidth * 0.7} />
            ))}
        </Document>
      </div>
    </div>
  );
}

function PdfLoading(){
  return <div className="h-full flex justify-center items-center pt-[300px]" >
    <h1 className="text-white/70">Loading PDF...</h1>
  </div>
}