import { create } from "zustand";
import Cookies from "js-cookie";
import API_CONFIG from "../utils/apiConstant";

// Define initial filter state separately for reusability and clarity
const initialFilters = {
  currentPage: 1,
  cursor: null,
  limit: 25,
  viewType: "total",
  location: "",
  countries: [],
  city: [],
  zip: [],
  jobTitle: [],
  seniority: [],
  industry: [],
  gender: [],
  emailStatus: [],
  employeeRange: [],
  personName: [],
  keywords: [],
  revenueRange: [],
  stage: [],
  emailType: [],
  list: [],
  organizationName: [],
  sortOrder: "descending",
};

const initialExcludedFilters = {
  location: "",
  countries: [],
  city: [],
  zip: [],
  jobTitle: [],
  seniority: [],
  industry: [],
  gender: [],
  emailStatus: [],
  employeeRange: [],
  personName: [],
  keywords: [],
  revenueRange: [],
  stage: [],
  emailType: [],
  list: [],
  organizationName: [],
};

const defaultVisibleColumns = [
  "Name",
  "Job Title",
  "Company",
  "Email",
  "Phone",
  "Location",
  "Zip/Postal",
  "Employees",
  "Industry",
  "Keywords",
];

const defaultVisibleCompanyColumns = [
  "Name",
  "Domain",
  "Links",
  "Industry",
  "Keywords",
  "Employees",
  "Zip",
  "Headquarters",
];

const defaultSelectedRelevances = ["Relevance"];

const defaultAppliedRelevances = ["Relevance"];

