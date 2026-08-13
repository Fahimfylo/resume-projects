import MainLayout from "../../components/layout/MainLayout";
import RecentSearches from "../../components/search/RecentSearches";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";
import { toast } from "react-toastify";
import { notifySearchSaved, notifySearchDeleted, notifyRecentToSaved } from "../../utils/notificationHelper";

const ITEMS_PER_PAGE = 8;

const RecentSearchesPage = () => {
  const [searches, setSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { lastSavedUpdate, setLastSavedUpdate } = useStore();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = Cookies.get("userAccessToken");
        const { data } = await axios.get(
          `${API_CONFIG.API_ENDPOINT}/api/recent-searches`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSearches(data);
      } catch (err) {
        // console.error("Failed to fetch recent searches", err);
        toast.error("Failed to load recent searches");
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = Cookies.get("userAccessToken");
        const { data } = await axios.get(
          `${API_CONFIG.API_ENDPOINT}/api/saved-searches`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSavedSearches(data);
      } catch (err) {
        // console.error("Failed to fetch saved searches", err);
      }
    };
    fetchSaved();
  }, [lastSavedUpdate]);

  const handleSaveAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Save all recent searches?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();
              try {
                const token = Cookies.get("userAccessToken");
                let saved = 0;

                for (const search of searches) {
                  try {
                    await axios.post(
                      `${API_CONFIG.API_ENDPOINT}/api/saved-searches`,
                      {
                        searchName: "Custom Search",
                        filters:
                          search.searchParams?.filters || search.filters || {},
                        excludedFilters:
                          search.searchParams?.excludedFilters || {},
                      },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    saved++;
                  } catch (err) {
                    // console.error("Failed to save individual search", err);
                  }
                }

                setLastSavedUpdate(Date.now());

                toast.success(
                  `${saved} search${saved !== 1 ? "es" : ""} saved`,
                );
                
                notifyRecentToSaved("Custom Search");
              } catch (err) {
                // console.error("Save all failed", err);
                toast.error("Failed to save all searches");
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  const handleUnsaveAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Remove all saved searches?
        </p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                const token = Cookies.get("userAccessToken");
                let removed = 0;
                // Use Promise.all for faster bulk deletion
                await Promise.all(
                  savedSearches.map(async (saved) => {
                    await axios.delete(
                      `${API_CONFIG.API_ENDPOINT}/api/saved-searches/${saved._id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    removed++;
                  }),
                );
                setLastSavedUpdate(Date.now());
                toast.success(`${removed} items removed from saved`);
                
                notifySearchDeleted("Saved", removed);
              } catch (err) {
                toast.error("Failed to unsave all");
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  const handleDeleteAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete all recent searches?
        </p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();
              try {
                const token = Cookies.get("userAccessToken");
                let deleted = 0;

                await Promise.all(
                  searches.map(async (search) => {
                    await axios.delete(
                      `${API_CONFIG.API_ENDPOINT}/api/recent-searches/${search._id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    deleted++;
                  }),
                );

                setSearches([]);
                toast.success(`${deleted} searches deleted`);
                
                notifySearchDeleted("Recent", deleted);
              } catch (err) {
                toast.error("Failed to delete all");
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  // Pagination
  const totalPages = Math.ceil(searches.length / ITEMS_PER_PAGE);
  const currentItems = searches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <MainLayout>
      <section className="bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Recent Searches
            </h2>
            {searches.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAll}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-transparent border border-gray-300 rounded hover:bg-gray-50 transition-all"
                >
                  Save all
                </button>
                <button
                  onClick={handleUnsaveAll}
                  disabled={savedSearches.length === 0}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-transparent border border-gray-300 rounded hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unsave all
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-transparent border border-gray-300 rounded hover:bg-gray-50 transition"
                >
                  Delete all
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <RecentSearches
              searches={currentItems}
              onDelete={(id) =>
                setSearches((prev) => prev.filter((s) => s._id !== id))
              }
            />
          )}

          {/* Pagination */}
          {searches.length >= 10 && (
            <div className="flex justify-end gap-1 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2 py-0.5 text-xs rounded border ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default RecentSearchesPage;
