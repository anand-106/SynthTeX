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
    };
  