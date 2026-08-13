import { sanitizeDomainForDisplay } from "../../utils/logoHelper";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";
import { showToastIfPopupDisabled } from "../../utils/notificationHelper";

export default function EnrichProfile({ contact }) {
  const navigate = useNavigate();
  const { setInitialFilters } = useStore();
  const {
    initials,
    name,
    email,
    linkedinUrl,
    location,
    title,
    company,
    organizationWebsite,
    employees,
    industry,
    keywords,
    _id,
    _source,
  } = contact || {};

  const [isSaving, setIsSaving] = useState(false);
  const BASE_URL = API_CONFIG.API_ENDPOINT;

  // Derive domain for favicon logo (same pattern as search pages)
  const rawDomain = organizationWebsite || company;
  const logoDomain = sanitizeDomainForDisplay(rawDomain) || (company ? company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : null);
  const logoSrc = logoDomain ? `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=64` : null;

  const handleSaveClick = async () => {
    if (!contact || !_id) {
      toast.error("No contact data to save");
      return;
    }

    const isPerson = name && name !== "Not Available" && name !== "";

    setIsSaving(true);
    try {
      const token = localStorage.getItem("userAccessToken");
      const endpoint = isPerson
        ? `${BASE_URL}/api/saved/add`
        : `${BASE_URL}/api/saved-companies/add`;

      const response = await axios.post(
        endpoint,
        {
          savedItems: [{ _id }],
          listNames: [],
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.status === 200) {
        showToastIfPopupDisabled(
          isPerson ? "Contact saved successfully!" : "Company saved successfully!",
        );
      }
    } catch (error) {
      // console.error("Error saving contact:", error);
      const message =
        error.response?.data?.error || error.message || "Failed to save";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmployeesClick = () => {
    if (!company) {
      toast.error("No company data available");
      return;
    }
    // Set the organizationName filter in the store
    setInitialFilters({ organizationName: [company] }, {});
    // Navigate to search page
    navigate("/search");
  };

  const isPerson = name && name !== "Not Available" && name !== "";

  return (
    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50 overflow-hidden">
      <div className="p-5">
        {isPerson ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 shrink-0">
                  <div className="flex w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center text-white font-bold text-sm shadow-sm">
                    {initials || name?.charAt(0).toUpperCase() || "—"}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {title || "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {company && (
                  <button
                    type="button"
                    onClick={handleEmployeesClick}
                    className="h-9 px-3 text-[10px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {employees != null ? `+${employees} employees` : "Employees"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm shadow-green-500/20 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-800 font-semibold truncate">
                  {email ? (
                    <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                      {email}
                    </a>
                  ) : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-500">LinkedIn</span>
                <span className="text-sm text-gray-800 font-semibold truncate">
                  {linkedinUrl ? (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {linkedinUrl}
                    </a>
                  ) : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-500">Location</span>
                <span className="text-sm text-gray-800 font-semibold">
                  {location || "—"}
                </span>
              </div>
            </div>

            {company && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-8 h-8 shrink-0">
                    {logoSrc && (
                      <img
                        src={logoSrc}
                        alt={`${company} logo`}
                        className="w-full h-full object-contain rounded-lg bg-white border border-gray-100"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling.style.display = "flex";
                        }}
                      />
                    )}
                    <div className={`${logoSrc ? 'hidden' : 'flex'} w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center text-white font-bold text-xs shadow-sm`}>
                      {company.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                      {company}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {organizationWebsite || "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-500">Industry</span>
                    <span className="text-sm text-gray-800 font-semibold">
                      {industry || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-500">Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords && keywords.length > 0
                        ? keywords.split(",").map((kw, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg"
                            >
                              {kw.trim()}
                            </span>
                          ))
                        : <span className="text-sm text-gray-800 font-semibold">—</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 shrink-0">
                  {logoSrc && (
                    <img
                      src={logoSrc}
                      alt={`${company} logo`}
                      className="w-full h-full object-contain rounded-xl bg-white border border-gray-100"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling.style.display = "flex";
                      }}
                    />
                  )}
                  <div className={`${logoSrc ? 'hidden' : 'flex'} w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {initials || (company ? company.charAt(0).toUpperCase() : "—")}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {company || "—"}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {organizationWebsite || "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleEmployeesClick}
                  className="h-9 px-3 text-[10px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {employees != null ? `+${employees} employees` : "Employees"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm shadow-green-500/20 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                General Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-500">
                    Industry
                  </span>
                  <span className="text-sm text-gray-800 font-semibold">
                    {industry || "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-500">
                    Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords && keywords.length > 0
                      ? keywords.split(",").map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg"
                          >
                            {kw.trim()}
                          </span>
                        ))
                      : <span className="text-sm text-gray-800 font-semibold">—</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
