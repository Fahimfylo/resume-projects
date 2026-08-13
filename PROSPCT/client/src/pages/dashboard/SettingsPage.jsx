import { useEffect, useState } from "react";
import { AlignJustify, Loader2, X } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import Profile from "../../components/common/header/Profile";
import UsageChart from "../../components/common/header/Usage";
import { getCurrentUser } from "../../api/mutation";
import Integrations from "../../components/common/Integrations";
import SettingsNotification from "./SettingsNotification";
import SettingsTeam from "./SettingsTeam";

function SettingsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { user, setUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phoneNumber: user?.phone || "",
    alternativeEmails: user?.alternativeEmails || [],
  });

  const loadProfile = async () => {
    setLoadingProfile(true);
    setError("");
    try {
      const { user: fetchedUser } = await getCurrentUser();
      if (fetchedUser) {
        setUser(fetchedUser);
        setFormData({
          email: fetchedUser.email || "",
          firstName: fetchedUser.firstName || "",
          lastName: fetchedUser.lastName || "",
          phoneNumber: fetchedUser.phone || "",
          alternativeEmails: fetchedUser.alternativeEmails || [],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile data");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabClick = (tab) => {
    navigate(`/settings/${tab}`);
    setIsMobileMenuOpen(false); // Close menu on mobile after selection
  };

  useEffect(() => {
    const path = location.pathname.replace("/settings", "").replace(/^\//, "");
    setActiveTab(path || "basic");
  }, [location.pathname]);

  const navItems = [
    { id: "basic", label: "Basic info" },
    {
      id: "plans",
      label: "Plan & Billings",
      isLink: true,
      to: "/plans-and-billings",
    },
    { id: "usage", label: "Usage" },
    { id: "notifications", label: "Notifications" },
    { id: "api", label: "API" },
    { id: "integrations", label: "Integrations" },
    { id: "teams", label: "Workspaces & Teams" },
  ];

  return (
    <MainLayout>
      <section className="min-h-screen bg-gray-100">
        {/* Top Navbar */}
        <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 lg:px-32">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <button
            className="p-2 rounded-md lg:hidden hover:bg-gray-100 text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <AlignJustify size={24} />}
          </button>
        </nav>

        <div className="flex flex-col lg:flex-row lg:mx-32 lg:mt-8 gap-6">
          {/* Sidebar Navigation */}
          <aside
            className={`
            ${isMobileMenuOpen ? "block" : "hidden"} 
            lg:block w-full lg:w-64 flex-shrink-0
          `}
          >
            <div className="flex flex-col p-4 lg:p-0 space-y-1">
              {navItems.map((item) =>
                item.isLink ? (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="flex items-center px-4 h-11 text-sm font-semibold text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center px-4 h-11 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow px-4 lg:px-0 pb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center h-[500px]">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="mt-4 text-sm font-medium text-gray-400">
                    Loading your preferences...
                  </p>
                </div>
              ) : error ? (
                <div className="m-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {activeTab === "basic" && (
                    <Profile
                      formData={formData}
                      onInputChange={handleInputChange}
                      userId={user?._id}
                    />
                  )}

                  {activeTab === "usage" && (
                    <div className="p-6 mt-5">
                      <UsageChart
                        selectedDate={new Date()}
                        planName={user?.plan?.name ?? "Free"}
                        emailCredits={
                          user?.credits?.emailCredits || { current: 0, max: 0 }
                        }
                        phoneCredits={
                          user?.credits?.phoneCredits || { current: 0, max: 0 }
                        }
                        exportCredits={
                          user?.credits?.exportCredits || { current: 0, max: 30 }
                        }
                        verificationCredits={
                          user?.credits?.verificationCredits || { current: 0, max: 0 }
                        }
                      />
                    </div>
                  )}

                  {activeTab === "notifications" && (
                    <div className="p-6">
                      <SettingsNotification />
                    </div>
                  )}

                  {activeTab === "api" && (
                    <div className="p-8 text-center">
                      <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
                        <Loader2 size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        API Access
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Developers tools are coming soon to Prospct.
                      </p>
                    </div>
                  )}

                  {activeTab === "integrations" && (
                    <div className="p-6">
                      <Integrations variant="settings" />
                    </div>
                  )}

                  {activeTab === "teams" && (
                    <div className="p-6">
                      <SettingsTeam />
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </section>
    </MainLayout>
  );
}

export default SettingsPage;
