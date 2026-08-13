import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import AdminComponent from "../AdminComponent";
import { toast } from "react-toastify";
import API_CONFIG from "../../../utils/apiConstant";
import { FiEdit } from "react-icons/fi";
import CheckoutUpdateModal from "./CheckoutUpdateModal";

const BASE_URL = API_CONFIG.API_ENDPOINT;

// default methods defined in the checkout modal; keeping in sync with CheckoutModal
const DEFAULT_METHODS = [
  {
    title: "Credit/Debit Card (alternative)",
    src: "/images/payment-method/Visa-Mastercard.webp",
  },
  {
    title: "Pay Pro Global",
    src: "/images/payment-method/payproglobal.jfif",
  },
  { title: "Heleket", src: "/images/payment-method/heleket.png" },
  { title: "Fast Spring", src: "/images/payment-method/fast-spring.png" },
];

export default function LayoutSettings() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState([]);
  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [paymentRedirectMode, setPaymentRedirectMode] = useState("same-tab");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const REDIRECT_MODES = [
    { value: "same-tab", label: "Open In Same Tab", description: "Payment opens in the current browser tab" },
    { value: "new-tab", label: "Open In Another Tab", description: "Payment opens in a new browser tab" },
    { value: "popup", label: "Open POP UP", description: "Payment opens in a centered popup window" },
  ];

  const fetchCurrentOrder = async () => {
    setLoading(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      // console.warn("No admin token found");
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Use new paymentMethods structure
      const methods = res.data.paymentMethods || [];
      setOrder(Array.isArray(methods) && methods.length > 0 ? methods : DEFAULT_METHODS);
      
      // Load payment redirect mode
      const mode = res.data.paymentRedirectMode || "same-tab";
      setPaymentRedirectMode(mode);
      
    } catch (err) {
      // console.error("[fetchCurrentOrder] Error:", err);
      toast.error("Could not load payment layout");
      setOrder(DEFAULT_METHODS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  // drag and drop handlers
  const [draggedIdx, setDraggedIdx] = useState(null);

  const onDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const updated = [...order];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(index, 0, moved);
    setOrder(updated);
    setDraggedIdx(null);
  };

  // ✅ OPEN UPDATE MODAL
  const handleOpenUpdate = (method) => {
    setEditingMethod(method);
    setIsModalOpen(true);
    setOpenMenuIdx(null);
  };

  // ✅ SAVE (UPDATE) PAYMENT METHOD
  const handleModalSave = async (formData, originalMethod) => {
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      toast.error("No admin session found");
      return;
    }

    try {
      // Update existing method
      const updatedMethods = order.map((m) =>
        m.title === originalMethod.title
          ? { 
              title: formData.title, 
              src: formData.src,
              disabled: formData.disabled || false,
            }
          : m
      );

      setOrder(updatedMethods);
      setIsModalOpen(false);
      setEditingMethod(null);

      // Save to database
      const payload = { paymentMethods: updatedMethods };
      await axios.put(`${BASE_URL}/api/admin/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Payment method ${formData.disabled ? "disabled" : "updated"} successfully`);
    } catch (err) {
      // console.error("Failed to save method:", err);
      toast.error("Could not update payment method");
    }
  };

  // ✅ CLOSE MENU WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is on a menu button or within any menu dropdown
      const isMenuButton = e.target.closest('button[title="Update or delete"]');
      const isMenuDropdown = e.target.closest('[class*="absolute"][class*="right-0"]');
      
      if (!isMenuButton && !isMenuDropdown) {
        setOpenMenuIdx(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async () => {
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      toast.error("No admin session found");
      return;
    }
    try {
      const payload = { 
        paymentMethods: order,
        paymentRedirectMode: paymentRedirectMode,
      };

      const response = await axios.put(
        `${BASE_URL}/api/admin/settings`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Checkout layout & redirect settings saved successfully");
    } catch (err) {
      // console.error("Failed to save layout:", err.message, err.response?.data);
      toast.error("Could not save layout order");
    }
  };

  if (loading)
    return (
      <AdminComponent>
        <p className="p-6 text-gray-500 dark:text-gray-400">Loading layout...</p>
      </AdminComponent>
    );

  return (
    <AdminComponent>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
          Checkout Layout
        </h1>

        <p className="mb-6 text-md text-gray-500 dark:text-gray-400">
          Drag and drop the payment methods to define the order users will see
          during checkout.
        </p>

        {/* CARD GRID — like checkout modal */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
           {order.map((method, idx) => (
             <div
               key={method.title}
               draggable
               onDragStart={(e) => onDragStart(e, idx)}
               onDragOver={onDragOver}
               onDrop={(e) => onDrop(e, idx)}
               className={`
               group flex items-center gap-4
               p-5 rounded-xl border
               bg-white dark:bg-gray-800
               cursor-grab active:cursor-grabbing
               transition-all duration-200
               hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500
               relative
               ${method.disabled ? "opacity-60 grayscale-[30%]" : ""}
             `}
             >
               {/* Disabled Badge */}
               {method.disabled && (
                 <div className="absolute top-2 right-2">
                   <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                     </svg>
                     Disabled
                   </span>
                 </div>
               )}

               {/* Logo */}
               <div className={`flex items-center justify-center w-14 h-14 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700 ${method.disabled ? "opacity-50" : ""}`}>
                 <img
                   src={method.src}
                   alt={method.title}
                   className="max-h-8 object-contain"
                 />
               </div>

               {/* Title + Status */}
               <div className="flex flex-col">
                 <p className={`font-medium leading-snug ${method.disabled ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                   {method.title}
                 </p>
                 {method.disabled && (
                   <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                     Hidden from users
                   </p>
                 )}
               </div>

               {/* drag hint + actions menu */}
              <div className="ml-auto relative">
                <button
                  onClick={() =>
                    setOpenMenuIdx(openMenuIdx === idx ? null : idx)
                  }
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Update or delete"
                >
                  <span className="text-lg">⋮⋮</span>
                </button>

                {/* Dropdown Menu */}
                {openMenuIdx === idx && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-max">
                    <button
                      onClick={() => handleOpenUpdate(method)}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-lg"
                    >
                      <FiEdit size={16} />
                      Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
         </div>

        {/* PAYMENT REDIRECT MODE TOGGLES */}
        <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100">
            Payment Window Behavior
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Choose how payment gateways will open when users checkout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REDIRECT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPaymentRedirectMode(mode.value)}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-200 text-left
                  ${paymentRedirectMode === mode.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                `}
              >
                {/* Radio indicator */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${paymentRedirectMode === mode.value
                        ? "border-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                      }
                    `}
                  >
                    {paymentRedirectMode === mode.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span
                    className={`font-semibold text-sm ${paymentRedirectMode === mode.value
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    {mode.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-4 mt-8 flex-wrap">
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold"
            onClick={handleSave}
          >
            Save Order
          </button>
        </div>

        {/* ✅ REUSABLE CHECKOUT UPDATE MODAL */}
        <CheckoutUpdateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMethod(null);
          }}
          onSave={handleModalSave}
          method={editingMethod}
          mode="edit"
        />
      </div>
    </AdminComponent>
  );
}
