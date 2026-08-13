import { ChevronsUpDown } from "lucide-react";

export default function LeadTableSkeleton() {
  return (
    <table className="w-full text-left text-gray-800 bg-white table-fixed lead-table">
      <thead className="text-xs border-b">
        <tr>
          <th className="pl-4 py-2  w-[300px] sticky left-0 bg-white z-10">
            <div className="flex items-center">
              <span />
              <span>Name</span>
              <ChevronsUpDown size={14} className="ml-1 text-gray-500 " />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[300px]">
            <div className="flex items-center">
              <span>Company</span>
              <ChevronsUpDown size={14} className="ml-1 text-gray-500 " />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Email</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Phone</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Location</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[130px]">
            <div className="flex items-center">
              <span>Zip/Postal</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Employees</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Industry</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
          <th className="pl-4 py-2 font-normal w-[180px]">
            <div className="flex items-center">
              <span>Keywords</span>
              <ChevronsUpDown
                size={14}
                className="ml-1 text-gray-500 cursor-pointer"
              />
            </div>
          </th>
        </tr>
      </thead>
      <tbody className="">
        {Array.from({ length: 10 }).map((_, i) => (
          <tr key={i} className="text-sm hover:bg-gray-50 group animate-pulse">
            <td className="sticky left-0 z-10 w-16 py-3 pr-8 overflow-hidden bg-white shadow border-y whitespace-nowrap group-hover:bg-gray-50 text-ellipsis">
              <div className="flex items-center contact-row">
                <div className="flex items-center">
                  <input type="checkbox" className="ml-2 mr-4 lead-checkbox" />
                  <div className="flex items-center gap-5 contact-info">
                    <div className="flex items-center justify-center w-8 h-8 text-xs text-white rounded-full name-color bg-gradient-to-r from-gray-300 to-gray-300"></div>
                    <div className="flex flex-col gap-1 contact-name">
                      <div className="h-[10px] mb-1 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
                      <div className="h-[10px] w-36 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>

                      <div className="w-40 mr-2 overflow-hidden text-sm truncate item-name-lead"></div>
                    </div>
                  </div>
                </div>
              </div>
            </td>

            <td className="py-3 font-semibold text-gray-800 border-b whitespace-nowrap">
              <div className="flex ">
                <div className="w-8 h-8 rounded-md bg-gradient-to-r from-gray-300 to-gray-300"></div>
                <div className="flex flex-col gap-1 ml-2">
                  <div className="h-[10px] mb-1 w-40 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
                  <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
                </div>
              </div>
            </td>
            <td className="py-3 border-b whitespace-nowrap">
              <div className="pr-5 show-email">
                <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
              </div>
            </td>
            <td className="py-3 border-b whitespace-nowrap">
              <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>
            <td className="py-3 pr-5 truncate border-b whitespace-nowrap">
              <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>
            <td className="py-3 pr-5 truncate border-b whitespace-nowrap">
              <div className="h-[10px] w-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>
            <td className="px-5 py-3 border-b whitespace-nowrap">
              <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>
            <td className="py-3 pr-5 truncate border-b whitespace-nowrap">
              <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>

            <td className="py-3 truncate border-b whitespace-nowrap">
              <div className="h-[10px] w-32 rounded-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
