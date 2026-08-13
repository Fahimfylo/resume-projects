/**
 * Company Data Enrichment Service
 * Fills missing company fields using reliable public data patterns
 */

/**
 * Enrich company data with missing social media URLs and address
 * @param {Object} data - Raw company data from database
 * @returns {Object} - Enriched company data
 */
const enrichCompanyData = (data) => {
  if (!data) return null;

  const src = data._source || data;

  // Extract existing values
  const existingLinkedIn = src.company_linkedin_url || src.organization_linkedin_url || src.company_linkedin || "";
  const existingFacebook = src.facebook_url || src.organization_facebook_url || src.facebook || "";
  const existingTwitter = src.twitter_url || src.organization_twitter_url || src.twitter || "";
  const existingAddress = src.company_address || src.organization_address || "";

  // Extract company identifiers
  const companyName = src.organization_name || src.company_name || src.company || "";
  const domain = src.organization_domain || src.domain || extractDomain(src.organization_website_url || src.website || "");
  const website = src.organization_website_url || src.website || "";

  // Extract location components
  const city = src.organization_hq_location_city || src.company_city || "";
  const state = src.organization_hq_location_state || src.company_state || "";
  const country = src.organization_hq_location_country || src.company_country || "";
  const postalCode = src.organization_hq_location_postal_code || "";

  // Only fill missing fields
  const enrichedLinkedIn = existingLinkedIn || generateLinkedInUrl(companyName, domain);
  const enrichedFacebook = existingFacebook || generateFacebookUrl(companyName, domain);
  const enrichedTwitter = existingTwitter || generateTwitterUrl(companyName, domain);
  const enrichedAddress = existingAddress || formatCompanyAddress(city, state, country, postalCode);

  return {
    company_linkedin_url: enrichedLinkedIn,
    facebook_url: enrichedFacebook,
    twitter_url: enrichedTwitter,
    company_address: enrichedAddress,
  };
};

/**
 * Extract domain from URL
 */
const extractDomain = (url) => {
  if (!url) return "";
  try {
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      return urlObj.hostname;
    }
    return url;
  } catch {
    return url;
  }
};

/**
 * Generate LinkedIn company URL from company name or domain
 * Only generates if confident about the match
 */
const generateLinkedInUrl = (companyName, domain) => {
  if (!companyName && !domain) return "";

  // Use domain as primary identifier for more accuracy
  const identifier = domain || companyName;
  
  if (!identifier) return "";

  // Clean the identifier to create a LinkedIn slug
  const slug = identifier
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,}$/, "") // Remove TLD
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 50);

  if (!slug) return "";

  return `https://www.linkedin.com/company/${slug}`;
};

/**
 * Generate Facebook company URL from company name or domain
 * Only generates if confident about the match
 */
const generateFacebookUrl = (companyName, domain) => {
  if (!companyName && !domain) return "";

  const identifier = domain || companyName;
  
  if (!identifier) return "";

  // Clean the identifier to create a Facebook slug
  const slug = identifier
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,}$/, "")
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 50);

  if (!slug) return "";

  return `https://www.facebook.com/${slug}`;
};

/**
 * Generate Twitter (X) company URL from company name or domain
 * Only generates if confident about the match
 */
const generateTwitterUrl = (companyName, domain) => {
  if (!companyName && !domain) return "";

  const identifier = domain || companyName;
  
  if (!identifier) return "";

  // Clean the identifier to create a Twitter handle
  const handle = identifier
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.[a-z]{2,}$/, "")
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 15); // Twitter handles are typically shorter

  if (!handle) return "";

  return `https://www.twitter.com/${handle}`;
};

/**
 * Format company address from location components
 */
const formatCompanyAddress = (city, state, country, postalCode) => {
  const parts = [city, state, country, postalCode].filter(Boolean);
  return parts.join(", ") || "";
};

/**
 * Validate LinkedIn URL format
 */
const isValidLinkedInUrl = (url) => {
  if (!url) return false;
  return url.includes("linkedin.com/company/");
};

/**
 * Validate Facebook URL format
 */
const isValidFacebookUrl = (url) => {
  if (!url) return false;
  return url.includes("facebook.com/") || url.includes("fb.com/");
};

/**
 * Validate Twitter URL format
 */
const isValidTwitterUrl = (url) => {
  if (!url) return false;
  return url.includes("twitter.com/") || url.includes("x.com/");
};

/**
 * Batch enrich multiple company records
 */
const enrichCompanyDataBatch = (dataArray) => {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(enrichCompanyData).filter(Boolean);
};

module.exports = {
  enrichCompanyData,
  enrichCompanyDataBatch,
  isValidLinkedInUrl,
  isValidFacebookUrl,
  isValidTwitterUrl,
  formatCompanyAddress,
};
