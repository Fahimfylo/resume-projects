import { Parser } from "@json2csv/plainjs";
import * as XLSX from "xlsx";

// Single function to convert JSON data to CSV/XLSX and trigger download
export const exportToCSV = (
  data,
  filename = "export_data.csv",
  fields = [],
  isCompanyExport = false,
  fieldLabels = {}
) => {
  if (!Array.isArray(data) || data.length === 0) {
    // console.warn("No data to export");
    return;
  }

  const getSource = (item) => (item && item._source ? item._source : item || {});
  const sample = getSource(data[0]);

  // Fields to exclude from companies export
  const excludedCompanyFields = [
    "person_first_name_unanalyzed",
    "person_last_name_unanalyzed",
    "person_name_unanalyzed_downcase",
    "person_email_analyzed",
    "sanitized_organization_name_unanalyzed",
    "organization_retail_location_count",
    "organization_num_languages",
    "organization_domain_status_cd",
    "organization_domain_analyzed",
    "organization_hq_location_city_with_state_or_country",
    "modality",
    "contact_unlocked",
    "contact_email_replied",
    "contact_email_clicked",
    "contact_email_open",
    "contact_email_unsubscribed",
    "contact_email_spamblocked",
    "contact_email_autosponder",
    "contact_domed",
    "contact_email_bounced",
    "contact_email_num_clicks",
    "contact_email_num_opens",
    "contacts_engagment_score",
    "relavence_boost",
    "contact_has_pending_email_arcgate_request",
    "indexed_at",
    "_source",
    "is_saved",
    "initials"
  ];


  // Field mapping for export to handle different field name variations
  const fieldMapping = {
    "twitter": ["organization_twitter_url", "twitter", "person_twitter", "organizationTwitter"],
    "companyAddress": ["organization_hq_location_city", "companyAddress", "company_address", "organization_address", "location", "headquarters"],
    "companyPostalCode": ["organization_hq_location_postal_code", "company_zip", "company_postal_code"],
    "companyLinkedin": ["companyLinkedin", "company_linkedin", "organization_linkedin_url", "organizationLinkedin"],
    "facebook": ["organization_facebook_url", "facebook", "person_facebook", "organizationFacebook"],
    "linkedinUrl": ["linkedinUrl", "linkedin_url", "person_linkedin_url", "person_linkedin"],
    "website": ["website", "organization_website_url", "domain"],
    "companyCity": ["organization_hq_location_city", "companyCity", "company_city", "organization_city"],
    "companyState": ["organization_hq_location_state", "companyState", "company_state", "organization_state"],
    "companyCountry": ["organization_hq_location_country", "companyCountry", "company_country", "organization_country"],
    "companyPhone": ["companyPhone", "company_phone", "organization_phone"],
    "employees": ["employees", "employee_count", "organization_num_current_employees"],
    "industry": ["industry", "industries", "organization_industries"],
    "keywords": ["keywords", "keywords_str", "organization_relevant_keywords_str"],
    "revenue": ["revenue", "annual_revenue", "organization_revenue"],
  };

  // Helper function to get value from item using field mapping
  const getValue = (source, field) => {
    // Special handling for companyAddress - combine city, state, country, and postal code
    if (field === "companyAddress") {
      const city = source.organization_hq_location_city || source.companyCity || source.company_city || "";
      const state = source.organization_hq_location_state || source.companyState || source.company_state || "";
      const country = source.organization_hq_location_country || source.companyCountry || source.company_country || "";
      let postalCode = source.organization_hq_location_postal_code || source.company_zip || source.company_postal_code || "";
      if (!postalCode) {
        const address = source.organization_hq_location_address || source.company_address || "";
        if (address) {
          const parts = address.split(",").map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) postalCode = parts[parts.length - 1];
        }
      }
      const combined = [city, state, country, postalCode].filter(Boolean).join(", ");
      return combined || source[field] || "";
    }

    if (fieldMapping[field]) {
      for (const key of fieldMapping[field]) {
        if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
          return source[key];
        }
      }
    }
    const value = source[field];
    return value;
  };

  // Choose which fields to export.
  // If no fields are passed in, fall back to the shape of the first item.
  let fieldsToUse =
    fields.length > 0
      ? fields
      : Object.keys(sample).filter(
          (key) => key !== "_id" && typeof sample[key] !== "object",
        );

  // Filter out excluded fields for companies export
  if (isCompanyExport) {
    fieldsToUse = fieldsToUse.filter(field => !excludedCompanyFields.includes(field));
  }


  try {
    // Select only the fields you want from each data item
    const filteredData = data.map((item) => {
      const source = getSource(item);
      const filteredItem = {};
      fieldsToUse.forEach((field) => {
        const label = fieldLabels[field] || field;
        filteredItem[label] = getValue(source, field);
      });
      return filteredItem;
    });


    // Convert the filtered data to CSV
    const parser = new Parser();
    const csv = parser.parse(filteredData, { fields: fieldsToUse });

    const ext = filename.split(".").pop().toLowerCase();

    if (ext === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const xlsxBlob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(xlsxBlob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return;
    }

    // Trigger CSV download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
      // For IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  } catch (err) {
    // console.error("Error exporting data to CSV:", err);
  }
};
