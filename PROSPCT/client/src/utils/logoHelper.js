/**
 * Logo Helper Utility
 * Provides domain normalization and multi-source logo URL generation for company logos
 * Uses Clearbit (primary) and Google favicon (fallback) for ~90% coverage
 */

// Simple in-memory cache for favicon URLs (LRU-style with max 1000 entries)
const faviconCache = new Map();
const MAX_CACHE_SIZE = 1000;

// In-memory cache for failed domains to prevent infinite loops
const failedDomainsCache = new Set();
const MAX_FAILED_CACHE_SIZE = 5000;

/**
 * Normalizes and cleans a domain string
 * @param {string} domain - The domain to normalize (can be a full URL or just domain)
 * @returns {string|null} - Normalized domain in lowercase, or null if invalid
 */
export const normalizeDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return null;
  }

  // Remove whitespace
  let normalized = domain.trim();

  // If empty after trim, return null
  if (!normalized) {
    return null;
  }

  // Filter out dummy values
  if (['#', '', 'null', 'undefined'].includes(normalized.toLowerCase())) {
    return null;
  }

  // Remove protocol (http://, https://)
  normalized = normalized.replace(/^https?:\/\//i, '');

  // Remove www. prefix
  normalized = normalized.replace(/^www\./i, '');

  // Remove paths, query params, and hash
  normalized = normalized.split('/')[0].split('?')[0].split('#')[0];

  // Remove port number if present
  normalized = normalized.split(':')[0];

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Simple validation: must contain at least one dot
  if (!normalized.includes('.') || normalized.length < 4) {
    return null;
  }

  return normalized;
};

/**
 * Generates an array of logo source URLs for a given domain
 * Uses Clearbit (primary) and Google favicon (fallback) for better coverage
 * @param {string} domain - The domain (can be a full URL or just domain)
 * @param {number} size - Optional favicon size in pixels (default: 128)
 * @returns {string[]} - Array of logo source URLs (empty if domain is invalid)
 */
export const getLogoSources = (domain, size = 128) => {
  const normalized = normalizeDomain(domain);
  
  if (!normalized) {
    return [];
  }

  // Return array of sources in priority order
  return [
    `https://logo.clearbit.com/${normalized}`, // Primary: Clearbit
    `https://www.google.com/s2/favicons?domain=${normalized}&sz=${size}`, // Fallback: Google
  ];
};

/**
 * Generates a Google favicon URL for a given domain with memoization (legacy function)
 * @param {string} domain - The domain (can be a full URL or just domain)
 * @param {number} size - Optional favicon size in pixels (default: 128)
 * @returns {string|null} - Google favicon URL or null if domain is invalid
 * @deprecated Use getLogoSources instead for multi-source fallback
 */
export const getFaviconUrl = (domain, size = 128) => {
  const normalized = normalizeDomain(domain);
  
  if (!normalized) {
    return null;
  }

  // Create cache key
  const cacheKey = `${normalized}:${size}`;
  
  // Check cache
  if (faviconCache.has(cacheKey)) {
    return faviconCache.get(cacheKey);
  }

  // Generate URL
  const url = `https://www.google.com/s2/favicons?domain=${normalized}&sz=${size}`;
  
  // Add to cache (simple LRU: delete oldest if at capacity)
  if (faviconCache.size >= MAX_CACHE_SIZE) {
    const firstKey = faviconCache.keys().next().value;
    faviconCache.delete(firstKey);
  }
  faviconCache.set(cacheKey, url);
  
  return url;
};

/**
 * Marks a domain as failed to prevent infinite retry loops
 * @param {string} domain - The domain to mark as failed
 */
export const markDomainAsFailed = (domain) => {
  const normalized = normalizeDomain(domain);
  if (normalized) {
    // Simple LRU: if at capacity, remove oldest entries
    if (failedDomainsCache.size >= MAX_FAILED_CACHE_SIZE) {
      const firstEntry = failedDomainsCache.values().next().value;
      failedDomainsCache.delete(firstEntry);
    }
    failedDomainsCache.add(normalized);
  }
};

/**
 * Checks if a domain has been marked as failed
 * @param {string} domain - The domain to check
 * @returns {boolean} - True if domain is in failed cache
 */
export const isDomainFailed = (domain) => {
  const normalized = normalizeDomain(domain);
  return normalized ? failedDomainsCache.has(normalized) : true;
};

/**
 * Sanitizes a domain string for human-readable display.
 * Handles URL-encoded chars, invisible chars, leading/trailing dashes/dots,
 * and strips invalid characters so the result looks like a valid domain.
 * Returns null if the result isn't a plausible domain.
 * @param {string} domain - Raw domain string
 * @returns {string|null} - Cleaned domain or null if not salvageable
 */
export const sanitizeDomainForDisplay = (domain) => {
  if (!domain || typeof domain !== 'string') return null;
  let s = domain.trim();
  if (!s) return null;

  // URL-decode (handles %c2%ad → soft hyphen, etc.)
  try { s = decodeURIComponent(s); } catch { /* leave as-is */ }

  // Strip zero-width / invisible / control characters
  s = s.replace(/[\u200B-\u200D\u00AD\uFEFF\u200E\u200F]/g, '');
  s = s.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove protocol, www, paths, query, hash, port
  s = s.replace(/^https?:\/\//i, '');
  s = s.replace(/^www\./i, '');
  s = s.split('/')[0].split('?')[0].split('#')[0];
  s = s.split(':')[0];

  // Remove leading/trailing dots and dashes
  s = s.replace(/^[.-]+/, '').replace(/[.-]+$/, '');

  // Strip any remaining invalid characters (only allow a-z, 0-9, dot, dash)
  s = s.replace(/[^a-zA-Z0-9.-]/g, '');

  // Collapse repeated dots and dashes
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/-{2,}/g, '-');

  // Strip leading/trailing dots and dashes again after collapse
  s = s.replace(/^[.-]+/, '').replace(/[.-]+$/, '');

  // Must have at least one dot, no empty segments, minimum length
  if (!s.includes('.') || s.length < 4) return null;
  if (s.split('.').some(p => p.length === 0)) return null;

  return s.toLowerCase();
};

/**
 * Clears the favicon cache (useful for testing or memory management)
 */
export const clearFaviconCache = () => {
  faviconCache.clear();
};

/**
 * Clears the failed domains cache
 */
export const clearFailedDomainsCache = () => {
  failedDomainsCache.clear();
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getLogoSources instead
 */
export const getCompanyLogo = (websiteUrl) => {
  return getFaviconUrl(websiteUrl);
};
