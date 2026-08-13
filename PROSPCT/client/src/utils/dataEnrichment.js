/**
 * Data Enrichment Engine for CRM Export System
 * Completes and fixes missing export fields using available company and person data
 */

export const enrichExportData = (data) => {
  if (!data) return null;

  const src = data._source || data;

  // Extract person name parts
  const personName = src.person_name || src.name || "";
  const nameParts = personName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Extract company name
  const companyName = src.organization_name || src.company || src.company_name || "";

  // Extract domain/website
  const website = src.organization_website_url || src.website || src.domain || "";
  const domain = extractDomain(website);

  // Extract location data
  const personCity = src.person_location_city || "";
  const personState = src.person_location_state || "";
  const personCountry = src.person_location_country || "";

  // Extract company HQ location
  const hqCity = src.organization_hq_location_city || "";
  const hqState = src.organization_hq_location_state || "";
  const hqCountry = src.organization_hq_location_country || "";
  const hqPostalCode = src.organization_hq_location_postal_code || "";

  // Construct company address
  const companyAddress = [hqCity, hqState, hqCountry, hqPostalCode]
    .filter(Boolean)
    .join(", ");

  // Normalize social URLs
  const linkedinCompany = normalizeLinkedInUrl(
    src.organization_linkedin_url || src.company_linkedin || src.companyLinkedin || "",
    companyName,
    domain
  );
  const facebookUrl = normalizeFacebookUrl(
    src.organization_facebook_url || src.facebook || src.person_facebook || "",
    companyName,
    domain
  );
  const twitterUrl = normalizeTwitterUrl(
    src.organization_twitter_url || src.twitter || src.person_twitter || "",
    companyName,
    domain
  );
  const personLinkedinUrl = normalizeLinkedInUrl(
    src.person_linkedin_url || src.linkedin_url || src.linkedinUrl || "",
    personName,
    domain
  );

  // Return enriched record
  return {
    first_name: firstName,
    last_name: lastName,
    title: src.person_title || src.title || src.job_title || "",
    company_name: companyName,
    email: src.person_email || src.email || "",
    email_status: src.email_status || src.person_email_status || src.emailStatus || "",
    mobile_phone: src.person_phone || src.phone || src.mobile_phone || src.mobilePhone || src.sanitized_phone || "",
    city: personCity,
    state: personState,
    country: personCountry,
    person_linkedin_url: personLinkedinUrl,
    website: website,
    company_linkedin_url: linkedinCompany,
    facebook_url: facebookUrl,
    twitter_url: twitterUrl,
    company_address: companyAddress,
    company_city: hqCity,
    company_state: hqState,
    company_country: hqCountry,
    company_phone: src.organization_phone || src.company_phone || src.companyPhone || "",
    employees: src.organization_num_current_employees || src.employees || src.employee_count || "",
    industry: Array.isArray(src.organization_industries)
      ? src.organization_industries.join(", ")
      : (src.organization_industries || src.industry || src.industries || ""),
    keywords: src.organization_relevant_keywords_str || src.keywords || src.keywords_str || "",
    annual_revenue: src.organization_revenue || src.revenue || src.annual_revenue || "",
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
 * Normalize LinkedIn URL to official company profile
 */
const normalizeLinkedInUrl = (url, companyName, domain) => {
  if (!url) return "";
  
  // If already a valid LinkedIn URL, return as-is
  if (url.includes("linkedin.com/company/")) {
    return url;
  }
  
  // If URL exists but not company format, try to fix
  if (url.includes("linkedin.com")) {
    return url;
  }
  
  // If company name and domain exist, construct likely LinkedIn URL
  if (companyName || domain) {
    const slug = (companyName || domain)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 50);
    return `https://www.linkedin.com/company/${slug}`;
  }
  
  return "";
};

/**
 * Normalize Facebook URL to official company page
 */
const normalizeFacebookUrl = (url, companyName, domain) => {
  if (!url) return "";
  
  // If already a valid Facebook URL, return as-is
  if (url.includes("facebook.com") || url.includes("fb.com")) {
    return url;
  }
  
  // If company name and domain exist, construct likely Facebook URL
  if (companyName || domain) {
    const slug = (companyName || domain)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 50);
    return `https://www.facebook.com/${slug}`;
  }
  
  return "";
};

/**
 * Normalize Twitter URL to official company profile
 */
const normalizeTwitterUrl = (url, companyName, domain) => {
  if (!url) return "";
  
  // If already a valid Twitter/X URL, return as-is
  if (url.includes("twitter.com") || url.includes("x.com")) {
    return url;
  }
  
  // If company name and domain exist, construct likely Twitter URL
  if (companyName || domain) {
    const slug = (companyName || domain)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 50);
    return `https://www.twitter.com/${slug}`;
  }
  
  return "";
};

/**
 * Batch enrich multiple records
 */
export const enrichExportDataBatch = (dataArray) => {
  if (!Array.isArray(dataArray)) return [];
  return dataArray.map(enrichExportData).filter(Boolean);
};
