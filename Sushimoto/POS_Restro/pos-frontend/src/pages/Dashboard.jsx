import { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";

const buttons = [
  { label: "Add Table", icon: <MdTableBar />, action: "table" },
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
];

const tabs = ["Metrics", "Orders", "Payments"];

const Dashboard = () => {
  useEffect(() => {
    document.title = "Sushimoto | Admin Dashboard";
  }, []);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Metrics");

  const handleOpenModal = (action) => {
    if (action === "table") setIsTableModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="max-w-7xl mx-auto px-6 py-6" data-aos="fade-down">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {buttons.map(({ label, icon, action }) => (
              <button
                key={label}
                onClick={() => handleOpenModal(action)}
                className="bg-white border border-border hover:border-primary/50 px-6 py-2.5 rounded-full text-secondary font-body font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow"
              >
                {label} {icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:text-secondary"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Metrics" && <Metrics />}
        {activeTab === "Orders" && <RecentOrders />}
        {activeTab === "Payments" && (
          <div className="text-muted-foreground font-body text-center py-20 bg-white border border-border rounded-xl">
            Payment Component Coming Soon
          </div>
        )}
      </div>

      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}
    </div>
  );
};

export default Dashboard;
