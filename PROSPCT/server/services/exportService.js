const fastCsv = require("fast-csv");
const contacts_v5 = require("../models/Contacts");

// Strict column order for export
const EXPORT_ORDER = [
  "First Name",
  "Last Name",
  "Title",
  "Company Name",
  "Email",
  "Email Status",
  "Mobile Phone",
  "City",
  "State",
  "Country",
  "Person Linkedin Url",
  "Website",
  "Company Linkedin Url",
  "Facebook Url",
  "Twitter Url",
  "Company Address",
  "Company City",
  "Company State",
  "Company Country",
  "Company Phone",
  "Employees",
  "Industry",
  "Keywords",
  "Annual Revenue",
];

// Helper function to extract first name from full name
const extractFirstName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return "";
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return firstName || "";
};

// Helper function to extract last name from full name
const extractLastName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return "";
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return rest.join(" ") || "";
};

// Map MongoDB _source (camelCase) fields to export field names
const mapRowData = (mongoDoc) => {
  const src = mongoDoc._source || mongoDoc || {};
  const isCompany = (src.organization_name || src.companyName) && !src.person_name && !src.firstName && !src.lastName;
  const fullName = [src.firstName, src.lastName].filter(Boolean).join(' ') || src.person_name || "";

  const extractValue = (val) => {
    if (Array.isArray(val) && val.length > 0) return val[0];
    return val || "";
  };

  const fullRowData = {
    "First Name": isCompany ? "" : (extractFirstName(fullName) || ""),
    "Last Name": isCompany ? "" : (extractLastName(fullName) || ""),
    "Title": isCompany ? "" : (src.title || src.person_title || src.job_title || ""),
    "Company Name": src.organization_name || src.companyName || src.company || "",
    "Email": isCompany ? "" : (src.email || src.person_email || ""),
    "Email Status": isCompany ? "" : (src.emailStatus || src.person_email_status || ""),
    "Mobile Phone": isCompany ? "" : (src.sanitized_phone || src.person_phone || src.mobilePhone || src.mobile_phone || ""),
    "City": isCompany ? (src.organization_hq_location_city || "") : (src.city || src.person_location_city || src.companyCity || src.company_city || ""),
    "State": isCompany ? (src.organization_hq_location_state || "") : (src.state || src.person_location_state || src.companyState || src.company_state || ""),
    "Country": isCompany ? (src.organization_hq_location_country || "") : (src.country || src.person_location_country || src.companyCountry || src.company_country || ""),
    "Person Linkedin Url": isCompany ? "" : (extractValue(src.linkedinUrl || src.person_linkedin_url || src.linkedin_url || src.person_linkedin) || ""),
    "Website": src.website || src.organization_website_url || src.domain || "",
    "Company Linkedin Url": extractValue(src.organization_linkedin_numerical_urls || src.organization_linkedin_url || src.companyLinkedin || src.company_linkedin) || "",
    "Facebook Url": extractValue(src.organization_facebook_url || src.facebookUrl || src.facebook || src.person_facebook) || "",
    "Twitter Url": extractValue(src.organization_twitter_url || src.twitterUrl || src.twitter || src.person_twitter) || "",
    "Company Address": [src.organization_hq_location_address, src.organization_hq_location_city, src.organization_hq_location_state, src.organization_hq_location_country, src.organization_hq_location_postal_code].filter(Boolean).join(", ") || src.company_address || src.organization_address || "",
    "Company City": src.organization_hq_location_city || src.companyCity || src.company_city || src.organization_city || "",
    "Company State": src.organization_hq_location_state || src.companyState || src.company_state || src.organization_state || "",
    "Company Country": src.organization_hq_location_country || src.companyCountry || src.company_country || src.organization_country || "",
    "Company Phone": src.organization_phone || src.companyPhone || src.company_phone || "",
    "Employees": src.employeeCount !== undefined ? String(src.employeeCount) : (src.organization_num_current_employees ? String(src.organization_num_current_employees) : src.employee_count !== undefined ? String(src.employee_count) : ""),
    "Industry": Array.isArray(src.industries || src.organization_industries)
      ? (src.industries || src.organization_industries).join(", ")
      : src.industry || src.organization_industries || "",
    "Keywords": src.keywords_str || src.organization_relevant_keywords_str || src.keywords || "",
    "Annual Revenue": src.revenue || src.annual_revenue || src.organization_revenue || src.organization_annual_revenue || "",
  };

  // Apply strict column order
  const orderedRowData = {};
  EXPORT_ORDER.forEach(field => {
    orderedRowData[field] = fullRowData[field] || "";
  });

  return orderedRowData;
};

const exportContactsToCsv = async ({ ids, exportOption, selectedColumns }, res) => {
  const requestId = `EXPORT-${Date.now()}`;
  const BATCH_SIZE = 2000;

  let clientGone = false;
  res.on("close", () => {
    if (!res.writableEnded) {
      clientGone = true;
      console.warn(`[${requestId}] ⚡ CLIENT DISCONNECTED — aborting export stream`);
    }
  });

  let csvStream = null;

  try {
    // Fetch documents from MongoDB directly (same source as search)
    const query = (ids && Array.isArray(ids) && ids.length > 0)
      ? { _id: { $in: ids } }
      : {};

    const totalDocs = await contacts_v5.countDocuments(query);
    if (totalDocs === 0) {
      return res.status(404).json({ error: "No contacts found for export" });
    }

    // Headers are only sent once we know data exists
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prospct_export_${Date.now()}.csv"`,
    );

    csvStream = fastCsv.format({ headers: true, writeBOM: true });
    csvStream.pipe(res);

    const writeRow = (row) =>
      new Promise((resolve) => {
        const ok = csvStream.write(row);
        if (ok) return resolve();
        csvStream.once("drain", resolve);
      });

    let rowCount = 0;
    let skip = 0;
    let hasMore = true;
    let batchNum = 0;

    while (hasMore && !clientGone) {
      const batch = await contacts_v5.find(query).sort({ _id: 1 }).lean().skip(skip).limit(BATCH_SIZE);
      batchNum++;

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      let batchWriteCount = 0;

      for (const doc of batch) {
        if (clientGone) {
          console.warn(`[${requestId}] ⚡ Client disconnected mid-batch #${batchNum}`);
          break;
        }

        const rowData = mapRowData(doc);

        // Apply column filtering
        const filteredRow = selectedColumns && selectedColumns.length > 0
          ? Object.fromEntries(
              Object.entries(rowData).filter(([key]) => selectedColumns.includes(key))
            )
          : rowData;

        await writeRow(filteredRow);
        rowCount++;
        batchWriteCount++;
      }

      skip += batch.length;
    }

    if (clientGone) {
      console.warn(`[${requestId}] ⚡ Export aborted early — client disconnected at row ${rowCount}/${totalDocs}`);
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ EXPORT ERROR:`, {
      message: error.message,
      rowCount,
      headersSent: res.headersSent,
      writableEnded: res.writableEnded,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });

    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "Export stream failed", message: error.message });
    }
  } finally {
    if (csvStream && res.headersSent && !res.writableEnded) {
      csvStream.end();
    }
  }
};

module.exports = {
  exportContactsToCsv,
};
