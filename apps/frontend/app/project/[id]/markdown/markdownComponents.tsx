export const components = {
    table({ children }: { children?: React.ReactNode }) {
      return (
        <div className="overflow-x-auto w-full">
          <table className="min-w-max border-collapse">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: { children?: React.ReactNode }) {
        return (
          <th className="max-w-[240px] px-3 py-2 text-left font-semibold wrap-break-word border">
            {children}
          </th>
        );
      },
    
      td({ children }: { children?: React.ReactNode }) {
        return (
          <td className="max-w-[240px] px-3 py-2 wrap-break-word border">
            {children}
          </td>
        );
      },
      pre({ children }: { children?: React.ReactNode }) {
        return (
          <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word bg-slate-900 rounded-lg p-3 my-2 text-sm">
            {children}
          </pre>
        );
      },
    
      code({ children, className }: { children?: React.ReactNode; className?: string }) {
        // Check if it's an inline code or a code block
        const isInline = !className;
        
        if (isInline) {
          return (
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm break-all">
              {children}
            </code>
          );
        }
        
        // Code block (inside pre)
        return (
          <code className="block whitespace-pre-wrap wrap-break-word">
            {children}
          </code>
        );
      },
    };
  