const useStore = create((set) => ({
  // auth state
  isLoggedIn: false,
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),

  user: null,
  setUser: (userData) => set({ user: userData }),

  updateCredits: (credits) => set((state) => ({
    user: state.user ? { ...state.user, credits } : null
  })),

  refreshUser: async () => {
    try {
      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      if (!token) return;
      const response = await fetch(`${API_CONFIG.API_ENDPOINT}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData });
      }
    } catch (error) {
      // console.error("Failed to refresh user:", error);
    }
  },

  creditHistoryRefreshKey: 0,
  incrementCreditHistoryRefreshKey: () => set((state) => ({ creditHistoryRefreshKey: state.creditHistoryRefreshKey + 1 })),

  isAdminLoggedIn: false,
  setAdminIsLoggedIn: (status) => set({ isAdminLoggedIn: status }),

  admin: null,
  setAdmin: (adminData) => set({ admin: adminData }),

  //Search Page state

  isSaveLeadsVisible: false,
  setSaveLeadsVisible: (value) =>
    set({
      isSaveLeadsVisible: value,
    }),

  isExportLeadsVisible: false,
  setExportLeadsVisible: (value) =>
    set({
      isExportLeadsVisible: value,
    }),

  //Companies Page state
  isSaveCompaniesVisible: false,
  setSaveCompaniesVisible: (value) =>
    set({
      isSaveCompaniesVisible: value,
    }),

  isExportCompaniesVisible: false,
  setExportCompaniesVisible: (value) =>
    set({
      isExportCompaniesVisible: value,
    }),

  isLeadProfileVisible: false,
  setLeadProfileVisible: (value) =>
    set({
      isLeadProfileVisible: value,
    }),

  isDataLoading: false,
  setIsDataLoading: (value) =>
    set({
      isDataLoading: value,
    }),

  totalFiltersApplied: 0,
  setTotalFiltersApplied: (value) =>
    set({
      totalFiltersApplied: value,
    }),
  // helper to signal recent search list changed
  lastRecentUpdate: null,
  setLastRecentUpdate: (val) => set({ lastRecentUpdate: val }),

  // helper to signal saved search list changed
  lastSavedUpdate: null,
  setLastSavedUpdate: (val) => set({ lastSavedUpdate: val }),

  // helper to signal list data changed (created/deleted)
  lastListUpdate: null,
  setLastListUpdate: (val) => set({ lastListUpdate: val }),

  // Incremented to force search results re-fetch (used when delete all doesn't change filters)
  dataRefreshKey: 0,
  incrementDataRefreshKey: () => set((state) => ({ dataRefreshKey: state.dataRefreshKey + 1 })),

  // selected employee count for display in table
  selectedEmployeeCount: null,
  setSelectedEmployeeCount: (val) => set({ selectedEmployeeCount: val }),

  // filter state

  filters: initialFilters,

  excludedFilters: initialExcludedFilters,

  // Cursor-based pagination state
  cursorHistory: [],
  nextCursor: null,
  hasMore: false,
  resetCursorState: () => set((state) => ({
    cursorHistory: [],
    nextCursor: null,
    hasMore: false,
    filters: { ...state.filters, cursor: null },
  })),

  setNextPageInfo: (nextCursor, hasMore) => set({ nextCursor, hasMore }),

  navigateNextPage: () => set((state) => ({
    cursorHistory: [...state.cursorHistory, state.nextCursor],
    filters: { ...state.filters, cursor: state.nextCursor },
  })),

  navigatePrevPage: () => set((state) => {
    const newHistory = state.cursorHistory.slice(0, -1);
    return {
      cursorHistory: newHistory,
      filters: { ...state.filters, cursor: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null },
    };
  }),

  goToPage: (page) => set((state) => {
    if (page <= 1) {
      return {
        cursorHistory: [],
        filters: { ...state.filters, cursor: null },
      };
    }
    const targetHistoryLength = page - 1;
    if (targetHistoryLength <= state.cursorHistory.length) {
      const newHistory = state.cursorHistory.slice(0, targetHistoryLength);
      const cursorForPage = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
      return {
        cursorHistory: newHistory,
        filters: { ...state.filters, cursor: cursorForPage },
      };
    }
    return state;
  }),

  setFilters: (key, item) =>
    set((state) => {
      // Founded Year logic stays the same
      if (key === "foundedYear") {
        const { minYear, maxYear } = item;
        return {
          filters: {
            ...state.filters,
            foundedYear: {
              minYear: item.minYear !== undefined ? item.minYear : minYear,
              maxYear: item.maxYear !== undefined ? item.maxYear : maxYear,
            },
            currentPage: 1,
            cursor: null,
          },
          cursorHistory: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      // Array-based filters
      if (Array.isArray(state.filters[key])) {
        const currentArray = state.filters[key];
        const itemExists = currentArray.includes(item);
        return {
          filters: {
            ...state.filters,
            [key]: itemExists
              ? currentArray.filter((i) => i !== item)
              : [...currentArray, item],
            currentPage: 1,
            cursor: null,
          },
          cursorHistory: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      // NEW: Location or any string-based filter
      if (key === "location") {
        return {
          filters: {
            ...state.filters,
            location: item, // directly set the string input
            currentPage: 1,
            cursor: null,
          },
          cursorHistory: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      // Other non-array filters
      return {
        filters: {
          ...state.filters,
          [key]: item,
        },
      };
    }),

  setExcludeFilters: (key, item) =>
    set((state) => {
      if (Array.isArray(state.excludedFilters[key])) {
        const currentArray = state.excludedFilters[key];
        const itemExists = currentArray.includes(item);
        return {
          excludedFilters: {
            ...state.excludedFilters,
            [key]: itemExists
              ? currentArray.filter((i) => i !== item)
              : [...currentArray, item],
            currentPage: 1,
          },
          filters: { ...state.filters, currentPage: 1, cursor: null },
          cursorHistory: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      // NEW: string filters like Location
      if (key === "location") {
        return {
          excludedFilters: {
            ...state.excludedFilters,
            location: item,
            currentPage: 1,
          },
          filters: { ...state.filters, currentPage: 1, cursor: null },
          cursorHistory: [],
          nextCursor: null,
          hasMore: false,
        };
      }

      return {
        excludedFilters: {
          ...state.excludedFilters,
          [key]: item,
        },
      };
    }),

  // Clear a specific filter by key
  clearSpecificFilter: (key) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: Array.isArray(state.filters[key]) ? [] : "",
        currentPage: 1,
        cursor: null,
      },
      cursorHistory: [],
      nextCursor: null,
      hasMore: false,
    })),

  clearSpecificExcludeFilter: (key) =>
    set((state) => ({
      excludedFilters: {
        ...state.excludedFilters,
        [key]: Array.isArray(state.excludedFilters[key]) ? [] : "",
        currentPage: 1,
      },
      filters: { ...state.filters, currentPage: 1, cursor: null },
      cursorHistory: [],
      nextCursor: null,
      hasMore: false,
    })),

  // Reset all filters function
  resetFilters: () =>
    set({
      filters: initialFilters,
      excludedFilters: initialExcludedFilters,
      cursorHistory: [],
      nextCursor: null,
      hasMore: false,
    }),

  setInitialFilters: (sharedFilters, sharedExcludedFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...sharedFilters, cursor: null, currentPage: 1 },
      excludedFilters: { ...state.excludedFilters, ...sharedExcludedFilters },
      cursorHistory: [],
      nextCursor: null,
      hasMore: false,
    })),

  // LeadRightSec state

  checkedItems: [],
  toggleCheckedItems: (item) =>
    set((state) => {
      const isChecked = state.checkedItems.some(
        (checkedItem) => checkedItem._id === item._id,
      );
      const newItems = isChecked
        ? state.checkedItems.filter(
            (checkedItem) => checkedItem._id !== item._id,
          ) // Uncheck
        : [...state.checkedItems, item]; // Check

      return { checkedItems: newItems };
    }),

  toggleAllCheckedItems: (allItems) => set({ checkedItems: allItems }),

  clearCheckedItems: () =>
    set({
      checkedItems: [],
      selectAllMode: false,
      selectAllFilters: {},
    }),

  selectAllMode: false,
  selectAllFilters: {},
  setSelectAllMode: (mode, filters = {}) =>
    set({ selectAllMode: mode, selectAllFilters: filters }),

  // Total counts from search/count API (total, saved, new)
  totalCounts: { total: null, saved: null, new: null },
  setTotalCounts: (counts) => set({ totalCounts: counts }),

  // Simple client-side counter for Companies page and Lead Profile
  savedCount: 0,
  setSavedCount: (value) => set({ savedCount: value }),
  incrementSavedCount: (delta = 1) => set((state) => {
    const newSaved = state.companyCounts.total > 0
      ? Math.min(state.companyCounts.total, state.companyCounts.saved + delta)
      : state.companyCounts.saved + delta;
    return {
      savedCount: state.savedCount + delta,
      companyCounts: {
        ...state.companyCounts,
        saved: newSaved,
        new: Math.max(0, state.companyCounts.total - newSaved),
      },
    };
  }),
  decrementSavedCount: (delta = 1) => set((state) => {
    const newSaved = Math.max(0, state.companyCounts.saved - delta);
    return {
      savedCount: Math.max(0, state.savedCount - delta),
      companyCounts: {
        ...state.companyCounts,
        saved: newSaved,
        new: Math.max(0, state.companyCounts.total - newSaved),
      },
    };
  }),
  resetSavedCount: () => set({ savedCount: 0 }),

  // Total saved contacts count (for delete all)
  totalSavedContacts: 0,
  setTotalSavedContacts: (count) => set({ totalSavedContacts: count }),

  // Credit tracking state - tracks which leads have had credits deducted
  // Structure: { [leadId]: { email: boolean, phone: boolean, timestamp: number } }
  revealedCredits: JSON.parse(localStorage.getItem("revealedCredits") || "{}"),

  markCreditRevealed: (leadId, type) =>
    set((state) => {
      const current = state.revealedCredits[leadId] || { email: false, phone: false };
      const updated = {
        ...state.revealedCredits,
        [leadId]: {
          ...current,
          [type]: true,
          timestamp: Date.now(),
        },
      };
      localStorage.setItem("revealedCredits", JSON.stringify(updated));
      return { revealedCredits: updated };
    }),

  isCreditRevealed: (leadId, type) => {
    const state = useStore.getState();
    return state.revealedCredits[leadId]?.[type] || false;
  },

  getRevealedCounts: (leadIds) => {
    const state = useStore.getState();
    let emailCount = 0;
    let phoneCount = 0;
    leadIds.forEach((id) => {
      if (state.revealedCredits[id]?.email) emailCount++;
      if (state.revealedCredits[id]?.phone) phoneCount++;
    });
    return { emailCount, phoneCount };
  },

  clearRevealedCredits: () => {
    localStorage.removeItem("revealedCredits");
    return set({ revealedCredits: {} });
  },
  filteredContactCount: 0,
  setFilteredContactCount: (count) => set({ filteredContactCount: count }),

  // contact states
  isContactEditColumnsVisible: false,
  setContactEditColumnsVisible: (value) =>
    set({
      isContactEditColumnsVisible: value,
    }),

  // company states
  isCompanyEditColumnsVisible: false,
  setCompanyEditColumnsVisible: (value) =>
    set({
      isCompanyEditColumnsVisible: value,
    }),

  isExportVisible: false,
  setExportVisible: (value) =>
    set({
      isExportVisible: value,
    }),

  // Data availability states
  hasContactData: false,
  setHasContactData: (value) => set({ hasContactData: value }),

  hasCompanyData: false,
  setHasCompanyData: (value) => set({ hasCompanyData: value }),

  // Contact page UI state
  contactFilter: "all",
  setContactFilter: (value) =>
    set({ contactFilter: value }),
  contactSearchQuery: "",
  setContactSearchQuery: (value) =>
    set({ contactSearchQuery: value }),
  contactListId: null,
  setContactListId: (value) => set({ contactListId: value }),

  // Company page UI state
  companyFilter: "total",
  setCompanyFilter: (value) => set({ companyFilter: value }),
  companySearchQuery: "",
  setCompanySearchQuery: (value) => set({ companySearchQuery: value }),
  companyListId: null,
  setCompanyListId: (value) => set({ companyListId: value }),
  companyActiveFilters: {},
  setCompanyActiveFilters: (filters) => set({ companyActiveFilters: filters }),
  addCompanyActiveFilter: (field, value) =>
    set((state) => {
      const currentArray = state.companyActiveFilters[field] || [];
      const itemExists = currentArray.includes(value);
      let newArray;
      if (itemExists) {
        newArray = currentArray.filter((i) => i !== value);
      } else {
        newArray = [...currentArray, value];
      }
      if (newArray.length === 0) {
        const next = { ...state.companyActiveFilters };
        delete next[field];
        return { companyActiveFilters: next };
      }
      return {
        companyActiveFilters: {
          ...state.companyActiveFilters,
          [field]: newArray,
        },
      };
    }),
  removeCompanyActiveFilter: (field) =>
    set((state) => {
      const next = { ...state.companyActiveFilters };
      delete next[field];
      return { companyActiveFilters: next };
    }),
  clearCompanyActiveFilters: () => set({ companyActiveFilters: {} }),
  companyCounts: { total: 0, saved: 0, new: 0 },
  setCompanyCounts: (counts) => set({ companyCounts: counts }),

  // Plans and Pricing States
  selectedPlan: null,
  setSelectedPlan: (value) => set({ selectedPlans: value }),

  // layout-table
  // Column Visibility State
  visibleColumns: defaultVisibleColumns,

  toggleColumn: (column) =>
    set((state) => {
      const current = state.visibleColumns || [];
      const isVisible = current.includes(column);

      // Toggle: remove if present, add if not present
      if (isVisible) {
        return { visibleColumns: current.filter((c) => c !== column) };
      }

      return { visibleColumns: [...current, column] };
    }),

  resetColumns: () =>
    set({
      visibleColumns: defaultVisibleColumns,
    }),

  setVisibleColumns: (columns) =>
    set({
      visibleColumns: columns,
    }),

  // Company Column Visibility State
  visibleCompanyColumns: defaultVisibleCompanyColumns,

  toggleCompanyColumn: (column) =>
    set((state) => {
      const current = state.visibleCompanyColumns || [];
      const isVisible = current.includes(column);

      // Toggle: remove if present, add if not present
      if (isVisible) {
        return { visibleCompanyColumns: current.filter((c) => c !== column) };
      }

      return { visibleCompanyColumns: [...current, column] };
    }),

  resetCompanyColumns: () =>
    set({
      visibleCompanyColumns: defaultVisibleCompanyColumns,
    }),

  setVisibleCompanyColumns: (columns) =>
    set({
      visibleCompanyColumns: columns,
    }),

  // Relevance Selection State
  selectedRelevances: defaultSelectedRelevances,

  toggleRelevance: (relevance) =>
    set((state) => {
      const current = state.selectedRelevances || [];
      const isSelected = current.includes(relevance);

      // Toggle: remove if present, add if not present
      if (isSelected) {
        return { selectedRelevances: current.filter((r) => r !== relevance) };
      }

      return { selectedRelevances: [...current, relevance] };
    }),
  // Notifications
  notifications: JSON.parse(localStorage.getItem("notifications") || "[]"),
  unreadCount: parseInt(localStorage.getItem("unreadCount") || "0", 10),
  notificationPrefs: {
    inApp: { bell: true, popup: true, sound: true, tabDot: true },
    email: { 
      saveLeads: false, 
      exportLeads: false, 
      deleteLeads: false, 
      list: false, 
      folder: false, 
      savedSearch: false, 
      export: false, 
      database: false, 
      credit: false 
    },
  },
  setNotificationPrefs: (prefs) =>
    set((state) => ({
      notificationPrefs: {
        inApp: { ...state.notificationPrefs.inApp, ...(prefs.inApp || {}) },
        email: { ...state.notificationPrefs.email, ...(prefs.email || {}) },
      },
    })),
  incrementUnread: () =>
    set((state) => {
      const newCount = state.unreadCount + 1;
      localStorage.setItem("unreadCount", newCount.toString());
      return { unreadCount: newCount };
    }),
  resetUnread: () => {
    localStorage.setItem("unreadCount", "0");
    return set({ unreadCount: 0 });
  },
  addNotification: (notification) =>
    set((state) => {
      const newNotifications = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          timestamp: new Date().toISOString(),
          type: "info",
          ...notification,
        },
        ...state.notifications,
      ];
      localStorage.setItem("notifications", JSON.stringify(newNotifications));
      return { notifications: newNotifications };
    }),
  removeNotification: (id) =>
    set((state) => {
      const newNotifications = state.notifications.filter((n) => n.id !== id);
      localStorage.setItem("notifications", JSON.stringify(newNotifications));
      return { notifications: newNotifications };
    }),
  clearNotifications: () => {
    localStorage.setItem("notifications", "[]");
    return set({ notifications: [] });
  },
  resetRelevances: () =>
    set({
      selectedRelevances: defaultSelectedRelevances,
      appliedRelevances: defaultAppliedRelevances,
      appliedSortOrder: "descending",
    }),

  setSelectedRelevances: (relevances) =>
    set({
      selectedRelevances: relevances,
    }),

  // Applied Relevance Selection State (for actual sorting)
  appliedRelevances: defaultAppliedRelevances,
  appliedSortOrder: "descending",

   applyRelevanceSelections: () =>
    set((state) => ({
      appliedRelevances: [...state.selectedRelevances],
      appliedSortOrder: state.filters.sortOrder || "descending",
    })),

  // Payment settings (for redirect mode control)
  paymentRedirectMode: "same-tab",
  paymentMethods: [],
  
  setPaymentRedirectMode: (mode) => set({ paymentRedirectMode: mode }),
  setPaymentMethods: (methods) => set({ paymentMethods: methods }),
  
  fetchPaymentSettings: async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_ENDPOINT}/api/admin/settings/layout-order`);
      if (response.ok) {
        const data = await response.json();
        set({
          paymentRedirectMode: data.paymentRedirectMode || "same-tab",
          paymentMethods: data.paymentMethods || [],
        });
      }
    } catch (error) {
      // console.error("Failed to fetch payment settings:", error);
    }
  },
}));

export default useStore;
