import { Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../search/Pagination";
import EditColumns from "./EditColumns";
import ExportContacts from "./ExportContacts";
import EmptyPage from "../common/EmptyPage";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";
import { formatContact } from "../../utils/contactFormatter";
import CompanyLogo from "../common/CompanyLogo";
import ContactSelectBar from "./ContactSelectBar";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function ContactsContainer() {
  const navigate = useNavigate();
  const {
    contactFilter,
    contactSearchQuery,
    contactListId,
    setContactFilter,
    setContactSearchQuery,
    setContactListId,
    checkedItems,
    toggleCheckedItems,
    toggleAllCheckedItems,
    clearCheckedItems,
    hasContactData,
    setHasContactData,
    totalSavedContacts,
    setTotalSavedContacts,
    setFilteredContactCount,
    visibleColumns,
    filters,
    setFilters,
  } = useStore();
  const page = filters?.currentPage || 1;
  const perPage = filters?.limit || 25;
  const tableRef = useRef(null);

  const { isLoggedIn } = useStore();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["savedContacts"],
    queryFn: async () => {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

      const res = await axios.get(`${BASE_URL}/api/saved/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status !== 200) {
        throw new Error("Failed to fetch saved contacts");
      }

      try {
        localStorage.setItem("savedContactsCache", JSON.stringify(res.data));
      } catch {
        // ignore localStorage failures
      }

      return res.data;
    },
    enabled: isLoggedIn,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    // Don't use initialData - it causes stale cache issues
  });

  const savedItems = useMemo(() => {
    if (!response) return [];

    // Backend returns either: { data: [items], totalSavedItems }
    // or in some cases it might return the array directly.
    let items = [];
    if (Array.isArray(response)) {
      items = response;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    }

    return items;
  }, [response]);

  // Update totalSavedContacts count in store for delete all functionality
  useEffect(() => {
    setTotalSavedContacts(savedItems.length);
  }, [savedItems, setTotalSavedContacts]);

  const formattedContacts = useMemo(() => {
    return savedItems
      .map((saved) => {
        // Use contactData from SavedContacts instead of populated contactId
        const raw = saved?.contactData || saved?.contactId || saved?.itemId || saved;
        const formatted = raw ? formatContact(raw) : null;
        if (!formatted) return null;

        // Normalize list IDs so list filters work reliably.
        const listIdsRaw =
          saved?.listIds ||
          (saved?.listId ? [saved.listId] : []) ||
          (Array.isArray(saved?.list) ? saved.list : saved?.list ? [saved.list] : []);
        const listIds = Array.isArray(listIdsRaw)
          ? listIdsRaw.map((id) => String(id))
          : [];

        return {
          ...formatted,
          is_saved: true,
          listIds,
          savedContactId: saved._id, // Use SavedContacts document _id for deletion
          createdAt: saved.createdAt || saved.updatedAt || null,
          source:
            raw._index ||
            raw._type ||
            raw._source?.source ||
            raw._source?.person_source ||
            raw._source?.organization_source ||
            "unknown",
        };
      })
      .filter(Boolean);
  }, [savedItems]);

  const filteredContacts = useMemo(() => {
    if (!contactFilter) {
      return formattedContacts;
    }

    // When filtering by a list, use the normalized list IDs from formattedContacts.
    // If we can't find any members (e.g. list IDs are missing), fall back to showing all saved contacts.
    if (contactFilter === "list" && contactListId) {
      return formattedContacts.filter((contact) =>
        (contact.listIds || []).includes(String(contactListId)),
      );
    }

    return formattedContacts.filter((contact) => {
      switch (contactFilter) {
        case "all":
          // Show all leads (verified/unverified) — the UI will still render only the Email column.
          return true;
        case "my":
          return contact.is_saved;
        case "valid":
          return !!contact.email && contact.email.includes("@");
        case "accept_all": {
          const status = String(contact.emailStatus || "").toLowerCase();
          return status.includes("accept") && status.includes("all");
        }
        case "no_email":
          return !contact.email;
        case "no_list":
          return (contact.listIds || []).length === 0;
        case "custom": {
          if (!contactSearchQuery?.trim()) return true;

          // Supported filters: name,email,title,company,location
          // Format in sidebar: "field:value" (e.g. "name:john")
          const raw = contactSearchQuery.trim();
          const [field, ...rest] = raw.split(":");
          const value = rest.join(":").trim().toLowerCase();

          const fieldValue = (() => {
            switch (field?.toLowerCase()) {
              case "email":
                return contact.email;
              case "title":
                return contact.title;
              case "company":
                return contact.company;
              case "location":
                return contact.location;
              case "name":
              default:
                return contact.name;
            }
          })();

          // If the user provided multiple comma-separated values (e.g. "developer,designer"),
          // treat it as an OR match for job title/location.
          const terms = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

          if (terms.length === 0) {
            return true;
          }

          const fieldString = String(fieldValue || "").toLowerCase();

          if (field === "title" || field === "location") {
            return terms.some((term) => fieldString.includes(term.toLowerCase()));
          }

          // For name/email/company, use single-term substring matching.
          return fieldString.includes(value);
        }
        default:
          return true;
      }
    });
  }, [formattedContacts, savedItems, contactFilter, contactSearchQuery, contactListId]);

  // Update filteredContactCount in store for header button visibility
  useEffect(() => {
    setFilteredContactCount(filteredContacts.length);
  }, [filteredContacts, setFilteredContactCount]);

  const totalItems = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const paginatedContacts = filteredContacts.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  // Scroll to top of table when page changes
  useEffect(() => {
    tableRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  const prevPageRef = useRef(page);
  useEffect(() => {
    if (prevPageRef.current !== page) {
      console.log("[PAGINATION] currentPage changed:", prevPageRef.current, "→", page);
      console.log("[PAGINATION] filteredContacts.length:", filteredContacts.length);
      console.log("[PAGINATION] paginatedContacts.length:", paginatedContacts.length);
      console.log("[PAGINATION] paginationData:", paginationData);
      prevPageRef.current = page;
    }
  });

  // Ensure pagination resets when filter criteria change
  useEffect(() => {
    setFilters("currentPage", 1);
  }, [contactFilter, contactSearchQuery, contactListId, setFilters]);

  const paginationData = useMemo(() => {
    return {
      total: totalItems,
      saved: 0,
      new: totalItems,
      onPage: paginatedContacts.length,
    };
  }, [totalItems, paginatedContacts]);

  // Update store with data availability
  useEffect(() => {
    if (!isLoading && response !== undefined) {
      setHasContactData(savedItems.length > 0);
    }
  }, [isLoading, response, savedItems, setHasContactData]);

  const baseColumns =
    visibleColumns && visibleColumns.length
      ? visibleColumns
      : [
          "Name",
          "Email",
          "Job Title",
          "Company",
          "Location",
          "Phone",
          "Employees",
          "Industry",
          "Keywords",
        ];

  const columns = [...baseColumns];


  const allChecked =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((contact) =>
      checkedItems.some((item) => item._id === contact._id),
    );

  const isContactEmpty = !isLoading && !error && paginatedContacts.length === 0;

  const handleToggleAll = () => {
    toggleAllCheckedItems(allChecked ? [] : paginatedContacts);
  };

  const handleToggleRow = (contact) => {
    toggleCheckedItems(contact);
  };

  if (isContactEmpty) {
    return (
      <div className="flex-1 min-w-0 mx-3 md:mx-4 mt-3 flex flex-col items-center justify-center h-full">
        <EmptyPage
          title="No contacts to display."
          description="No saved contacts match your criteria. Try changing filters or add new contacts."
          noPadding
        />
        <button
          onClick={() => navigate("/search")}
          className="mt-4 text-sm text-sky-600 hover:text-sky-800 hover:underline cursor-pointer transition-colors"
        >
          &lt; Go to search and save
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 mx-3 md:mx-4 mt-3 overflow-y-hidden flex flex-col h-full">
      <div className="flex-1 flex flex-col border border-gray-300 bg-white shadow-sm min-h-0 overflow-hidden rounded-lg">
        <ContactSelectBar
          paginatedContacts={paginatedContacts}
          formattedContacts={formattedContacts}
          totalCount={totalItems}
        />
        <div ref={tableRef} className="flex-1 overflow-x-auto overflow-y-auto min-h-0 no-y-scrollbar relative">
        <table className="w-full text-left text-gray-800" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
          <thead
            className="text-xs bg-white sticky top-0 z-30"
          >
            <tr className="bg-gray-50">
              <th className="w-12 py-3 px-3 text-center border-b border-t border-gray-200">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                />
              </th>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`py-3 px-5 text-start font-semibold text-gray-600 min-w-[120px] ${index === 0 ? 'sticky left-0 bg-gray-50 z-40 border-b border-t border-gray-200' : 'border-b border-t border-gray-200'}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={1 + columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <span className="text-gray-500 font-medium">Loading contacts...</span>
                  </div>
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={1 + columns.length} className="text-center py-12 text-red-600 font-medium">
                  Error loading contacts
                </td>
              </tr>
            )}
            {!isLoading && !error && paginatedContacts.length === 0 && (
              <tr>
                <td colSpan={1 + columns.length} className="text-center py-12 text-gray-500 font-medium">
                  No contacts to display
                </td>
              </tr>
            )}
            {paginatedContacts.map((contact) => {
              const isChecked = checkedItems.some(
                (item) => item._id === contact._id,
              );
              return (
                <tr key={contact.savedContactId || contact._id} className="text-sm hover:bg-gray-50 transition-colors border-b border-gray-200 h-14">
                  <td className="text-center py-4 pl-[5px] pr-3 border-b border-gray-200 h-14">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRow(contact)}
                    />
                  </td>
                  {columns.map((column, colIndex) => {
                    const cellClass = `py-2 pl-[5px] pr-5 border-b border-gray-200 h-14 truncate ${colIndex === 0 ? 'sticky left-0 bg-white z-20 border-b border-gray-200' : ''}`;
                    switch (column) {
                      case "Name":
                        const avatarColors = [
                          "bg-red-200 text-red-800",
                          "bg-blue-200 text-blue-800",
                          "bg-green-200 text-green-800",
                          "bg-yellow-200 text-yellow-800",
                          "bg-purple-200 text-purple-800",
                          "bg-pink-200 text-pink-800",
                          "bg-indigo-200 text-indigo-800",
                          "bg-teal-200 text-teal-800",
                          "bg-orange-200 text-orange-800",
                          "bg-cyan-200 text-cyan-800",
                        ];
                        const colorIndex = (contact.name?.charCodeAt(0) || 0) % avatarColors.length;
                        return (
                          <td key={column} className={cellClass}>
                            <div className="flex items-center truncate">
                              <div className={`w-8 h-8 ${avatarColors[colorIndex]} rounded-full flex items-center justify-center mr-2 flex-shrink-0`}>
                                {contact.initials}
                              </div>
                              <span className="truncate">{contact.name}</span>
                            </div>
                          </td>
                        );
                      case "Email":
                        return (
                          <td key={column} className={cellClass}>
                            <div className="flex items-center truncate">
                              <Mail size={16} className="mr-2 text-green-500 flex-shrink-0" />
                              <span className="truncate">{contact.email || "Not Available"}</span>
                            </div>
                          </td>
                        );
                      case "Job Title":
                        return (
                          <td key={column} className={`${cellClass} max-w-[260px]`} title={contact.title}>
                            <span className="truncate block">{contact.title}</span>
                          </td>
                        );
                      case "Company": {
                        return (
                          <td key={column} className={cellClass} title={contact.company}>
                            <div className="flex items-center truncate">
                              <div className="relative w-8 h-8 flex-shrink-0 mr-2">
                                <CompanyLogo domain={contact.organizationDomain} name={contact.company} size={32} className="rounded-md" />
                              </div>
                              <span className="truncate">{contact.company}</span>
                            </div>
                          </td>
                        );
                      }
                      case "Location":
                        return (
                          <td key={column} className={cellClass} title={contact.location}>
                            <span className="truncate block">{contact.location}</span>
                          </td>
                        );
                      case "Zip/Postal":
                        return (
                          <td key={column} className={cellClass} title={contact.postalCode}>
                            <span className="truncate block">{contact.postalCode || "Not Available"}</span>
                          </td>
                        );
                      case "Status":
                        return (
                          <td key={column} className={cellClass}>
                            <span className="truncate block">{contact.emailStatus || "unknown"}</span>
                          </td>
                        );
                      case "Phone":
                        return (
                          <td key={column} className={cellClass}>
                            <span className="truncate block">{contact.phone || "Not Available"}</span>
                          </td>
                        );
                      case "Employees":
                        return (
                          <td key={column} className={cellClass}>
                            <span className="truncate block">{contact.employees ?? "Not Available"}</span>
                          </td>
                        );
                      case "Industry":
                        return (
                          <td key={column} className={cellClass} title={contact.industry}>
                            <span className="truncate block">{contact.industry || "Not Available"}</span>
                          </td>
                        );
                      case "Keywords": {
                        const rawKeywords = contact.keywords || "";
                        const keywordString = Array.isArray(rawKeywords)
                          ? rawKeywords.join(", ")
                          : String(rawKeywords);
                        const maxLength = 40;
                        const truncated =
                          keywordString.length > maxLength
                            ? `${keywordString.slice(0, maxLength)}...`
                            : keywordString;

                        return (
                          <td key={column} className={cellClass}>
                            <span
                              className="block truncate cursor-pointer"
                              title={keywordString || "No keywords"}
                              onClick={() => {
                                if (keywordString.length > maxLength) {
                                  window.alert(keywordString);
                                }
                              }}
                            >
                              {keywordString ? truncated : "Not Available"}
                            </span>
                          </td>
                        );
                      }
                      default:
                        return (
                          <td key={column} className={cellClass}>
                            <span className="truncate block">{contact[column.toLowerCase()] ?? "Not Available"}</span>
                          </td>
                        );
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditColumns />
      <ExportContacts />
    </div>
      <Pagination data={paginationData} usePageMode={true} />
    </div>
  );
}

export default ContactsContainer;
