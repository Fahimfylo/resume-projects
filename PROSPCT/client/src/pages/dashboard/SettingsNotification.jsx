import React, { useState, useEffect } from "react";
import { Bell, Monitor } from "lucide-react";
import { toast } from "react-toastify";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const SettingsNotification = () => {
  const { notificationPrefs, setNotificationPrefs } = useStore();
  const [activeTab, setActiveTab] = useState("notifications");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inAppToggles, setInAppToggles] = useState(notificationPrefs.inApp);
  const [emailToggles, setEmailToggles] = useState(notificationPrefs.email);

  // Fetch preferences from backend on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem("userAccessToken");
        const res = await fetch(`${BASE_URL}/settings/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const { inApp, email } = json.data;
          setInAppToggles(inApp);
          setEmailToggles(email);
          setNotificationPrefs({ inApp, email });
        }
      } catch {
        toast.error("Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleToggle = async (type, key) => {
    const updated = type === "inApp"
      ? { ...inAppToggles, [key]: !inAppToggles[key] }
      : { ...emailToggles, [key]: !emailToggles[key] };

    if (type === "inApp") setInAppToggles(updated);
    else setEmailToggles(updated);

    // Update Zustand immediately so Header reacts instantly
    setNotificationPrefs({ [type]: updated });

    // Persist to backend
    try {
      setSaving(true);
      const token = localStorage.getItem("userAccessToken");
      await fetch(`${BASE_URL}/settings/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [type]: updated }),
      });
    } catch {
      toast.error("Failed to save preference");
      // Rollback on error
      if (type === "inApp") setInAppToggles(inAppToggles);
      else setEmailToggles(emailToggles);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100 font-sans text-gray-800 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {saving && (
          <span className="text-xs font-medium text-blue-600 animate-pulse">Saving...</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "notifications"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700:text-gray-200"
          }`}
        >
          Notifications
          {activeTab === "notifications" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "email"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-700:text-gray-200"
          }`}
        >
          Options
          {activeTab === "email" && ( // Fixed activeTab check to "email" instead of "options"
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1 text-gray-900">How you get notified</h2>
          <p className="text-sm text-gray-500">
            Please note: You can't turn off notifications for important messages
            about your account, like status and billing updates.
          </p>
        </div>

        {activeTab === "notifications" ? (
          /* Notifications Tab Content */
          <div className="space-y-8">
            <div className="space-y-6">
              <NotificationRow
                icon={
                  <div className="w-12 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <Bell size={18} className="text-gray-400" />
                  </div>
                }
                title="Bell"
                description="Bell notifications appear as a red badge on the bell icon in your navigation bar. You can click on the bell anytime to see your most recent notifications."
                checked={inAppToggles.bell}
                onChange={() => handleToggle("inApp", "bell")}
                showLink
              />
              <NotificationRow
                icon={
                  <div className="w-12 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <Monitor size={18} className="text-gray-400" />
                  </div>
                }
                title="Pop-up"
                description="Pop-up notifications appear on your screen when you're active in GetProspect."
                checked={inAppToggles.popup}
                onChange={() => handleToggle("inApp", "popup")}
                showLink
              />
            </div>
          </div>
        ) : (
          /* Email Tab Content */
          <div className="space-y-4 py-4">
            <EmailToggleRow
              title="Save leads"
              description="Get notified when leads are saved to your lists."
              checked={emailToggles.saveLeads}
              onChange={() => handleToggle("email", "saveLeads")}
            />
            <EmailToggleRow
              title="Export leads"
              description="Get notified when leads are exported."
              checked={emailToggles.exportLeads}
              onChange={() => handleToggle("email", "exportLeads")}
            />
            <EmailToggleRow
              title="Delete leads"
              description="Get notified when leads are deleted."
              checked={emailToggles.deleteLeads}
              onChange={() => handleToggle("email", "deleteLeads")}
            />
            <EmailToggleRow
              title="List"
              description="Get notified when lists are created or deleted."
              checked={emailToggles.list}
              onChange={() => handleToggle("email", "list")}
            />
            <EmailToggleRow
              title="Folder"
              description="Get notified when folders are created or deleted."
              checked={emailToggles.folder}
              onChange={() => handleToggle("email", "folder")}
            />
            <EmailToggleRow
              title="Saved search"
              description="Get notified when saved searches are created or deleted."
              checked={emailToggles.savedSearch}
              onChange={() => handleToggle("email", "savedSearch")}
            />
            <EmailToggleRow
              title="Export"
              description="Export notifications will be sent to your email."
              checked={emailToggles.export}
              onChange={() => handleToggle("email", "export")}
            />
            <EmailToggleRow
              title="Database updates"
              description="Get notified about new leads found for your recent searches."
              checked={emailToggles.database}
              onChange={() => handleToggle("email", "database")}
            />
            <EmailToggleRow
              title="Credit reset"
              description="Get notified when your monthly credits are topped up."
              checked={emailToggles.credit}
              onChange={() => handleToggle("email", "credit")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components for cleaner code ---

const NotificationRow = ({
  icon,
  title,
  description,
  checked,
  onChange,
  showLink,
}) => (
  <div className="flex items-start gap-4">
    {React.cloneElement(icon, {
      className: `${icon.props.className} bg-gray-100 border-gray-200`
    })}
    <div className="flex-1">
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
        {description}{" "}
        {showLink && (
          <a href="#" className="text-blue-500 hover:underline">
            See example
          </a>
        )}
      </p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const EmailToggleRow = ({ title, description, checked, onChange }) => (
  <div className="flex items-start gap-4">
    <Toggle checked={checked} onChange={onChange} />
    <div className="flex-1">
      <h4 className="font-bold text-gray-700">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      checked ? "bg-blue-500" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
    {checked && (
      <span className="absolute left-1.5 text-[10px] text-white">✓</span>
    )}
  </button>
);

const CheckboxRow = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div
      onClick={onChange}
      className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
        checked
          ? "bg-blue-500 border-blue-500"
          : "bg-white border-gray-300 group-hover:border-blue-400"
      }`}
    >
      {checked && <span className="text-white text-xs">✓</span>}
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export default SettingsNotification;
