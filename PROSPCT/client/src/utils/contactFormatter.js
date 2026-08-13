export const isValidUrl = (url) => {
  if (!url || url === '#' || url === '') return false;
  try {
    const parsed = new URL(url);
    return !!parsed.hostname;
  } catch {
    return false;
  }
};

/**
 * Format contact data from backend structure to frontend-friendly format
 * @param {Object} contact - Raw contact object from API
 * @returns {Object} Formatted contact object
 */
export const formatContact = (contact) => {
  // Support both MongoDB _source (camelCase) and ElasticSearch hits (snake_case)
  const source = contact._source || contact || {};

  // Build full name from MongoDB firstName/lastName, with ES snake_case fallback
  const mongoName = [source.firstName, source.lastName].filter(Boolean).join(' ');
  const personName = mongoName || source.person_name || source.full_name || '';
  
  // Extract profile image URL (check both naming conventions)
  const avatarUrl = source.personImageUrl ||
                    source.person_image_url ||
                    source.profileImageUrl ||
                    source.profile_image_url ||
                    source.linkedin_profile_image ||
                    source.photo_url ||
                    null;

  return {
    // Original fields (for backward compatibility)
    _id: contact._id,
    _source: contact._source,
    is_saved: contact.is_saved,
    
    // Profile image (if available from LinkedIn or other sources)
    avatarUrl,
    
    // Formatted fields
    initials: personName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '??',
    name: personName || 'Not Available',
    title: source.title || source.person_title || 'Not Available',
    company: source.companyName || source.organization_name || 'Not Available',
    companyInitials: (source.companyName || source.organization_name || '')
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??',
    location: formatLocation(source),
    postalCode: source.zipPostal || source.person_location_postal_code || source.companyPostalCode || source.company_postal_code || source.company_zip || source.organization_hq_location_postal_code || source.organization_location_postal_code || source.organization_location_postalcode || source.organization_location_zip || null,
    // Raw location fields for client-side filtering (MongoDB camelCase + ES fallbacks)
    _locationCity: source.companyCity || source.company_city || source.organization_hq_location_city || '',
    _locationState: source.companyState || source.company_state || source.organization_hq_location_state || '',
    _locationCountry: source.companyCountry || source.company_country || source.organization_hq_location_country || '',
    _locationPostalCode: source.zipPostal || source.person_location_postal_code || source.companyPostalCode || source.company_postal_code || source.company_zip || source.organization_hq_location_postal_code || source.organization_location_postal_code || source.organization_location_postalcode || source.organization_location_zip || '',
    _locationCityWithStateOrCountry: source.organization_hq_location_city_with_state_or_country || '',
    _locationStateWithCountry: source.organization_hq_location_state_with_country || '',
    employees: source.employees ?? source.employeeCount ?? source.employee_count ?? source.organization_num_current_employees ?? null,
    industry: source.industry || source.organization_industries?.[0] || source.title || source.person_title || 'Not Available',
    keywords: typeof source.keywords === 'string'
      ? (source.keywords || 'Not Available')
      : Array.isArray(source.keywords)
        ? (source.keywords.length > 0 ? source.keywords.join(', ') : 'Not Available')
        : Array.isArray(source.organization_keywords)
          ? (source.organization_keywords.length > 0 ? source.organization_keywords.join(', ') : 'Not Available')
          : typeof source.organization_keywords === 'string'
            ? (source.organization_keywords || 'Not Available')
            : 'Not Available',
    emailStatus:
      source.emailStatus ||
      source.person_email_status ||
      source.person_email_status_cd ||
      source.person_email_status_code ||
      'unknown',
    
    // Contact information
    email: source.email || source.person_email || null,
    phone: source.mobilePhone || source.mobile_phone || source.person_phone || source.phone || null,
    
    // Social links
    linkedinUrl: source.linkedinUrl || source.person_linkedin_url || null,
    organizationWebsite: source.website || source.organization_website_url || null,
    organizationDomain: source.companyDomain || source.organization_domain || source.website || source.organization_website_url || null,
    organizationLinkedin: (Array.isArray(source.companyLinkedinUrl)
      ? source.companyLinkedinUrl[0]
      : source.companyLinkedinUrl) || source.organization_linkedin_numerical_urls?.[0] || source.company_linkedin_url || source.organization_linkedin_url || null,
    organizationFacebook: source.facebookUrl || source.organization_facebook_url || source.facebook_url || null,
    organizationTwitter: source.twitterUrl || source.organization_twitter_url || source.twitter_url || null,
  };
};

/**
 * Format company data from backend structure to frontend-friendly format
 * @param {Object} company - Raw company object from API
 * @returns {Object} Formatted company object
 */
