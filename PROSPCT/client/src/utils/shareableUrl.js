/**
 * Utility functions for creating shareable URLs with encoded filter state
 * Two approaches: compressed URL params (for main URL) or database-backed short links
 */

import LZ from "lz-string";

/**
 * Encode filters/state into a compressed URL parameter
 * Creates a URL like: https://app.com/search?state=KDAwMDEw...
 */
export const encodeStateToUrl = (filters, excludedFilters, visibleColumns) => {
  try {
    const state = {
      filters,
      excludedFilters,
      visibleColumns,
    };

    // Compress the JSON state to make URL shorter
    const jsonStr = JSON.stringify(state);
    const compressed = LZ.compressToEncodedURIComponent(jsonStr);

    const baseUrl = window.location.origin;
    const searchPath = window.location.pathname.includes("/search")
      ? "/search"
      : "/search";

    return `${baseUrl}${searchPath}?state=${compressed}`;
  } catch (error) {
    // console.error("Error encoding state to URL:", error);
    return null;
  }
};

/**
 * Decode state from URL parameter
 * Extracts filters/state from URL parameter created by encodeStateToUrl
 */
export const decodeStateFromUrl = (stateParam) => {
  try {
    if (!stateParam) return null;

    const decompressed = LZ.decompressFromEncodedURIComponent(stateParam);
    if (!decompressed) return null;

    const state = JSON.parse(decompressed);
    return state;
  } catch (error) {
    // console.error("Error decoding state from URL:", error);
    return null;
  }
};

/**
 * Get state from current URL if it exists
 */
export const getStateFromCurrentUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const stateParam = params.get("state");
  
  if (stateParam) {
    return decodeStateFromUrl(stateParam);
  }
  
  return null;
};

/**
 * Get share ID from current URL (for short links)
 */
export const getShareIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("s");
};

/**
 * Check if current URL has encoded state or share link
 */
export const hasUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has("state") || params.has("s");
};
