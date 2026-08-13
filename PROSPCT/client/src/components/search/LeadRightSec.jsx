import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import LeadTable from "./LeadTable";
import LeadTableSkeleton from "./LeadTableSkeleton";
import Pagination from "./Pagination";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";
import { saveSearchShareState } from "../../api/mutation";
import LeadRightTopbar from "./LeadRightTopbar";
import LeadSelectBar from "./LeadSelectBar";
import { toast } from "react-toastify";
import useCreditDeduction from "../../hooks/useCreditDeduction";
import { useSearchParams } from "react-router-dom";
import { formatContacts } from "../../utils/contactFormatter";
import { saveRecentSearch } from "../../services/searchServices";
import EmptyPage from "../common/EmptyPage";
import { useDebounce } from "../../hooks/useDebounce";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const LeadRightSec = ({
  handleMouseEnter,
  handleMouseLeave,
  setHoveredProfile,
  setDataItem,
}) => {
  const {
    filters,
    excludedFilters,
    setIsDataLoading,
    setInitialFilters,
    setVisibleColumns,
    visibleColumns,
    dataRefreshKey,
    setNextPageInfo,
    totalCounts,
  } = useStore();

  const [visibleEmails, setVisibleEmails] = useState({});
  const [visiblePhoneNumber, setVisiblePhoneNumber] = useState({});
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [searchParams] = useSearchParams();
  const isInitialLoad = useRef(true);
  const [counts, setCounts] = useState({ total: null, saved: null, new: null });
  const [totalLoading, setTotalLoading] = useState(false);

  const { deductCredit, isLoading: isCreditDeducting } = useCreditDeduction();
  const queryClient = useQueryClient();

  /* ===============================
     BATCH SEARCH STATE
     Renders first 25 rows immediately, loads more in background.
  =============================== */
  const [rows, setRows] = useState([]);
  const [isLoadingFirst, setIsLoadingFirst] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextBatchCursor, setNextBatchCursor] = useState(null);
  const [hasMoreBatch, setHasMoreBatch] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastResults = useRef([]);
  const hasLoadedOnce = useRef(false);
  const initialLoadGuardRef = useRef(false);
  const prevDataRefreshKeyRef = useRef(dataRefreshKey);

  /* ===============================
     DEBOUNCED FILTERS
   =============================== */
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedExcluded = useDebounce(excludedFilters, 300);

  const resultsFilterKey = useMemo(
    () => JSON.stringify({ f: debouncedFilters, e: debouncedExcluded, r: dataRefreshKey, retry: refreshKey }),
    [debouncedFilters, debouncedExcluded, dataRefreshKey, refreshKey],
  );

  const completedKeyRef = useRef(null);

  // Fetch first batch + count in parallel; auto-load more batches in background
  useEffect(() => {
    let cancelled = false;

    const fetchInitialBatch = async () => {
      const isFirst = !hasLoadedOnce.current;

      if (isFirst) {
        setIsLoadingFirst(true);
      } else {
        setIsRefreshing(true);
      }
      initialLoadGuardRef.current = true;
      loadBatchCountRef.current = 0;
      setRows([]);
      setNextBatchCursor(null);
      setHasMoreBatch(false);
      setFetchError(null);
      const isPageNav = !!filters.cursor;
      if (!isPageNav) {
        const isRefreshKeyChange = dataRefreshKey !== prevDataRefreshKeyRef.current;
        prevDataRefreshKeyRef.current = dataRefreshKey;

        if (isRefreshKeyChange) {
          // dataRefreshKey change (e.g. save from modal, reveal from profile) —
          // keep existing counts visible, silently re-fetch in background.
          // Don't clear counts or show loading to avoid the "restart" flicker.
        } else {
          // Filter change — clear counts and show loading
          setCounts({ total: null, saved: null, new: null });
          setTotalLoading(true);
          useStore.getState().setTotalCounts({ total: null, saved: null, new: null });
        }
      }

      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const body = JSON.stringify({ filters: debouncedFilters, excludedFilters: debouncedExcluded });

      try {
        // 1. Fetch batch first — show table as soon as results arrive
        const batchRes = await fetch(`${BASE_URL}/api/search/batch`, { method: "POST", headers, body });

        if (cancelled) return;

        if (batchRes.ok) {
          const batchData = await batchRes.json();
          setRows(batchData.results || []);
          setNextBatchCursor(batchData.nextCursor ?? null);
          setHasMoreBatch(batchData.hasMore ?? false);
          setNextPageInfo(batchData.nextCursor ?? null, batchData.hasMore ?? false);
          lastResults.current = batchData.results || [];
        } else {
          setFetchError(new Error(`Batch fetch failed: ${batchRes.status}`));
        }

        // Show table immediately — don't wait for count (keep spinner until count arrives)
        if (!cancelled) {
          hasLoadedOnce.current = true;
          completedKeyRef.current = resultsFilterKey;
          setIsLoadingFirst(false);
          setIsRefreshing(false);
          initialLoadGuardRef.current = false;
        }

        // 2. Fetch count in background — retry up to 7x at 5s intervals
        //    to pick up the Redis-cached result from the background count job
        if (!filters.cursor) {
          const retryCount = { current: 0 };
          const doFetchCount = () => {
            fetch(`${BASE_URL}/api/search/count`, { method: "POST", headers, body })
              .then(async (countRes) => {
                if (cancelled) return;
                let newCounts;
                if (countRes.ok) {
                  const countData = await countRes.json();
                  if (countData.total !== null) {
                    newCounts = { total: countData.total, saved: countData.saved, new: countData.new };
                  } else if (retryCount.current < 7) {
                    retryCount.current += 1;
                    setTimeout(doFetchCount, 5000);
                    return;
                  } else {
                    newCounts = { total: null, saved: null, new: null };
                  }
                } else {
                  newCounts = { total: null, saved: null, new: null };
                }
                if (!cancelled) {
                  setCounts(newCounts);
                  setTotalLoading(false);
                }
              })
              .catch(() => {
                if (!cancelled) {
                  if (retryCount.current < 7) {
                    retryCount.current += 1;
                    setTimeout(doFetchCount, 5000);
                  } else {
                    setCounts({ total: null, saved: null, new: null });
                    setTotalLoading(false);
                  }
                }
              });
          };
          doFetchCount();
        }
      } catch (err) {
        if (!cancelled) setFetchError(err);
        if (!cancelled) setTotalLoading(false);
      }
    };

    fetchInitialBatch();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsFilterKey]);

  // Auto-load more batches after first batch, up to 4 batches (100 rows)
  const loadMoreBatch = useRef(null);
  const loadBatchCountRef = useRef(0);
  const loadingMoreGuardRef = useRef(false);
  useEffect(() => {
    loadMoreBatch.current = async () => {
      if (isLoadingMore || !nextBatchCursor || loadingMoreGuardRef.current) return;
      const capturedFilterKey = resultsFilterKey;
      loadingMoreGuardRef.current = true;
      setIsLoadingMore(true);

      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      try {
        const res = await fetch(`${BASE_URL}/api/search/batch/next`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            filters: debouncedFilters,
            excludedFilters: debouncedExcluded,
            cursor: nextBatchCursor,
          }),
        });
        if (capturedFilterKey !== resultsFilterKey) return;
        if (res.ok) {
          const data = await res.json();
          setRows(prev => [...prev, ...(data.results || [])]);
          setNextBatchCursor(data.nextCursor ?? null);
          setHasMoreBatch(data.hasMore ?? false);
        } else {
          setHasMoreBatch(false);
          setNextBatchCursor(null);
        }
      } catch {
        if (capturedFilterKey !== resultsFilterKey) return;
        setHasMoreBatch(false);
        setNextBatchCursor(null);
      } finally {
        loadingMoreGuardRef.current = false;
        setIsLoadingMore(false);
      }
    };
  });

  // Auto-trigger loading more when first batch arrives
  useEffect(() => {
    if (isLoadingFirst || initialLoadGuardRef.current || !hasMoreBatch || !nextBatchCursor) return;
    const targetCount = Math.min(filters.limit || 25, 100);
    if (rows.length < targetCount && loadBatchCountRef.current < 4) {
      loadBatchCountRef.current += 1;
      loadMoreBatch.current();
    }
  }, [isLoadingFirst, isLoadingMore, resultsFilterKey, rows, filters.limit]);

  // Derive isDataLoading from batch loading state
  useEffect(() => {
    setIsDataLoading(isLoadingFirst || isLoadingMore || isRefreshing);
  }, [isLoadingFirst, isLoadingMore, isRefreshing, setIsDataLoading]);

  /* ===============================
     DATA OBJECT
     (preserves { results, counts } shape for children)
   =============================== */
  const data = useMemo(() => ({
    results: rows,
    counts: {
      onPage: rows.length,
      total: totalCounts.total ?? counts.total ?? rows.length,
      saved: totalCounts.saved ?? counts.saved ?? rows.length,
      new: totalCounts.new ?? counts.new ?? rows.length,
    },
  }), [rows, counts, totalCounts]);

  const recentSearchKeyRef = useRef(null);
  const currentShareIdRef = useRef(null);
  const shareStateTimerRef = useRef(null);
  const recentSearchTimerRef = useRef(null);

  const getFiltersKey = (filtersObj, excludedObj) => {
    const stableStringify = (obj) => {
      if (!obj || typeof obj !== "object") return JSON.stringify(obj);

      const sortedKeys = Object.keys(obj).sort();
      const entries = sortedKeys.map((key) => {
        const value = obj[key];
        if (Array.isArray(value)) {
          return [key, [...value].sort()];
        }
        if (value && typeof value === "object") {
          return [key, stableStringify(value)];
        }
        return [key, value];
      });

      return JSON.stringify(Object.fromEntries(entries));
    };

    return `${stableStringify(filtersObj)}|${stableStringify(excludedObj)}`;
  };

  const LOCAL_STORAGE_FILTERS_KEY = "prospectSearchFilters";
  const LOCAL_STORAGE_EXCLUDED_KEY = "prospectExcludedFilters";
  const LOCAL_STORAGE_COLUMNS_KEY = "prospectVisibleColumns";

  // Persist filters + columns in localStorage (and save recent search)
  useEffect(() => {
    if (!isInitialLoad.current) {
      try {
        localStorage.setItem(LOCAL_STORAGE_FILTERS_KEY, JSON.stringify(filters));
        localStorage.setItem(LOCAL_STORAGE_EXCLUDED_KEY, JSON.stringify(excludedFilters));
        localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(visibleColumns));
      } catch (error) {
        // console.warn("Failed to persist filters to localStorage", error);
      }

      // Count total search filters applied (excluding layout/relevance settings)
      const countSearchFilters = (filtersObject) => {
        return Object.entries(filtersObject).reduce((total, [key, filter]) => {
          // Exclude system fields and layout/relevance settings
          if (
            key === "currentPage" ||
            key === "cursor" ||
            key === "limit" ||
            key === "viewType" ||
            key === "sortOrder" ||
            key === "selectedRelevances" ||
            key === "appliedRelevances" ||
            key === "appliedSortOrder" ||
            key === "exactCount"
          )
            return total; // Exclude system fields

          if (Array.isArray(filter)) {
            return total + filter.length;
          }
          return total + (filter ? 1 : 0);
        }, 0);
      };

      const totalSearchFiltersApplied =
        countSearchFilters(filters) + countSearchFilters(excludedFilters);

      if (totalSearchFiltersApplied > 0) {
        const currentKey = getFiltersKey(filters, excludedFilters);

        // Prevent saving duplicates from rapid filter changes (e.g., when navigating from dashboard)
        if (currentKey !== recentSearchKeyRef.current) {
          recentSearchKeyRef.current = currentKey;
          if (recentSearchTimerRef.current) clearTimeout(recentSearchTimerRef.current);
          recentSearchTimerRef.current = setTimeout(() => {
            saveRecentSearch(filters, excludedFilters).catch((error) => {
              // console.error("Failed to save recent search:", error);
            });
          }, 1500);

          // Debounce URL share state save (only after user stops changing filters)
          if (shareStateTimerRef.current) clearTimeout(shareStateTimerRef.current);
          shareStateTimerRef.current = setTimeout(async () => {
            try {
              const result = await saveSearchShareState(filters, excludedFilters, visibleColumns);
              if (result.url) {
                currentShareIdRef.current = result.shareId;
                window.history.replaceState(null, '', result.url);
              }
            } catch (error) {
              // console.warn("Failed to update URL with short link:", error);
            }
          }, 2000);
        } else {
          // No filters applied, clear URL
          window.history.replaceState(null, '', '/search');
        }
      } else {
        // No filters applied, clear URL
        window.history.replaceState(null, '', '/search');
      }
    } else {
      isInitialLoad.current = false;
    }
  }, [filters, excludedFilters, visibleColumns]);

  /* ===============================
     SHARE LINK RESTORE
  =============================== */
  useEffect(() => {
    const shareId = searchParams.get("s");

    if (!shareId) return;

    axios
      .get(`${BASE_URL}/api/search/share-state/${shareId}`)
      .then((res) => {
        if (res.data.filters || res.data.excludedFilters) {
          setInitialFilters(
            res.data.filters || {},
            res.data.excludedFilters || {},
          );
        }
        // Restore layout (visibleColumns)
        if (res.data.visibleColumns) {
          setVisibleColumns(res.data.visibleColumns);
        }
      })
      .catch((error) => {
        // console.error("Failed to fetch shared state:", error);
      });
  }, [searchParams, setInitialFilters, setVisibleColumns]);

  /* ===============================
     RESTORE FILTERS ON PAGE RELOAD
  =============================== */
  useEffect(() => {
    const shareId = searchParams.get("s");
    if (shareId) return; // share link already handles state restore

    const savedFilters = localStorage.getItem("prospectSearchFilters");
    const savedExcluded = localStorage.getItem("prospectExcludedFilters");
    const savedColumns = localStorage.getItem("prospectVisibleColumns");

    if (!savedFilters && !savedExcluded && !savedColumns) return;

    try {
      const currentUser = useStore.getState().user;
      const limits = (currentUser?.limits && Object.values(currentUser.limits).some(Boolean))
        ? currentUser.limits
        : currentUser?.plan?.features?.limits || {};

      const featureGatedKeys = {
        revenueRange: "revenueFilter",
        revenueThousands: "revenueFilter",
        technologies: "technologyFilter",
      };

      const parsedFilters = savedFilters ? JSON.parse(savedFilters) : {};
      const parsedExcluded = savedExcluded ? JSON.parse(savedExcluded) : {};
      const parsedColumns = savedColumns ? JSON.parse(savedColumns) : null;

      Object.keys(featureGatedKeys).forEach((key) => {
        const feature = featureGatedKeys[key];
        if (!limits[feature]) {
          delete parsedFilters[key];
          delete parsedExcluded[key];
        }
      });

      if (Object.keys(parsedFilters).length || Object.keys(parsedExcluded).length) {
        setInitialFilters(parsedFilters, parsedExcluded);
      }
      if (parsedColumns) {
        // Ensure new columns are present in restored preferences
        if (!parsedColumns.includes("Zip/Postal")) {
          parsedColumns.push("Zip/Postal");
        }
        setVisibleColumns(parsedColumns);
      }
    } catch (error) {
      // console.warn("Failed to restore persisted filters:", error);
    }
  }, [searchParams, setInitialFilters, setVisibleColumns]);

  /* ===============================
     FORMAT CONTACTS
  =============================== */
  
  const formattedContacts = useMemo(
    () => (rows.length > 0 ? formatContacts(rows) : []),
    [rows]
  );

  // Apply sorting based on appliedRelevances
  const { appliedRelevances, appliedSortOrder } = useStore();
  const sortedContacts = useMemo(() => {
    return [...formattedContacts].sort((a, b) => {
    // Field name mapping from display names to data keys
    const fieldMap = {
      "Relevance": "relevance",
      "Company": "company",
      "Name": "name",
      "Country": "country",
      "Email": "email",
      "Phone": "phone",
      "Location": "location",
      "Zip/Postal": "postalCode",
      "Employees": "employees",
      "Industry": "industry",
      "Keywords": "keywords",
    };

    // Sort by each selected field in order
    for (let i = 0; i < appliedRelevances.length; i++) {
      const sortBy = appliedRelevances[i];
      const field = fieldMap[sortBy] || sortBy.toLowerCase();
      const valueA = a[field];
      const valueB = b[field];

      if (valueA === undefined || valueB === undefined) {
        continue;
      }

      let comparison = 0;

      // String comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        comparison = valueA.localeCompare(valueB);
      }
      // Number comparison
      else if (typeof valueA === "number" && typeof valueB === "number") {
        comparison = valueA - valueB;
      }
      // Mixed types - convert to string
      else {
        const aStr = String(valueA);
        const bStr = String(valueB);
        comparison = aStr.localeCompare(bStr);
      }

      // If values are different, apply sort order and return
      if (comparison !== 0) {
        return appliedSortOrder === "ascending" ? comparison : -comparison;
      }
    }

    return 0;
    });
  }, [formattedContacts, appliedRelevances, appliedSortOrder]);

  /* ===============================
     ACTION HANDLERS
  =============================== */

  const handleRevealContact = async (id) => {
    setLoadingItemId(id);

    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

    try {
      // 1. Save contact FIRST — before any credit deduction
      const saveRes = await axios.post(
        `${BASE_URL}/api/saved/add`,
        { savedItems: [id], listNames: [] },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (saveRes.data?.skipped > 0) {
        // console.warn("[REVEAL] Contact not found in DB, save skipped:", id);
      }

      // 2. Deduct credits AFTER save succeeds — each type independent
      const leadItem = rows?.find(r => r._id === id);
      const leadSrc = leadItem?._source || leadItem || {};
      const hasEmail = !!(leadSrc.person_email || leadSrc.email);
      const hasPhone = !!(leadSrc.person_phone || leadSrc.phone || leadSrc.mobilePhone || leadSrc.mobile_phone);

      let emailRevealed = false;
      let phoneRevealed = false;

      if (hasEmail) {
        try {
          await deductCredit({ type: "email", quantity: 1 });
          emailRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (hasPhone) {
        try {
          await deductCredit({ type: "phone", quantity: 1 });
          phoneRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (!hasPhone) phoneRevealed = true;

      if (emailRevealed) setVisibleEmails((prev) => ({ ...prev, [id]: true }));
      if (phoneRevealed) setVisiblePhoneNumber((prev) => ({ ...prev, [id]: true }));

      // 3. Re-fetch only the count from server (no full page reload)
      try {
        const countRes = await fetch(`${BASE_URL}/api/search/count`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ filters: debouncedFilters, excludedFilters: debouncedExcluded }),
        });
        if (countRes.ok) {
          const countData = await countRes.json();
          if (countData.total !== null) {
            setCounts({ total: countData.total, saved: countData.saved, new: countData.new });
          }
        }
      } catch (countErr) {
        // Non-critical — count will update on next filter change
      }
      queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
    } catch (error) {
      if (error?.response?.data?.error !== "INSUFFICIENT_FUNDS") {
        const errMsg = error?.response?.data?.message || error?.response?.data?.error || "Failed to reveal contact";
        toast.error(errMsg);
      }
    } finally {
      setLoadingItemId(null);
    }
  };

  /* ===============================
     UI
   =============================== */

  return (
    <div className="flex-1 min-w-0 mx-3 md:mx-4 mt-3 overflow-y-hidden right-company-section flex flex-col h-full">
      <LeadRightTopbar data={data} counts={counts} totalLoading={totalLoading} isLoading={isLoadingFirst} />
      <LeadSelectBar data={data} counts={counts} totalLoading={totalLoading} />

      <div className="lead-table-div flex-1 overflow-x-auto overflow-y-auto border border-gray-300 rounded-lg relative bg-white shadow-sm min-h-0 no-y-scrollbar">
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 z-10">
            <div className="h-full bg-blue-500 w-1/3 animate-pulse" />
          </div>
        )}
        {isLoadingFirst || (rows.length === 0 && filters.viewType !== debouncedFilters?.viewType) ? (
          <LeadTableSkeleton />
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-2 text-sm">Search failed — the query timed out.</p>
            <p className="mb-4 text-xs text-gray-400">Try a more specific filter or try again.</p>
            <button
              onClick={() => {
                setFetchError(null);
                setRefreshKey(k => k + 1);
              }}
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 && !isRefreshing && completedKeyRef.current === resultsFilterKey ? (
          <EmptyPage
            title={filters.viewType === "saved" ? "No saved contacts" : "No results found"}
            description={
              filters.viewType === "saved"
                ? "Contacts you save will appear here."
                : "Try adjusting your filters or search terms."
            }
          />
        ) : (
          <>
            <LeadTable
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
              data={sortedContacts}
              error={fetchError}
              isLoading={isLoadingFirst || isRefreshing}
              isEmailVisible={visibleEmails}
              onEmailClick={handleRevealContact}
              isPhoneVisible={visiblePhoneNumber}
              onPhoneClick={handleRevealContact}
              viewType={filters.viewType}
              loadingItemId={loadingItemId || isCreditDeducting}
              setDataItem={setDataItem}
              showEmailStatus={filters.emailStatus?.length > 0}
            />
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4 text-sm text-gray-500 border-t border-gray-200">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading more results...
              </div>
            )}
          </>
        )}
      </div>

      <Pagination data={data?.counts} counts={counts} totalLoading={!!(isLoadingFirst || totalLoading)} />
    </div>
  );
};

export default LeadRightSec;
