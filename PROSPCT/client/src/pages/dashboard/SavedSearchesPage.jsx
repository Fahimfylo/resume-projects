import MainLayout from "../../components/layout/MainLayout";
import SavedSearches from "../../components/search/SavedSearches";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { notifySearchDeleted } from "../../utils/notificationHelper";

const ITEMS_PER_PAGE = 8;

const SavedSearchesPage = () => {
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { lastSavedUpdate, setLastSavedUpdate } = useStore();

  const handleApplySearch = (search) => {
    const filtersObj = search?.searchParams?.filters || search?.filters || {};
    const excludedObj = search?.searchParams?.excludedFilters || {};
    useStore.getState().setInitialFilters(filtersObj, excludedObj);
    navigate("/search");
  };

  // Fetch saved searches
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
        setSearches(data);
      } catch (err) {
        // console.error("Failed to fetch saved searches", err);
        toast.error("Failed to load saved searches");
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [lastSavedUpdate]);

  const handleUnsaveAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Remove all from saved searches?
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

                for (const search of searches) {
                  try {
                    await axios.delete(
                      `${API_CONFIG.API_ENDPOINT}/api/saved-searches/${search._id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    removed++;
                  } catch (err) {
                    // console.error("Failed to remove individual search", err);
                  }
                }

                setLastSavedUpdate(Date.now());

                toast.success(
                  `${removed} search${removed !== 1 ? "es" : ""} removed`,
                );
                
                notifySearchDeleted("Saved", removed);
              } catch (err) {
                // console.error("Unsave all failed", err);
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
          Delete all saved searches?
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

                for (const search of searches) {
                  try {
                    await axios.delete(
                      `${API_CONFIG.API_ENDPOINT}/api/saved-searches/${search._id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    deleted++;
                  } catch (err) {
                    // console.error("Failed to delete individual search", err);
                  }
                }

                setSearches([]);
                setLastSavedUpdate(Date.now());

                toast.success(
                  `${deleted} search${deleted !== 1 ? "es" : ""} deleted`,
                );
                
                notifySearchDeleted("Saved", deleted);
              } catch (err) {
                // console.error("Delete all failed", err);
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

  // Pagination calculations
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
              Saved Searches
            </h2>
            {searches.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleUnsaveAll}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-transparent border border-gray-300 rounded hover:bg-gray-50 transition-all"
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
            <SavedSearches
              searches={currentItems}
              onApplySearch={handleApplySearch}
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

export default SavedSearchesPage;
