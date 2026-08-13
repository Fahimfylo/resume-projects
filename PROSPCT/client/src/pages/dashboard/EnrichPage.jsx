import { sanitizeDomainForDisplay } from "../../utils/logoHelper";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import MainLayout from "../../components/layout/MainLayout";
import { MdGroupAdd, MdEmail } from "react-icons/md";
import { HiBuildingOffice2 } from "react-icons/hi2";
import { HiLink } from "react-icons/hi";
import EnrichProfile from "../../components/enrich/EnrichProfile";
import API_CONFIG from "../../utils/apiConstant";
import { formatContact } from "../../utils/contactFormatter";
import Cookies from "js-cookie";

const EnrichPage = () => {
  const [activeTab, setActiveTab] = useState("lead");
  const [leadName, setLeadName] = useState("");
  const [leadDomain, setLeadDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [enrichedContact, setEnrichedContact] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const BASE_URL = API_CONFIG.API_ENDPOINT;

  const clearResults = () => {
    setEnrichedContact(null);
    setError("");
    setIsLoading(false);
  };

  useEffect(() => {
    clearResults();
  }, [activeTab]);

  // Fetch company suggestions with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (companyName.length >= 2) {
        setLoadingSuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(`${BASE_URL}/api/search/company-domain-suggestions?query=${companyName}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCompanySuggestions(res.data.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          // console.error("Failed to fetch company suggestions:", error);
          setCompanySuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setCompanySuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companyName, BASE_URL]);

  // Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const performEnrichSearch = async (params) => {
    setError("");
    setIsLoading(true);
    try {
      const token = localStorage.getItem("userAccessToken");
      const response = await axios.post(`${BASE_URL}/api/search/find-leads`, {}, {
        params,
        timeout: 60000, // allow up to 60s for the request (database queries can be slow)
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        setError("Unexpected response from server");
        setEnrichedContact(null);
        return;
      }

      const first = response.data.results[0];
      if (!first) {
        setError("No results found.");
        setEnrichedContact(null);
        return;
      }

      setEnrichedContact(formatContact(first));
    } catch (err) {
      // console.error("[performEnrichSearch] Error:", err);
      let message = "Something went wrong while searching";
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.code === "ECONNABORTED") {
        message = "Request timed out (60s). Please try again or narrow your search.";
      } else if (err.response?.status) {
        message = `Server responded with status ${err.response.status}`;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setEnrichedContact(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindLead = async (e) => {
    e.preventDefault();
    if (!leadName && !leadDomain) {
      setError("Please provide a lead name or domain.");
      return;
    }

    // Extract domain from full URL if provided
    let cleanedDomain = leadDomain;
    if (leadDomain && leadDomain.includes('http')) {
      try {
        const url = new URL(leadDomain);
        cleanedDomain = url.hostname.replace('www.', '');
      } catch {
        // If URL parsing fails, use the original value
        cleanedDomain = leadDomain;
      }
    }

    await performEnrichSearch({
      name: leadName || undefined,
      company: cleanedDomain || undefined,
    });
  };

  const handleFindCompany = async () => {
    if (!companyName) {
      setError("Please provide a company name.");
      return;
    }
    await performEnrichSearch({ company: companyName });
  };

  const handleFindLinkedIn = async () => {
    if (!linkedinUrl) {
      setError("Please provide a LinkedIn URL.");
      return;
    }
    await performEnrichSearch({ linkedin: linkedinUrl });
  };

  const handleFindEmail = async () => {
    if (!email) {
      setError("Please provide an email address.");
      return;
    }
    await performEnrichSearch({ email });
  };

  const handleSuggestionClick = async (item) => {
    const actualValue = typeof item === 'string' ? item : item.name;
    setCompanyName(actualValue);
    setShowSuggestions(false);
    setCompanySuggestions([]);
    // Automatically trigger the search
    await performEnrichSearch({ company: actualValue });
  };

  return (
    <MainLayout>
      <section id="enrich-section" className="">
        <nav className="flex px-4 py-3 bg-white border-b border-gray-200 shadow section-nav">
          <div
            id="second-section-header"
            className="ml-4 text-xl font-semibold search-left lg:flex"
          >
            Enrich
          </div>
        </nav>

        <div className="container flex-col items-center justify-center w-3/4 p-5 mx-auto space-y-6 lg:flex">
          <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50">
            <div className="flex flex-col p-3 sm:p-6 bg-white">
              <div className="flex items-center justify-between mb-1">
                <h2 className="sm:text-lg lg:text-[20px] font-semibold tracking-tight text-gray-900">
                  Contact Enrichment
                </h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                Look up professional profiles by name, company, LinkedIn, or email.
              </p>

              <div className="flex flex-col enrich-types md:flex-row border-b border-gray-100 pb-3 mb-4">
                <div
                  id="lead-form-tab"
                  className={`cursor-pointer flex items-center px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    activeTab === "lead"
                      ? "border-b-2 border-blue-600 text-gray-900 -mb-[13px]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("lead")}
                >
                  <div className="flex items-center gap-1.5">
                    <MdGroupAdd size="16" className={activeTab === "lead" ? "text-blue-400" : "text-gray-400"} />
                    Find lead
                  </div>
                </div>
                <div
                  id="company-form-tab"
                  className={`cursor-pointer flex items-center px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    activeTab === "company"
                      ? "border-b-2 border-blue-600 text-gray-900 -mb-[13px]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("company")}
                >
                  <div className="flex items-center gap-1.5">
                    <HiBuildingOffice2 size="16" className={activeTab === "company" ? "text-blue-600" : "text-gray-400"} />
                    Find company
                  </div>
                </div>
                <div
                  id="lurl-form-tab"
                  className={`cursor-pointer flex items-center px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    activeTab === "lurl"
                      ? "border-b-2 border-blue-600 text-gray-900 -mb-[13px]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("lurl")}
                >
                  <div className="flex items-center gap-1.5">
                    <HiLink size="16" className={activeTab === "lurl" ? "text-blue-600" : "text-gray-400"} />
                    Find by LinkedIn URL
                  </div>
                </div>
                <div
                  id="email-form-tab"
                  className={`cursor-pointer flex items-center px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    activeTab === "email"
                      ? "border-b-2 border-blue-600 text-gray-900 -mb-[13px]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("email")}
                >
                  <div className="flex items-center gap-1.5">
                    <MdEmail size="16" className={activeTab === "email" ? "text-blue-600" : "text-gray-400"} />
                    Email lookup
                  </div>
                </div>
              </div>
          {activeTab === "lead" && (
            <form
              id="lead-form"
              onSubmit={handleFindLead}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <input
                className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                type="text"
                name="name"
                placeholder="Enter lead name"
              />
              <span className="inline-flex items-center justify-center h-10 px-2 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-xl shrink-0">
                @
              </span>
              <input
                className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={leadDomain}
                onChange={(e) => setLeadDomain(e.target.value)}
                type="text"
                name="domain"
                placeholder="Enter domain name"
              />
              <button
                type="submit"
                className="h-9 px-5 font-semibold text-[13px] text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0"
              >
                Find Lead
              </button>
            </form>
          )}
          {activeTab === "company" && (
            <div
              id="company-form"
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              ref={suggestionRef}
            >
              <div className="relative flex-1">
                <input
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  type="text"
                  name="name"
                  placeholder="Enter company name"
                />
                {showSuggestions && companySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {loadingSuggestions ? (
                      <div className="p-3 text-sm text-gray-500">Loading...</div>
                    ) : (
                      companySuggestions.map((item, index) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemDomain = typeof item === 'object' && item.domain ? item.domain : null;
                        const capitalizedItemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
                        const initials = itemName ? itemName.substring(0, 2).toUpperCase() : "??";
                        const finalDomain = sanitizeDomainForDisplay(itemDomain || itemName) || (itemName ? itemName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : null);
                        const logoUrl = finalDomain ? `https://www.google.com/s2/favicons?domain=${finalDomain}&sz=128` : null;
                        return (
                          <div
                            key={index}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 flex items-center gap-3 border-b border-gray-50 last:border-b-0"
                            onClick={() => handleSuggestionClick(item)}
                          >
                            {finalDomain ? (
                              <div className="relative w-6 h-6 flex-shrink-0">
                                <img
                                  src={logoUrl}
                                  alt={`${itemName} logo`}
                                  className="w-full h-full object-contain rounded-full bg-white border border-gray-100"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden w-full h-full bg-blue-500 rounded-full items-center justify-center text-white text-[10px] font-bold">
                                  {initials}
                                </div>
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{capitalizedItemName}</div>
                              {itemDomain && (
                                <div className="text-xs text-gray-500 truncate">{itemDomain}</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleFindCompany}
                className="h-9 px-5 font-semibold text-[13px] text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0"
              >
                Find Company
              </button>
            </div>
          )}
          {activeTab === "lurl" && (
            <div
              id="Lurl-form"
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <input
                className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                type="text"
                name="name"
                placeholder="Enter LinkedIn URL"
              />
              <button
                type="button"
                onClick={handleFindLinkedIn}
                className="h-9 px-5 font-semibold text-[13px] text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0"
              >
                Find URL
              </button>
            </div>
          )}
          {activeTab === "email" && (
            <div
              id="email-form"
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <input
                className="flex-1 h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-500 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                name="name"
                placeholder="Enter email"
              />
              <button
                type="button"
                onClick={handleFindEmail}
                className="h-9 px-5 font-semibold text-[13px] text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0"
              >
                Find Email
              </button>
            </div>
          )}
            </div>
          </div>

      <div className="w-full mt-6">
          {error && (
            <div className="mb-4 px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}
          {isLoading && (
            <div className="mb-4 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching, please wait...
            </div>
          )}
          {!isLoading && !enrichedContact && (
            <div className="mb-4 px-4 py-6 text-center text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl">
              Enter a lookup value and click "Find" to see a lead profile.
            </div>
          )}
          {enrichedContact && (
            <EnrichProfile contact={enrichedContact} />
          )}
      </div>
        </div>
        </section>
    </MainLayout>
  );
};

export default EnrichPage;
