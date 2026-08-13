/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import AdminComponent from "../AdminComponent";
import { toast } from "react-toastify";
import Swal from "sweetalert2"; // Import SweetAlert2
import {
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiSettings,
  FiCheckCircle,
  FiChevronRight,
  FiChevronLeft,
  FiPlay,
} from "react-icons/fi";
import { TbCloudDataConnection } from "react-icons/tb";
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { MdOutlinePayment, MdOutlineSecurity } from "react-icons/md";
import { RiCoinsLine } from "react-icons/ri";
import { GrStripe } from "react-icons/gr";
import { TbApi } from "react-icons/tb";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [editableField, setEditableField] = useState("");
  const [tempValue, setTempValue] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const [slides, setSlides] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newSlide, setNewSlide] = useState({
    quote: "",
    name: "",
    title: "",
    image: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [testingCategory, setTestingCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Define fields per category
  const categoryFields = {
    "Payments & Billing": [
      "stripeSecretKey",
      "stripePublishableKey",
      "coinPaymentsPublicKey",
      "coinPaymentsPrivateKey",
      "payProGlobalEncryptionKey",
      "payProGlobalIV",
      "heleketMerchantId",
      "heleketPaymentApiUrl",
    ],
    Authentication: [
      "googleClientId",
      "googleClientSecret",
      "linkedinClientId",
      "linkedinClientSecret",
    ],
    "SMTP Configuration": [
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPass",
      "smtpFrom",
      "smtpSecure",
    ],
    Infrastructure: [
      "debounceApi",
      "telegramBotUsername",
      "telegramBotToken",
      "receiverEmail",
    ],
    "UI & Branding": ["loginHeroStat", "loginSwiperSlides"],
  };

  const fetchSettings = async () => {
    setLoading(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      // console.warn("[AdminSettings] No adminAccessToken found in cookies.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        setSettings(res.data);
        setSlides(res.data.loginSwiperSlides || []);
      }
      await checkApis();
    } catch (err) {
      // console.error("[AdminSettings] Error fetching settings:", {
      //   message: err.message,
      //   status: err.response?.status,
      //   data: err.response?.data,
      //   config: err.config
      // });
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const checkApis = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/api-health`);
      const failingApis = res.data.failingApis || [];
      if (failingApis.length) {
        toast.warn(`API Alerts: ${failingApis.join(", ")}`);
      }
    } catch (err) {
      // console.error("API health check error:", err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setTempValue(value);
  };
  const handleSave = async (field) => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    try {
      const payload = { [field]: tempValue };
      await axios.put(`${BASE_URL}/api/admin/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings((prev) => ({ ...prev, [field]: tempValue }));
      toast.success(`${field} updated`);
      setEditableField("");
      setTempValue("");
    } catch (err) {
      toast.error(`Failed to update ${field}`);
    }
  };

  // Save all fields in a category, including any currently edited field
  const handleSaveCategory = async (category) => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    setSavingCategory(category);
    try {
      const fields = categoryFields[category] || [];
      const payload = {};

      // Include values from existing settings
      fields.forEach((field) => {
        if (settings[field] !== undefined) {
          payload[field] = settings[field];
        }
      });

      // If a field in this category is being edited but not yet saved, merge its temp value
      if (editableField && fields.includes(editableField)) {
        payload[editableField] = tempValue;
      }

      // If saving UI & Branding and there's pending slide data, save it first
      if (category === "UI & Branding" && newSlide.quote.trim()) {
        const updatedSlides = editingIndex !== null
          ? slides.map((s, i) => (i === editingIndex ? newSlide : s))
          : [...(payload.loginSwiperSlides || []), newSlide];
        payload.loginSwiperSlides = updatedSlides;
      }

      if (Object.keys(payload).length === 0) {
        toast.warn("No fields to save");
        return;
      }

      await axios.put(`${BASE_URL}/api/admin/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local settings with saved values
      setSettings((prev) => ({ ...prev, ...payload }));
      // If we saved the currently edited field, clear edit mode
      if (editableField && fields.includes(editableField)) {
        setEditableField("");
        setTempValue("");
      }

      // Reset slide form if UI & Branding was saved with pending slide data
      if (category === "UI & Branding" && newSlide.quote.trim()) {
        setSlides(payload.loginSwiperSlides);
        setEditingIndex(null);
        setNewSlide({ quote: "", name: "", title: "", image: "" });
      }

      toast.success(`${category} settings saved successfully`);
    } catch (err) {
      toast.error(`Failed to save ${category} settings`);
    } finally {
      setSavingCategory(null);
    }
  };

  // Test category APIs
  const handleTestCategory = async (category) => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    setTestingCategory(category);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/admin/settings/test`,
        { category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.results) {
        const failed = res.data.results.filter((r) => !r.success);
        if (failed.length === 0) {
          toast.success(`All ${category} APIs are working!`);
        } else {
          toast.warn(`${failed.length} API(s) failed: ${failed.map((f) => f.name).join(", ")}`);
        }
      } else {
        toast.success(`${category} test completed`);
      }
    } catch (err) {
      toast.error(`Failed to test ${category}: ${err.response?.data?.message || err.message}`);
    } finally {
      setTestingCategory(null);
    }
  };

  // Send test email
  const handleSendTestEmail = async () => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    if (!testEmailAddress) {
      toast.error("Please enter an email address");
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/admin/settings/test-email`,
        { email: testEmailAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Test email sent successfully!");
    } catch (err) {
      toast.error(`Failed to send test email: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const saveSlides = async (updatedSlides) => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    try {
      await axios.put(
        `${BASE_URL}/api/admin/settings`,
        { loginSwiperSlides: updatedSlides },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSlides(updatedSlides);
      setSettings((prev) => ({ ...prev, loginSwiperSlides: updatedSlides }));
      toast.success("Slider updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleUploadImage = async (file) => {
    const token = Cookies.get("adminAccessToken");
    const formData = new FormData();
    formData.append("image", file);
    setUploadingImage(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/admin/settings/upload-slide-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setNewSlide((prev) => ({ ...prev, image: res.data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Upload failed";
      toast.error(msg);
      // console.error("[uploadSlideImage]", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSlide = async () => {
    if (!newSlide.quote.trim()) return toast.error("Quote required");
    const updated =
      editingIndex !== null
        ? slides.map((s, i) => (i === editingIndex ? newSlide : s))
        : [...slides, newSlide];

    await saveSlides(updated);
    setEditingIndex(null);
    setNewSlide({ quote: "", name: "", title: "", image: "" });
  };

  // Replaced window.confirm with SweetAlert2
  const handleRemoveSlide = async (index) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6", // purple-500
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      background: document.documentElement.classList.contains("dark")
        ? "#111827"
        : "#fff",
      color: document.documentElement.classList.contains("dark")
        ? "#fff"
        : "#000",
    });

    if (result.isConfirmed) {
      const updated = slides.filter((_, idx) => idx !== index);
      await saveSlides(updated);
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 pb-2 border-b border-purple-100 dark:border-purple-900/30 mb-4 mt-8">
      <Icon className="text-purple-500 text-xl" />
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider text-sm">
        {title}
      </h2>
    </div>
  );

  const SettingInput = ({ name, label, type = "text" }) => {
    const inputRef = useRef(null);
    useEffect(() => {
      if (editableField === name && inputRef.current) inputRef.current.focus();
    }, [editableField]);

    const valueToDisplay = settings[name];
    const displayText =
      typeof valueToDisplay === "boolean"
        ? valueToDisplay
          ? "Enabled"
          : "Disabled"
        : valueToDisplay || "";

    return (
      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-purple-900/10 border border-transparent hover:border-blue-100 dark:hover:border-purple-800/30">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
            {label}
          </label>
          {editableField === name ? (
            type === "checkbox" ? (
              <label className="inline-flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="checkbox"
                  checked={!!tempValue}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {tempValue ? "Enabled" : "Disabled"}
                </span>
              </label>
            ) : (
              <input
                ref={inputRef}
                type={type}
                value={tempValue}
                onChange={handleChange}
                className="w-full bg-white dark:bg-gray-950 border border-purple-400 rounded-lg px-3 py-2 text-sm outline-none shadow-sm shadow-purple-100 dark:shadow-none transition-all"
              />
            )
          ) : (
            <p className="text-gray-800 dark:text-gray-200 text-sm font-medium truncate max-w-md">
              {displayText || (
                <span className="text-gray-400 italic font-normal text-xs">
                  Not configured
                </span>
              )}
            </p>
          )}
        </div>

        <div className="ml-4 flex items-center gap-2">
          {editableField === name ? (
            <>
              <button
                onClick={() => handleSave(name)}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 shadow-sm"
              >
                <FiCheckCircle />
              </button>
              <button
                onClick={() => setEditableField("")}
                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                <FiX />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditableField(name);
                setTempValue(settings[name] ?? (type === "checkbox" ? false : ""));
              }}
              className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              <FiEdit2 size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <AdminComponent>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </AdminComponent>
    );

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-purple-500 transition-all mr-2"
                  title="Back to Categories"
                >
                  <FiChevronLeft size={20} />
                </button>
              )}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent tracking-tight">
                {activeCategory ? activeCategory : "System Settings"}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {activeCategory
                ? `Manage ${activeCategory.toLowerCase()} configurations.`
                : "Manage global configurations and external API integrations."}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${settings.maintenanceMode ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${settings.maintenanceMode ? "bg-amber-400 animate-pulse" : "bg-purple-400"}`}
            ></span>
            {settings.maintenanceMode ? "Maintenance Active" : "System Live"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-xl shadow-blue-100/50 dark:shadow-none border border-blue-50 dark:border-gray-800 rounded-2xl overflow-hidden min-h-[600px]">
          {!activeCategory ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-purple-900/20 border border-blue-50 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-gray-800 text-purple-600 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/30">
                    <MdOutlineSecurity size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Maintenance Guard
                    </h3>
                    <p className="text-xs text-gray-500">
                      Prevent user access during updates.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-110">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode || false}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        maintenanceMode: e.target.checked,
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Payments & Billing",
                    desc: "Stripe, CoinPayments & Gateways",
                    icon: MdOutlinePayment,
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    title: "Authentication",
                    desc: "Google & LinkedIn Social Auth",
                    icon: MdOutlineSecurity,
                    color: "text-purple-500",
                    bg: "bg-purple-50 dark:bg-purple-900/20",
                  },
                  {
                    title: "SMTP Configuration",
                    desc: "Email Server Configuration",
                    icon: TbCloudDataConnection,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-900/20",
                  },
                  {
                    title: "Infrastructure",
                    desc: "Telegram & Service APIs",
                    icon: TbApi,
                    color: "text-orange-500",
                    bg: "bg-orange-50 dark:bg-orange-900/20",
                  },
                  {
                    title: "UI & Branding",
                    desc: "Hero Stats & Login Carousel",
                    icon: FiSettings,
                    color: "text-sky-500",
                    bg: "bg-sky-50 dark:bg-sky-900/20",
                  },
                ].map((cat) => (
                  <button
                    key={cat.title}
                    onClick={() => setActiveCategory(cat.title)}
                    className="group flex flex-col items-start p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-lg hover:shadow-purple-100/50 dark:hover:shadow-none transition-all duration-300 text-left"
                  >
                    <div
                      className={`p-3 ${cat.bg} ${cat.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <cat.icon size={26} />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        {cat.title}
                      </h3>
                      <FiChevronRight className="text-gray-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8">
              {activeCategory === "Payments & Billing" && (
                <>
                  <SectionHeader icon={GrStripe} title="Stripe" />
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput name="stripeSecretKey" label="Secret Key" />
                      <SettingInput
                        name="stripePublishableKey"
                        label="Publishable Key"
                      />
                    </div>

                    <SectionHeader icon={RiCoinsLine} title="CoinPayments" />
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput
                        name="coinPaymentsPublicKey"
                        label="Public Key"
                      />
                      <SettingInput
                        name="coinPaymentsPrivateKey"
                        label="Private Key"
                      />
                    </div>

                    <SectionHeader
                      icon={MdOutlinePayment}
                      title="Alternative Gateways"
                    />
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput
                        name="payProGlobalEncryptionKey"
                        label="PayPro Encryption"
                      />
                      <SettingInput name="payProGlobalIV" label="PayPro IV" />
                      <SettingInput
                        name="heleketMerchantId"
                        label="Heleket Merchant ID"
                      />
                      <SettingInput
                        name="heleketPaymentApiUrl"
                        label="Heleket API URL"
                      />
                    </div>

                    {/* Category Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleTestCategory("Payments & Billing")}
                        disabled={testingCategory === "Payments & Billing"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <FiPlay className={testingCategory === "Payments & Billing" ? "animate-spin" : ""} />
                        {testingCategory === "Payments & Billing" ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={() => handleSaveCategory("Payments & Billing")}
                        disabled={savingCategory === "Payments & Billing"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <FiSave className={savingCategory === "Payments & Billing" ? "animate-bounce" : ""} />
                        {savingCategory === "Payments & Billing" ? "Saving..." : "Save All"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeCategory === "Authentication" && (
                <>
                  <SectionHeader icon={FaGoogle} title="Google Auth" />
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput name="googleClientId" label="Client ID" />
                      <SettingInput
                        name="googleClientSecret"
                        label="Client Secret"
                      />
                    </div>

                    <SectionHeader icon={FaLinkedin} title="LinkedIn Auth" />
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput name="linkedinClientId" label="Client ID" />
                      <SettingInput
                        name="linkedinClientSecret"
                        label="Client Secret"
                      />
                    </div>

                    {/* Category Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleTestCategory("Authentication")}
                        disabled={testingCategory === "Authentication"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <FiPlay className={testingCategory === "Authentication" ? "animate-spin" : ""} />
                        {testingCategory === "Authentication" ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={() => handleSaveCategory("Authentication")}
                        disabled={savingCategory === "Authentication"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <FiSave className={savingCategory === "Authentication" ? "animate-bounce" : ""} />
                        {savingCategory === "Authentication" ? "Saving..." : "Save All"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeCategory === "SMTP Configuration" && (
                <>
                  <SectionHeader icon={TbCloudDataConnection} title="SMTP Configuration" />
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput name="smtpHost" label="Host" />
                      <SettingInput name="smtpPort" label="Port" type="number" />
                      <SettingInput name="smtpUser" label="Username" />
                      <SettingInput
                        name="smtpPass"
                        label="Password"
                        type="password"
                      />
                      <SettingInput name="smtpFrom" label="From Email" />
                      <SettingInput
                        name="smtpSecure"
                        label="Use SSL/TLS"
                        type="checkbox"
                      />
                    </div>

                    {/* Save Configuration */}
                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleSaveCategory("SMTP Configuration")}
                        disabled={savingCategory === "SMTP Configuration"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <FiSave className={savingCategory === "SMTP Configuration" ? "animate-bounce" : ""} />
                        {savingCategory === "SMTP Configuration" ? "Saving..." : "Save Configuration"}
                      </button>
                    </div>

                    {/* Test Email Section */}
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Send Test Email
                      </h3>
                      <div className="flex items-center gap-4">
                        <input
                          type="email"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          placeholder="Enter email address"
                          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                        <button
                          onClick={handleSendTestEmail}
                          disabled={sendingTestEmail}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                        >
                          <FiPlay className={sendingTestEmail ? "animate-spin" : ""} />
                          {sendingTestEmail ? "Testing..." : "Test Connection"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeCategory === "Infrastructure" && (
                <>
                  <SectionHeader icon={TbApi} title="Service APIs" />
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                      <SettingInput name="debounceApi" label="Debounce API Key" />
                      <SettingInput
                        name="telegramBotUsername"
                        label="Telegram Username"
                      />
                        <SettingInput name="telegramBotToken" label="Telegram Token" />
                        <SettingInput name="receiverEmail" label="Receiver Email" />
                    </div>

                    {/* Category Actions */}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleTestCategory("Infrastructure")}
                        disabled={testingCategory === "Infrastructure"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <FiPlay className={testingCategory === "Infrastructure" ? "animate-spin" : ""} />
                        {testingCategory === "Infrastructure" ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={() => handleSaveCategory("Infrastructure")}
                        disabled={savingCategory === "Infrastructure"}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                      >
                        <FiSave className={savingCategory === "Infrastructure" ? "animate-bounce" : ""} />
                        {savingCategory === "Infrastructure" ? "Saving..." : "Save All"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeCategory === "UI & Branding" && (
                <>
                  <SectionHeader icon={FiSettings} title="UI Content" />
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <SettingInput
                      name="loginHeroStat"
                      label="Login Hero Statistics"
                    />

                    <div className="mt-12 p-8 bg-blue-50/30 dark:bg-purple-900/10 rounded-2xl border border-blue-100 dark:border-purple-900/30">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Login Carousel
                      </h3>
                      <p className="text-sm text-gray-500">
                        Testimonials and features shown on login.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                            Quote Content
                          </label>
                          <textarea
                            value={newSlide.quote}
                            onChange={(e) =>
                              setNewSlide((p) => ({
                                ...p,
                                quote: e.target.value,
                              }))
                            }
                            rows={4}
                            className="w-full bg-gray-50 dark:bg-gray-800 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            placeholder="Slide message..."
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                Name
                              </label>
                              <input
                                value={newSlide.name}
                                onChange={(e) =>
                                  setNewSlide((p) => ({
                                    ...p,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full border bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                Title
                              </label>
                              <input
                                value={newSlide.title}
                                onChange={(e) =>
                                  setNewSlide((p) => ({
                                    ...p,
                                    title: e.target.value,
                                  }))
                                }
                                className="w-full border bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                              Image
                            </label>
                            <div className="flex items-center gap-4">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleUploadImage(e.target.files[0])
                                }
                                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                              />
                              {newSlide.image && (
                                <img
                                  src={newSlide.image}
                                  className="h-10 w-10 rounded-full border border-purple-100 object-cover"
                                  alt="Preview"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <button
                          onClick={handleAddSlide}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md"
                        >
                          {editingIndex !== null ? <FiSave /> : <FiPlus />}
                          {editingIndex !== null
                            ? "Update Slide"
                            : "Add Slide"}
                        </button>
                        {editingIndex !== null && (
                          <button
                            onClick={() => {
                              setEditingIndex(null);
                              setNewSlide({
                                quote: "",
                                name: "",
                                title: "",
                                image: "",
                              });
                            }}
                            className="bg-gray-100 text-gray-500 px-6 py-2 rounded-lg font-bold text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {slides.map((slide, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm"
                        >
                          <div className="flex justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  slide.image ||
                                  "https://via.placeholder.com/40"
                                }
                                className="h-9 w-9 rounded-full object-cover border border-purple-50"
                                alt="Slide"
                              />
                              <div>
                                <h4 className="font-bold text-xs">
                                  {slide.name}
                                </h4>
                                <p className="text-[10px] text-gray-400">
                                  {slide.title}
                                </p>
                              </div>
                            </div>
                            <div className="flex">
                              <button
                                onClick={() => {
                                  setEditingIndex(idx);
                                  setNewSlide(slide);
                                }}
                                className="p-1.5 text-blue-400 hover:bg-blue-50 rounded"
                              >
                                <FiEdit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleRemoveSlide(idx)}
                                className="p-1.5 text-rose-400 hover:bg-rose-50 rounded"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 italic line-clamp-2">
                            "{slide.quote}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Actions */}
                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleSaveCategory("UI & Branding")}
                      disabled={savingCategory === "UI & Branding"}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                    >
                      <FiSave className={savingCategory === "UI & Branding" ? "animate-bounce" : ""} />
                      {savingCategory === "UI & Branding" ? "Saving..." : "Save All"}
                    </button>
                  </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminComponent>
  );
}
