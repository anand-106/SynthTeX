"use client";
import { useLayoutStore } from "@/stores/layoutStore";

export function BodyWrapper({ children, className }: { children: React.ReactNode; className: string }) {
  const bgColor = useLayoutStore((state) => state.bgColor);
  
  return (
    <body className={className} style={{ backgroundColor: bgColor }}>
      {children}
    </body>
  );
}