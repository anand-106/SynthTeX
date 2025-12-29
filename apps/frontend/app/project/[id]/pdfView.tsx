import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="h-full flex-1 overflow-auto bg-gray-800 p-4">
      <Document file={url} options={{
        httpHeaders:{},
        disableRange:true,
        disableStream:true
      }}  onLoadSuccess={onDocumentLoadSuccess}>
        {numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <Page key={`page_${i + 1}`} pageNumber={i + 1} className="mb-4" />
          ))}
      </Document>
    </div>
  );
}