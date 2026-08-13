import { useEffect, useState } from "react";
import axios from "axios";
import { Users, MailX, ListX, Search, List } from "lucide-react";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";

const CONTACT_FILTERS = [
  { label: "My contacts", value: "my" },
  { label: "No emails", value: "no_email" },
  { label: "No list", value: "no_list" },
];

function ContactSidebar() {
  const {
    contactFilter,
    contactListId,
    setContactFilter,
    setContactSearchQuery,
    setContactListId,
  } = useStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState("name");
  const [filterValue, setFilterValue] = useState("");
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const BASE_URL = API_CONFIG.API_ENDPOINT;

  useEffect(() => {
    if (!isListsOpen) return;

    const fetchLists = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/list`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
          },
        });

        if (res.status === 200) {
          setLists(res.data.filter((list) => list.type === "contacts"));
        }
      } catch (err) {
        // console.error("Failed to load lists", err);
      }
    };

    fetchLists();
  }, [isListsOpen, BASE_URL]);

  const selectFilter = (value) => {
    setContactFilter(value);
    setContactSearchQuery("");
    setContactListId(null);
    setFilterValue("");
    setIsFilterOpen(false);
    setIsListsOpen(false);
  };

  const applySearchFilter = (field, value) => {
    const trimmedValue = value?.trim();

    // If no value supplied, reset to show all contacts (same as current behavior).
    if (!trimmedValue) {
      setContactFilter("all");
      setContactSearchQuery("");
      setFilterValue("");
      return;
    }

    setContactFilter("custom");
    setContactListId(null);

    const query = `${field}:${trimmedValue}`;
    setContactSearchQuery(query);
    setFilterValue(value);
  };

  const applyListFilter = (listId) => {
    setContactFilter("list");
    setContactListId(listId);
    setContactSearchQuery("");
  };

  return (
    <div className="w-[94vw] sm:w-[250px] ml-3 hidden sm:block bg-white p-2 mt-3 border h-[80vh] flex-shrink-0">
      <div className="overflow-y-scroll h-full">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-100 text-gray-700 font-medium text-[14px]">
          <span className="text-xl">Filter</span>
        </div>
        
        {/* Quick Filters */}
        <div className="space-y-1">
          {CONTACT_FILTERS.map(({ label, value }) => {
            const isActive = contactFilter === value;
            const icon = value === "my" ? <Users size={17} /> : value === "no_email" ? <MailX size={17} /> : <ListX size={17} />;
            return (
              <div
                key={value}
                className={
                  "p-3 text-[14px] group-hover:text-blue-500 transition-colors delay-75 bg-white rounded cursor-pointer border border-gray-100 " +
                  (isActive
                    ? "text-blue-500"
                    : "text-gray-800")
                }
                onClick={() => selectFilter(value)}
              >
                <span className="flex items-center">
                  <span className={`mr-4 group-hover:text-blue-500 transition-colors delay-75 ${isActive ? "text-blue-500" : "text-gray-500"}`}>
                    {icon}
                  </span>
                  <span className="font-semibold">{label}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Custom Filter Section */}
        <div>
          <div
            className="p-3 text-[14px] group-hover:text-blue-500 transition-colors delay-75 bg-white rounded cursor-pointer border border-gray-100"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
            }}
          >
            <span className="flex items-center">
              <span className="mr-4 text-gray-500 group-hover:text-blue-500 transition-colors delay-75">
                <Search size={17} />
              </span>
              <span className="font-semibold">Custom Filter</span>
            </span>
          </div>
          {isFilterOpen && (
            <div className="p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-xs font-medium cursor-pointer clear-filters hover:text-blue-500 hover:underline"
                  onClick={() => {
                    setContactFilter("all");
                    setContactSearchQuery("");
                    setContactListId(null);
                    setFilterValue("");
                  }}
                >
                  Clear filter
                  {contactFilter === "custom" && filterValue?.trim() && (
                    <span className="ml-1 filter-count">(1)</span>
                  )}
                </span>
              </div>

              <div className="flex gap-1 mb-2">
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="title">Job Title</option>
                  <option value="company">Company</option>
                  <option value="location">Location</option>
                </select>
                <button
                  type="button"
                  onClick={() => applySearchFilter(filterField, filterValue)}
                  className="px-2 py-2 text-xs font-semibold text-white bg-sky-600 rounded hover:bg-sky-700"
                >
                  Apply
                </button>
              </div>
              <input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    applySearchFilter(filterField, filterValue);
                }}
                className="w-full py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                placeholder="Enter filter value..."
              />
            </div>
          )}
        </div>

        {/* Lists Section */}
        <div>
          <div
            className="p-3 text-[14px] group-hover:text-blue-500 transition-colors delay-75 bg-white rounded cursor-pointer border border-gray-100"
            onClick={() => {
              setIsListsOpen(!isListsOpen);
            }}
          >
            <span className="flex items-center">
              <span className="mr-4 text-gray-500 group-hover:text-blue-500 transition-colors delay-75">
                <List size={17} />
              </span>
              <span className="font-semibold">Recent Lists</span>
            </span>
          </div>
          {isListsOpen && (
            <div className="p-2 bg-white">
              {lists.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No lists found.</div>
              ) : (
                lists.filter((list) => list.type === "contacts").map((list) => {
                  const isActive =
                    contactFilter === "list" && list._id === contactListId;
                  return (
                    <div
                      key={list._id}
                      className={
                        "px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 border border-gray-100 " +
                        (isActive
                          ? "text-blue-500"
                          : "text-gray-700")
                      }
                      onClick={() => applyListFilter(list._id)}
                    >
                      {list.name}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactSidebar;
