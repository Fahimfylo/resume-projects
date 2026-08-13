import { MailCheck, PhoneOutgoing, ChevronsUpDown } from "lucide-react";
//import myImage from "../../../public/vite.svg";
import { FaLinkedin, FaLinkedinIn, FaLink, FaFacebookF } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { sanitizeDomainForDisplay } from "../../utils/logoHelper";
import useStore from "../../store/store";
import LeadTableSkeleton from "./LeadTableSkeleton";
import { useState, memo } from "react";
import EmptyState from "../admin/EmptyState";
import SocialLink from "../common/SocialLink";

const logoCache = new Set();

// ─── Email Status Badge Helper ────────────────────────────────────────────────
const EMAIL_STATUS_CONFIG = {
  verified:     { label: "Verified",     bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500"  },
  unavailable:  { label: "Unavailable",  bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500"    },
  extrapolated: { label: "Extrapolated", bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500"  },
};

const EmailStatusBadge = ({ status }) => {
  if (!status) return null;
  const key = status.toLowerCase();
  const cfg = EMAIL_STATUS_CONFIG[key];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight ${
        cfg.bg
      } ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const LeadTable = memo(function LeadTable({
  handleMouseEnter,
  handleMouseLeave,
  data,
  error,
  isLoading,
  isEmailVisible,
  onEmailClick,
  isPhoneVisible,
  onPhoneClick,
  viewType,
  loadingItemId,
  setDataItem,
  showEmailStatus,
}) {
  const { checkedItems, toggleCheckedItems, setLeadProfileVisible, visibleColumns, selectedEmployeeCount } =
    useStore();

  const handleCheckboxChange = (item) => {
    if (item && item._id) {
      toggleCheckedItems(item);
    }
  };

  const [copiedId, setCopiedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const handleCopy = (data, id) => {
    navigator.clipboard.writeText(data);
    setCopiedId(id); // Set the copied email ID to the item
    setTimeout(() => {
      setCopiedId(null); // Reset after some time
    }, 1000);
  };

  if (isLoading) {
    return <LeadTableSkeleton />; // Customize loading indicator as needed
  }

  if (error) {
    return <div className="error-message">Error: {error.message || String(error)}</div>; // Display the error message
  }

  // Function to generate a deeper shade of a color
  const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100);
    G = parseInt((G * (100 + percent)) / 100);
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR =
      R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
    const GG =
      G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
    const BB =
      B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

    return `#${RR}${GG}${BB}`;
  };

  // Array of colors
  const colors = [
    "#EEDEBE",
    "#D8BEEE",
    "#EEC4BE",
    "#BED1EE",
    "#BEEEC6",
    "#EEBECC",
  ];

  let index = 0;

  // Column configuration
  const columnConfig = {
    Name: { width: "w-[300px]", sticky: true },
    Company: { width: "w-[190px]", sticky: false },
    Email: { width: "w-[180px]", sticky: false },
    Phone: { width: "w-[180px]", sticky: false },
    Location: { width: "w-[180px]", sticky: false },
    "Zip/Postal": { width: "w-[130px]", sticky: false },
    Employees: { width: "w-[180px]", sticky: false },
    Industry: { width: "w-[180px]", sticky: false },
    Keywords: { width: "w-[280px]", sticky: false },
  };

  // Helper to check if column should be visible
  const isColumnVisible = (columnName) => visibleColumns?.includes(columnName) ?? true;

  // Calculate dynamic padding based on number of visible columns
  const visibleColumnCount = visibleColumns?.length ?? 8;
  const dynamicPadding = visibleColumnCount === 1 ? "pl-5" : "pl-4";

  // Show empty state when no data
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No leads found"
        subtitle="Try adjusting your filters or search criteria to find more results."
        size="md"
        iconColor="text-blue-600"
      />
    );
  }

  return (
    <table className="min-w-full text-left text-gray-800 table-fixed" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
        <thead
          className="text-xs bg-white border-b"
          style={{ position: "sticky", top: 0, zIndex: 20 }}
        >
          <tr>
            {isColumnVisible("Name") && (
              <th className={`pl-4 py-2 ${columnConfig.Name.width} lg:sticky left-0 bg-white z-10 shadow-none border-b border-gray-200`}>
                <div className="flex items-center">
                  <span>Name</span>
                  <ChevronsUpDown size={14} className="ml-1 text-gray-500 " />
                </div>
              </th>
            )}
            {isColumnVisible("Company") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Company.width}`}>
                <div className="flex items-center">
                  <span>Company</span>
                  <ChevronsUpDown size={14} className="ml-1 text-gray-500 " />
                </div>
              </th>
            )}
            {isColumnVisible("Email") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Email.width}`}>
                <div className="flex items-center">
                  <span>Email</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Phone") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Phone.width}`}>
                <div className="flex items-center">
                  <span>Phone</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Location") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Location.width}`}>
                <div className="flex items-center">
                  <span>Location</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Zip/Postal") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig["Zip/Postal"].width}`}>
                <div className="flex items-center">
                  <span>Zip/Postal</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Employees") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Employees.width}`}>
                <div className="flex items-center">
                  <span>Employees</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Industry") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Industry.width}`}>
                <div className="flex items-center">
                  <span>Industry</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
            {isColumnVisible("Keywords") && (
              <th className={`pl-4 py-2 font-normal ${columnConfig.Keywords.width}`}>
                <div className="flex items-center">
                  <span>Keywords</span>
                  <ChevronsUpDown
                    size={14}
                    className="ml-1 text-gray-500 cursor-pointer"
                  />
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-200 ${dynamicPadding}`}>
          {data.map((item) => {
              const randomColor = colors[index];
              if (index < 5) {
                index++;
              } else {
                index = 0;
              }
              const textColor = shadeColor(randomColor, -90);
              // Use formatted fields from the mapping layer
              const initials = item.initials || "??";
              const initials2 = item.companyInitials ?? "??";

              return (
                <tr
                  key={item._id}
                  className={`text-sm hover:bg-gray-50 group border-b border-gray-200 ${dynamicPadding}`}
                  onClick={() => {
                    setLeadProfileVisible(true);
                    setDataItem(item);
                  }}
                >
                  {isColumnVisible("Name") && (
                    <td className={`left-0 z-10 w-16 py-3 pr-8 overflow-hidden bg-white lg:sticky border-b border-gray-200 whitespace-nowrap group-hover:bg-gray-50 text-ellipsis ${dynamicPadding}`}>
                      <div className="flex items-center contact-row">
                        <div className="flex items-center">
                          <input
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            type="checkbox"
                            className="ml-2 mr-4 lead-checkbox"
                            checked={checkedItems.some(
                              (checkedItem) => checkedItem._id === item._id
                            )}
                            onChange={() => handleCheckboxChange(item)}
                          />
                          <div className="flex items-center gap-5 contact-info">
                            <div className="relative w-8 h-8 flex-shrink-0">
                              {item.avatarUrl ? (
                                // Real LinkedIn profile image
                                <img
                                  src={item.avatarUrl}
                                  alt={item.name}
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => {
                                    // On error, fall back to generated avatar
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                // Generated avatar from initials
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`}
                                  alt={item.name}
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              )}
                              <div
                                className="hidden items-center justify-center w-full h-full text-xs text-white rounded-full name-color"
                                style={{
                                  backgroundColor: randomColor,
                                  color: textColor,
                                }}
                              >
                                {initials}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 contact-name">
                              <div className="relative flex items-center gap-5 font-semibold item-name-lead">
                                <h2
                                  onMouseEnter={handleMouseEnter}
                                  onMouseLeave={handleMouseLeave}
                                  className="cursor-pointer group-hover:text-blue-500"
                                >
                                  {item.name}
                                </h2>
                                <SocialLink
                                  url={item.linkedinUrl}
                                  icon={FaLinkedin}
                                  size={16}
                                  className={`transition-colors delay-75 ${item.linkedinUrl ? 'hover:text-blue-700' : 'text-gray-600'}`}
                                />
                              </div>

                              <div
                                className="mr-2 overflow-hidden text-sm truncate w-36 item-name-lead"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                              >
                                {item.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {isColumnVisible("Company") && (
                    <td className={`py-3 font-semibold text-gray-800 border-b whitespace-nowrap ${dynamicPadding}`}>
                      <div className="flex items-center">
                        <div className="relative w-6 h-6 flex-shrink-0">
                          {(() => {
                            const rawDomain = item.organizationDomain || item.company;
                            const domain = sanitizeDomainForDisplay(rawDomain) || (item.company ? item.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : null);
                            const src = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
                            return src ? (
                              <>
                                <img
                                  src={src}
                                  alt={`${item.company} logo`}
                                  className="w-full h-full object-contain rounded-full bg-white border border-gray-100"
                                  onLoad={() => domain && logoCache.add(domain)}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden w-full h-full bg-blue-500 rounded-full items-center justify-center text-white text-[10px] font-bold">
                                  {item.companyInitials ?? "??"}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                {item.companyInitials ?? "??"}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ml-2 overflow-hidden">
                          <div
                            className="truncate w-36"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            {item.company}
                          </div>
                          <div className="flex">
                            <SocialLink
                              url={item.organizationWebsite}
                              icon={FaLink}
                              size={17}
                              className="pt-1 mr-1"
                            />
                            <SocialLink
                              url={item.organizationLinkedin}
                              icon={FaLinkedinIn}
                              size={19}
                              className="pt-1 mr-1"
                            />
                            <SocialLink
                              url={item.organizationFacebook}
                              icon={FaFacebookF}
                              size={17}
                              className="pt-1 mr-1"
                            />
                            <SocialLink
                              url={item.organizationTwitter}
                              icon={FaXTwitter}
                              size={17}
                              className="pt-1 mr-1"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  )}

                  {isColumnVisible("Email") && (
                    <td className={`py-3 border-b whitespace-nowrap ${dynamicPadding}`}>
                      <div
                        className="pr-5 show-email"
                        onMouseEnter={() => setHoveredId(item.email)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {viewType === "saved" || item.is_saved || isEmailVisible[item._id] ? (
                          <>
                            <div className="flex flex-col gap-0.5">
                              <p
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item.email, item.email);
                                }}
                                className="relative truncate"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                              >
                                {item.email ? item.email : "Not Found"}
                              </p>
                              {showEmailStatus && <EmailStatusBadge status={item.emailStatus} />}
                            </div>
                            {hoveredId === item.email && hoveredId !== null && (
                              <div className="absolute mt-[7px] ml-[-60px] bg-slate-900 border border-gray-800 text-sm shadow-md py-[4px] px-2 rounded-sm text-white copy-text">
                                {copiedId === item.email ? "Copied" : "Copy"}
                              </div>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmailClick(item._id);
                            }}
                            className="flex flex-col items-start gap-0.5"
                          >
                            <span className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-sm show-email-btn">
                              {loadingItemId === item._id ? (
                                <svg className="animate-spin mr-[7px] text-blue-600" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <MailCheck size={16} className="mr-[7px] text-blue-600 text-[14px]" />
                              )}
                              <span>Show email</span>
                            </span>
                            {showEmailStatus && <EmailStatusBadge status={item.emailStatus} />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                  {isColumnVisible("Phone") && (
                    <td className={`py-3 border-b whitespace-nowrap ${dynamicPadding}`}>
                      {viewType === "saved" || item.is_saved || isPhoneVisible?.[item._id] ? (
                        <div
                          onMouseEnter={() => setHoveredId(item.phone)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <p
                            className="truncate"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.phone, item.phone);
                            }}
                          >
                            {item.phone ? item.phone : "Not Available"}
                          </p>
                          {hoveredId === item.phone && hoveredId !== null && (
                            <div className="absolute mt-[7px] ml-[-60px] bg-slate-900 border border-gray-800 text-sm shadow-md py-[4px] px-2 rounded-sm text-white copy-text">
                              {copiedId === item.phone ? "Copied" : "Copy"}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPhoneClick(item._id);
                          }}
                          className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-sm show-email-btn"
                        >
                          {loadingItemId === item._id ? (
                            <svg className="animate-spin mr-[7px] text-blue-600" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <PhoneOutgoing size={16} className="mr-[7px] text-blue-600 text-[14px]" />
                          )}
                          <span>Show phone</span>
                        </button>
                      )}
                    </td>
                  )}

                  {isColumnVisible("Location") && (
                    <td className={`py-3 pr-5 border-b ${dynamicPadding}`}>
                      <p
                        className="truncate whitespace-nowrap"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {item.location}
                      </p>
                    </td>
                  )}

                  {isColumnVisible("Zip/Postal") && (
                    <td className={`py-3 pr-5 border-b ${dynamicPadding}`}>
                      <p
                        className="truncate whitespace-nowrap"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {item._locationPostalCode || item.postalCode || "Not Available"}
                      </p>
                    </td>
                  )}

                  {isColumnVisible("Employees") && (
                    <td className={`px-5 py-3 border-b ${dynamicPadding}`}>
                      <p
                        className="truncate whitespace-nowrap"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {selectedEmployeeCount ? selectedEmployeeCount : (item.employees != null ? item.employees : 'Not Available')}
                      </p>
                    </td>
                  )}

                  {isColumnVisible("Industry") && (
                    <td className={`py-3 pr-5 border-b ${dynamicPadding}`}>
                      <p
                        className="truncate whitespace-nowrap"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {item.industry}
                      </p>
                    </td>
                  )}

                  {isColumnVisible("Keywords") && (
                    <td className={`px-8 py-3 border-b ${dynamicPadding}`}>
                      <p
                        className="truncate"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {item.keywords ? (() => {
                          const words = item.keywords.split(',').map(w => w.trim());
                          const truncatedWords = words.slice(0, 2).map(w => w.length > 15 ? w.substring(0, 15) + '...' : w);
                          return truncatedWords.join(', ') + (words.length > 2 ? '...' : '');
                        })() : "Not Available"}
                      </p>
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
  );
});

export default LeadTable;
