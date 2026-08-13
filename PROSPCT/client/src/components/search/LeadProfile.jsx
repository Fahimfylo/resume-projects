import { X } from "lucide-react";

import { FaList } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import { FaUserGroup } from "react-icons/fa6";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useStore from "../../store/store";

import LeadProfileProspect from "./LeadProfileProspect";
import LeadProfileContacts from "./LeadProfileContacts";
import LeadProfileActions from "./LeadProfileActivities";

export default function LeadProfile({ dataItem }) {
  const { isLeadProfileVisible, setLeadProfileVisible, filters } = useStore();
  const queryClient = useQueryClient();

  const [activeDiv, setActiveDiv] = useState(1);

  const handleClick = (divId) => {
    setActiveDiv(divId); // Set the clicked div as active
  };

  return (
    <div
      className={`h-screen fixed top-0 right-0 w-[420px] z-50 shadow-lg border-l bg-white flex flex-col transform transition-transform duration-500 ${
        isLeadProfileVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div
        className="flex justify-end items-end px-4 py-2 cursor-pointer hover:text-blue-500"
        onClick={() => setLeadProfileVisible(false)}
      >
        <X />
      </div>

      {activeDiv === 1 && <LeadProfileProspect item={dataItem} queryClient={queryClient} viewType={filters?.viewType} />}
      {activeDiv === 2 && <LeadProfileContacts dataItem={dataItem} queryClient={queryClient} />}
      {activeDiv === 3 && <LeadProfileActions />}

      <div className="absolute bottom-0 flex justify-between w-full p-4 bg-white">
        <div
          className="text-center cursor-pointer"
          onClick={() => handleClick(1)}
        >
          <div className="text-center flex justify-center">
            <IoPersonSharp
              size={23}
              className={`text-center text-sm pb-1 ${
                activeDiv === 1 ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </div>
          <div
            className={`text-sm  ${
              activeDiv === 1 ? "text-blue-500" : "text-black"
            }`}
          >
            Prospect
          </div>
        </div>
        <div
          className="text-center cursor-pointer"
          onClick={() => handleClick(2)}
        >
          <div className="text-center flex justify-center">
            <FaUserGroup
              size={23}
              className={`text-center text-sm pb-1 ${
                activeDiv === 2 ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </div>
          <div
            className={`text-sm  ${
              activeDiv === 2 ? "text-blue-500" : "text-black"
            }`}
          >
            Contacts
          </div>
        </div>
        <div
          className="text-center cursor-pointer"
          onClick={() => handleClick(3)}
        >
          <div className="text-center flex justify-center">
            <FaList
              size={23}
              className={`text-center text-sm pb-1 ${
                activeDiv === 3 ? "text-blue-500" : "text-gray-400"
              }`}
            />
          </div>
          <div
            className={`text-sm  ${
              activeDiv === 3 ? "text-blue-500" : "text-black"
            }`}
          >
            Activities
          </div>
        </div>
      </div>
    </div>
  );
}
