const csv = require("csv-parser");
const fs = require("fs");

// Handle CSV import upload. Parses the uploaded file and returns a preview of rows.
// Note: This endpoint does not yet persist contacts to the database; it provides a basic import pipeline.
exports.uploadImportFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const rows = [];
  const filePath = req.file.path;

  const parser = fs.createReadStream(filePath).pipe(csv());

  parser.on("data", (data) => {
    rows.push(data);

    // Limit preview size to avoid large memory usage.
    if (rows.length >= 50) {
      parser.pause();
    }
  });

  parser.on("end", () => {
    return res.json({
      success: true,
      count: rows.length,
      preview: rows.slice(0, 20),
    });
  });

  parser.on("error", (err) => {
    console.error("Import parsing error:", err);
    return res.status(500).json({ error: "Failed to parse CSV" });
  });
};

// Placeholder endpoint for two-way sync.
// Extend this to persist incoming contact/company data.
exports.syncWebhook = (req, res) => {
  // The body should contain { type: 'contact'|'company', data: {...} }
  // For now, just acknowledge receipt.
  return res.json({ success: true, message: "Sync webhook received." });
};
