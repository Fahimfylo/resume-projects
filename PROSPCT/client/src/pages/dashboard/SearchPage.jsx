import MainLayout from "../../components/layout/MainLayout";
import LeadSearch from "../../components/search/LeadSearch";
import SearchHeader from "../../components/search/SearchHeader";
import { useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useStore from "../../store/store";
import { getSharedSearchState } from "../../api/mutation";
import { decodeStateFromUrl } from "../../utils/shareableUrl";

export default function SearchPage() {
  const { setInitialFilters, setFilters, resetFilters, filters } = useStore((state) => ({
    setInitialFilters: state.setInitialFilters,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
    filters: state.filters,
  }));
  const [searchParams, setSearchParams] = useSearchParams();
  const { filterName } = useParams();
  const navigate = useNavigate();

  // Sync URL with filter state when filters change
  useEffect(() => {
    // Determine which filter has active selections
    const filterKeys = Object.keys(filters).filter(
      (key) =>
        key !== 'currentPage' &&
        key !== 'limit' &&
        key !== 'viewType' &&
        key !== 'sortOrder' &&
        Array.isArray(filters[key]) &&
        filters[key].length > 0
    );

    if (filterKeys.length > 0) {
      // Concatenate all active filters with dashes
      const activeFilters = filterKeys.join('-');
      if (filterName !== activeFilters) {
        navigate(`/search/${activeFilters}`, { replace: true });
      }
    } else if (filterName) {
      // No filters selected, go back to /search
      navigate('/search', { replace: true });
    }
  }, [filters, filterName, navigate]);

  useEffect(() => {
    // Check for encoded state in URL (Direct Main URL sharing)
    const stateParam = searchParams.get("state");
    if (stateParam) {
      try {
        const decodedState = decodeStateFromUrl(stateParam);
        if (decodedState && decodedState.filters) {
          setInitialFilters(decodedState.filters, decodedState.excludedFilters || {});
          
          // Remove the state param from URL after applying
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("state");
          setSearchParams(newParams);
          return;
        }
      } catch (error) {
        // console.error("Failed to decode state from URL:", error);
        toast.error("Could not load the shared search state.");
      }
    }

    // Check for short link (database-backed sharing)
    const shareId = searchParams.get("s");
    if (shareId) {
      (async () => {
        try {
          const { filters, excludedFilters } = await getSharedSearchState(shareId);
          setInitialFilters(filters, excludedFilters);

          // Apply any explicit pagination params (page/limit) from the shared URL
          const pageParam = searchParams.get("page");
          const limitParam = searchParams.get("limit");
          if (pageParam) {
            setFilters("currentPage", Number(pageParam));
          }
          if (limitParam) {
            setFilters("limit", Number(limitParam));
          }

          // Remove only the share param from URL (keep any page/limit query params)
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("s");
          setSearchParams(newParams);
        } catch (error) {
          // console.error("Failed to apply shared search state:", error);
          toast.error("Could not load shared search settings.");
        }
      })();

      return;
    }

    const listName = searchParams.get("list");
    if (listName) {
      // Reset any existing filters and apply list filter
      if (resetFilters) resetFilters();
      setFilters("list", listName);

      // Remove the list param from the URL after applying
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("list");
      setSearchParams(newParams);
    }
  }, [
    searchParams,
    setFilters,
    setInitialFilters,
    resetFilters,
    setSearchParams,
  ]);

  return (
    <MainLayout className="bg-gray-50">
      <div className="z-20 w-full h-[calc(100vh-48px)] bg-gray-50 flex flex-col">
        <SearchHeader />

        <LeadSearch filterName={filterName} />
      </div>
    </MainLayout>
  );
}