export const formatCompany = (company) => {
  // Support both MongoDB _source (camelCase) and ElasticSearch hits (snake_case)
  const source = company._source || company || {};
  
  // Extract profile image URL (check both naming conventions)
  const avatarUrl = source.organizationImageUrl ||
                    source.organization_image_url ||
                    source.organization_logo_url ||
                    source.company_logo || 
                    null;

  // Company name from MongoDB camelCase or ES snake_case
  const orgName = source.companyName || source.organization_name || '';

  return {
    // Original fields (for backward compatibility)
    _id: company._id,
    _source: company._source,
    is_saved: company.is_saved,
    
    // Profile image (if available)
    avatarUrl,
    
    // Formatted fields for companies
    initials: orgName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '??',
    name: orgName || 'Not Available',
    title: '', // Companies don't have individual titles
    company: orgName || 'Not Available',
    companyInitials: orgName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??',
    location: formatLocation(source),
    postalCode: source.zipPostal || source.person_location_postal_code || source.companyPostalCode || source.company_postal_code || source.company_zip || source.organization_hq_location_postal_code || source.organization_location_postal_code || source.organization_location_postalcode || source.organization_location_zip || null,
    // Raw location fields for client-side filtering
    _locationCity: source.companyCity || source.company_city || source.organization_hq_location_city || '',
    _locationState: source.companyState || source.company_state || source.organization_hq_location_state || '',
    _locationCountry: source.companyCountry || source.company_country || source.organization_hq_location_country || '',
    _locationPostalCode: source.zipPostal || source.person_location_postal_code || source.companyPostalCode || source.company_postal_code || source.company_zip || source.organization_hq_location_postal_code || source.organization_location_postal_code || source.organization_location_postalcode || source.organization_location_zip || '',
    _locationCityWithStateOrCountry: source.organization_hq_location_city_with_state_or_country || '',
    _locationStateWithCountry: source.organization_hq_location_state_with_country || '',
    employees: source.employees ?? source.employeeCount ?? source.employee_count ?? source.organization_num_current_employees ?? null,
    industry: source.industry || source.organization_industries?.[0] || source.title || source.person_title || 'Not Available',
    keywords: typeof source.keywords === 'string'
      ? (source.keywords || 'Not Available')
      : Array.isArray(source.keywords)
        ? (source.keywords.length > 0 ? source.keywords.join(', ') : 'Not Available')
        : Array.isArray(source.organization_keywords)
          ? (source.organization_keywords.length > 0 ? source.organization_keywords.join(', ') : 'Not Available')
          : typeof source.organization_keywords === 'string'
            ? (source.organization_keywords || 'Not Available')
            : 'Not Available',
    emailStatus: 'unknown', // Companies don't have individual email status
    
    // Company-specific fields
    email: null, // Companies don't have individual emails
    phone: null, // Companies don't have individual phones
    
    // Social links
    linkedinUrl: source.linkedinUrl || source.organization_linkedin_url || null,
    organizationWebsite: source.website || source.organization_website_url || null,
    organizationDomain: source.companyDomain || source.organization_domain || source.website || source.organization_website_url || null,
    organizationLinkedin: (Array.isArray(source.companyLinkedinUrl)
      ? source.companyLinkedinUrl[0]
      : source.companyLinkedinUrl) || source.organization_linkedin_numerical_urls?.[0] || source.company_linkedin_url || source.organization_linkedin_url || null,
    organizationFacebook: source.facebookUrl || source.organization_facebook_url || source.facebook_url || null,
    organizationTwitter: source.twitterUrl || source.organization_twitter_url || source.twitter_url || null,
  };
};

/**
 * Format location from city and country
 * @param {Object} source - Contact source data
 * @returns {String} Formatted location string
 */
const formatLocation = (source) => {
  // MongoDB camelCase first, then ES snake_case fallbacks
  const city = source.companyCity || source.company_city || source.organization_hq_location_city || '';
  const state = source.companyState || source.company_state || source.organization_hq_location_state || '';
  const country = source.companyCountry || source.company_country || source.organization_hq_location_country || '';
  const postalCode = source.zipPostal || source.person_location_postal_code || source.companyPostalCode || source.company_postal_code || source.company_zip || source.organization_hq_location_postal_code || source.organization_location_postal_code || source.organization_location_postalcode || source.organization_location_zip || '';
  const cityWithStateOrCountry = source.organization_hq_location_city_with_state_or_country || '';
  const stateWithCountry = source.organization_hq_location_state_with_country || '';
  
  // Build display string: prefer combined field, then build from parts
  if (cityWithStateOrCountry) return cityWithStateOrCountry;
  if (stateWithCountry) return stateWithCountry;
  
  const parts = [city, state, country].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  
  return postalCode || 'Not Available';
};

/**
 * Format multiple contacts
 * @param {Array} contacts - Array of raw contact objects
 * @returns {Array} Array of formatted contact objects
 */
export const formatContacts = (contacts) => {
  if (!Array.isArray(contacts)) return [];
  return contacts.map(formatContact);
};
