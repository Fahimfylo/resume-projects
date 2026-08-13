import { Plus } from "lucide-react";

const Integrations = ({ variant = "sidebar" }) => {
  const integrationList = [
    {
      name: "HubSpot",
      category: "CRM",
      description: "Auto-synchronize the data to your HubSpot account.",
      img: "/images/hubspot.png",
    },
    {
      name: "Salesforce",
      category: "CRM",
      description: "Auto-synchronize the data to your Salesforce account.",
      img: "/images/salesforce.png",
    },
    {
      name: "Pipedrive",
      category: "CRM",
      description: "Auto-synchronize the data to your Pipedrive account.",
      img: "/images/pipedrive.png",
    },
    {
      name: "Google Sheets",
      category: "Spreadsheets",
      description: "Auto-synchronize the data to your Google Sheets account.",
      img: "/images/sheet.png",
    },
  ];

  // --- GRID LAYOUT (For Settings Page) ---
  if (variant === "settings") {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">CRM</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationList.map((item) => (
            <div
              key={item.name}
              className="border border-gray-200 rounded-lg p-6 flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-lg font-semibold text-gray-900">
                  {item.name}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-8 flex-grow">
                {item.description}
              </p>
              <button className="w-fit px-6 py-1.5 border border-blue-400 text-blue-500 font-medium rounded hover:bg-blue-50 transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- SIDEBAR LAYOUT (For Dashboard) ---
  return (
    <div className="w-full md:w-[48%] lg:w-[49%] xl:w-[305px] bg-white border border-gray-300 rounded-md p-6 flex flex-col mb-4 lg:mb-0">
      <div className="mb-4 text-lg font-medium text-gray-700">Integrations</div>
      <ul className="space-y-1">
        {integrationList.map((item, index) => (
          <li
            key={item.name}
            className={`flex items-center justify-between px-1 py-2 cursor-pointer group hover:bg-gray-50 transition-colors ${
              index !== integrationList.length - 1
                ? "border-b border-gray-100"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={item.img}
                alt={item.name}
                className="w-8 h-8 object-contain"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-500">
                  {item.name}
                </div>
                <div className="text-[11px] text-gray-500 uppercase">
                  {item.category}
                </div>
              </div>
            </div>
            <Plus
              size={18}
              className="text-gray-400 group-hover:text-blue-500"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Integrations;
