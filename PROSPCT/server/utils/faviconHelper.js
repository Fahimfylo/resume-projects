/**
 * Logo Helper Utility
 * Provides domain normalization and multi-source logo URL generation for company logos
 * Uses Clearbit (primary) and Google favicon (fallback) for ~90% coverage
 */

/**
 * Normalizes and cleans a domain string
 * @param {string} domain - The domain to normalize (can be a full URL or just domain)
 * @returns {string|null} - Normalized domain in lowercase, or null if invalid
 */
const normalizeDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return null;
  }

  // Remove whitespace
  let normalized = domain.trim();

  // If empty after trim, return null
  if (!normalized) {
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

  // Basic validation: must contain at least one dot and valid characters
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  
  if (!domainRegex.test(normalized)) {
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
const getLogoSources = (domain, size = 128) => {
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
 * Generates a Google favicon URL for a given domain (legacy function)
 * @param {string} domain - The domain (can be a full URL or just domain)
 * @param {number} size - Optional favicon size in pixels (default: 128)
 * @returns {string|null} - Google favicon URL or null if domain is invalid
 * @deprecated Use getLogoSources instead for multi-source fallback
 */
const getFaviconUrl = (domain, size = 128) => {
  const normalized = normalizeDomain(domain);
  
  if (!normalized) {
    return null;
  }

  // Google favicon service URL
  return `https://www.google.com/s2/favicons?domain=${normalized}&sz=${size}`;
};

/**
 * Extracts domain from company name as a fallback
 * This is a simple heuristic - for production, consider using a domain extraction library
 * @param {string} companyName - The company name
 * @returns {string|null} - Extracted domain or null
 */
const extractDomainFromCompanyName = (companyName) => {
  if (!companyName || typeof companyName !== 'string') {
    return null;
  }

  // Simple heuristic: remove spaces, add .com
  // This is basic - for production, use a proper domain extraction service
  const cleaned = companyName.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  if (cleaned.length < 3) {
    return null;
  }

  return `${cleaned}.com`;
};

module.exports = {
  normalizeDomain,
  getLogoSources,
  getFaviconUrl,
  extractDomainFromCompanyName,
};
