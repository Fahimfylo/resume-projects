import { ChevronsUpDown } from "lucide-react";

export default function CompanyTableSkeleton() {
  const columns = [
    { label: "Name", width: "380px" },
    { label: "Links", width: "220px" },
    { label: "Industry", width: "300px" },
    { label: "Keywords", width: "380px" },
    { label: "Employees", width: "220px" },
    { label: "Zip", width: "140px" },
    { label: "Headquarters", width: "320px" },
  ];

  return (
    <table className="w-full text-left text-gray-800 bg-white table-fixed">
      <thead className="text-xs border-b bg-white sticky top-0 z-30">
        <tr className="bg-gray-50">
          <th className="w-12 py-3 px-3 text-center border-b border-gray-200" />
          {columns.map((col) => (
            <th
              key={col.label}
              className="py-3 px-5 text-start font-semibold text-gray-600 border-b border-gray-200"
              style={{ width: col.width }}
            >
              <div className="flex items-center">
                <span>{col.label}</span>
                <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
          <tr key={i} className="text-sm animate-pulse">
            <td className="py-4 px-5 text-center border-b border-gray-200">
              <input type="checkbox" className="ml-2 mr-4 lead-checkbox" />
            </td>
            {columns.map((col) => (
              <td
                key={col.label}
                className={`py-4 px-5 border-b border-gray-200 ${col.label === "Name" ? "sticky left-0 bg-white z-20" : ""}`}
              >
                {col.label === "Name" ? (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-200 flex-shrink-0" />
                    <div className="ml-2 h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200" />
                  </div>
                ) : col.label === "Links" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-[17px] h-[17px] rounded-full bg-gradient-to-r from-gray-300 to-gray-200" />
                    <div className="w-[17px] h-[17px] rounded-full bg-gradient-to-r from-gray-300 to-gray-200" />
                    <div className="w-[17px] h-[17px] rounded-full bg-gradient-to-r from-gray-300 to-gray-200" />
                  </div>
                ) : (
                  <div className="h-[10px] rounded-full bg-gradient-to-r from-gray-300 to-gray-200"
                    style={{ width: col.label === "Zip" ? "60px" : col.label === "Employees" ? "80px" : "120px" }}
                  />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
