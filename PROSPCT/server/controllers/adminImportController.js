const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const crypto = require('crypto');
const Contacts_V5 = require('../models/Contacts');
const { ImportedContact, ImportBatch } = require('../models/ImportedContact');
// const esClient = require('../config/elasticsearch');
// const redisClient = require('../redisClient');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Field mappings
const fieldMappings = {
  // Person info
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Title': 'title',
  'Email': 'email',
  'Email Status': 'emailStatus',
  'Mobile Phone': 'mobilePhone',
  'City': 'city',
  'State': 'state',
  'Country': 'country',
  'Person Linkedin Url': 'personLinkedinUrl',
  
  // Company info
  'Company Name': 'companyName',
  'Website': 'website',
  'Company Linkedin Url': 'companyLinkedinUrl',
  'Facebook Url': 'facebookUrl',
  'Twitter Url': 'twitterUrl',
  'Company Address': 'companyAddress',
  'Zip/Postal': 'zipPostal',
  'Company City': 'companyCity',
  'Company State': 'companyState',
  'Company Country': 'companyCountry',
  'Company Phone': 'companyPhone',
  'Employees': 'employees',
  'Industry': 'industry',
  'Keywords': 'keywords',
  'Annual Revenue': 'annualRevenue'
};

const requiredFields = ['First Name', 'Last Name', 'Email', 'Company Name'];

// Maps MongoDB _source field names to Elasticsearch field names used by search queries
const esFieldMappings = {
  'title': 'title',
  'email': 'email',
  'emailStatus': 'email_status',
  'mobilePhone': 'mobile_phone',
  'city': 'city',
  'state': 'state',
  'country': 'country',
  'personLinkedinUrl': 'linkedin_url',
  'companyName': 'company_name',
  'website': 'website',
  'companyLinkedinUrl': 'company_linkedin_url',
  'facebookUrl': 'facebook_url',
  'twitterUrl': 'twitter_url',
  'companyAddress': 'company_address',
  'zipPostal': 'company_postal_code',
  'companyCity': 'company_city',
  'companyState': 'company_state',
  'companyCountry': 'company_country',
  'companyPhone': 'company_phone',
  'employees': 'employee_count',
  'industry': 'industry',
  'keywords': 'keywords',
  'annualRevenue': 'revenue',
};

const adminImportController = {
  // Upload and process file
  importContacts: async (req, res) => {
    const importBatchId = crypto.randomUUID();
    let importBatch = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const adminId = req.admin?._id || req.admin?.userId;
      
      // Create import batch record
      importBatch = await ImportBatch.create({
        _id: importBatchId,
        adminId: adminId,
        fileName: req.file.originalname || req.file.filename,
        fileSize: req.file.size,
        status: 'parsing',
      });
      
      // Parse the file
      let data;
      try {
        data = parseFile(req.file.path);
      } catch (parseError) {
        console.error('[Import] File parsing error:', parseError);
        if (importBatch) {
          importBatch.status = 'failed';
          importBatch.error = parseError.message;
          await importBatch.save();
        }
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse file. Please check the file format.',
          error: parseError.message,
          importBatchId,
        });
      }

      if (!data || data.length === 0) {
        if (importBatch) {
          importBatch.status = 'failed';
          importBatch.error = 'No data found in the file';
          await importBatch.save();
        }
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'No data found in the file',
          importBatchId,
        });
      }

      
      if (importBatch) {
        importBatch.status = 'validating';
        importBatch.totalRows = data.length;
        await importBatch.save();
      }

      // Validate and process data
      const validationResult = validateData(data);
      
      if (!validationResult.isValid && validationResult.validData.length === 0) {
        if (importBatch) {
          importBatch.status = 'failed';
          importBatch.error = 'Data validation failed for all rows';
          importBatch.rowErrors = validationResult.errors.slice(0, 100);
          importBatch.failedRows = validationResult.failedRecords;
          await importBatch.save();
        }
        
        // Also save failed rows to contacts_imported
        try {
          await saveRowsToImportedCollection(
            validationResult.allData,
            importBatchId,
            adminId,
            req.file.originalname || req.file.filename
          );
        } catch (saveErr) {
          console.error('[Import] Failed to save to imported collection:', saveErr);
        }
        
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Data validation failed',
          errors: validationResult.errors,
          importBatchId,
        });
      }

      if (importBatch) {
        importBatch.status = 'importing';
        importBatch.validRows = validationResult.validData.length;
        importBatch.failedRows = validationResult.failedRecords;
        importBatch.rowErrors = validationResult.errors.slice(0, 100);
        await importBatch.save();
      }

      // Save ALL rows (valid and invalid) to contacts_imported collection first
      try {
        await saveRowsToImportedCollection(
          validationResult.allData,
          importBatchId,
          adminId,
          req.file.originalname || req.file.filename
        );
      } catch (saveErr) {
        console.error('[Import] Failed to save to imported collection:', saveErr);
      }

      // Insert valid contacts into contacts_v5 + index into Elasticsearch (existing behavior)
      const insertResult = await insertContacts(validationResult.validData, importBatchId);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);


      // Update import batch
      if (importBatch) {
        importBatch.status = 'completed';
        importBatch.processedToContactsV5 = insertResult.insertedCount;
        await importBatch.save();
      }

      // Mark the successfully inserted records as processed in contacts_imported
      if (insertResult.insertedIds && insertResult.insertedIds.length > 0) {
        try {
          await ImportedContact.updateMany(
            { _id: { $in: insertResult.insertedIds } },
            { 
              $set: { 
                status: 'processed',
                processedToContactsV5: true,
                processedAt: new Date()
              }
            }
          );
        } catch (updateErr) {
          console.error('[Import] Failed to mark imported contacts as processed:', updateErr);
        }
      }

      res.json({
        success: true,
        message: 'Contacts imported successfully',
        importBatchId,
        data: {
          totalRecords: data.length,
          importedRecords: insertResult.insertedCount,
          esIndexed: insertResult.esIndexed,
          failedRecords: validationResult.failedRecords,
          errors: validationResult.errors
        }
      });

    } catch (error) {
      console.error('[Import] Error:', error);
      
      if (importBatch) {
        importBatch.status = 'failed';
        importBatch.error = error.message;
        await importBatch.save().catch(saveErr => console.error('[Import] Failed to update batch:', saveErr));
      }
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        importBatchId,
      });
    }
  }
};

// Save rows to contacts_imported collection
async function saveRowsToImportedCollection(allData, importBatchId, adminId, fileName) {
  const importedDocs = allData.map((item, index) => {
    const { row, isValid, validationErrors } = item;
    
    // Build contactData from the row
    const contactData = {};
    Object.keys(fieldMappings).forEach(header => {
      const value = row[header] ? row[header].toString().trim() : '';
      if (value) {
        contactData[fieldMappings[header]] = value;
      }
    });

    const email = row['Email'] ? row['Email'].toString().trim() : '';

    return {
      _id: crypto.randomUUID(),
      importBatchId,
      adminId,
      fileName,
      originalRowIndex: index,
      originalRowData: row,
      contactData,
      email: email || undefined,
      status: isValid ? 'pending' : 'failed',
      error: validationErrors ? validationErrors.join(', ') : undefined,
      processedToContactsV5: false,
      _index: 'contacts_imported',
      _type: '_doc',
      _score: 1.0,
    };
  });

  // Bulk insert
  await ImportedContact.insertMany(importedDocs, { ordered: false });
}

// Parse Excel or CSV file
function parseFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with raw values
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    raw: false,
    defval: ''
  });

  if (data.length < 2) {
    throw new Error('File must contain at least a header row and one data row');
  }

  // Get headers from first row
  const headers = data[0];
  
  // Convert remaining rows to objects
  const rows = data.slice(1).filter(row => row.some(cell => cell.toString().trim() !== ''));
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().trim();
      const value = row[index] ? row[index].toString().trim() : '';
      obj[cleanHeader] = value;
    });
    return obj;
  });
}

// Validate data
function validateData(data) {
  const errors = [];
  const validData = [];
  const allData = [];
  let failedRecords = 0;

  // Check required fields in headers
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    return { isValid: false, errors, validData: [], failedRecords: data.length, allData: [] };
  }

  data.forEach((row, index) => {
    const rowErrors = [];
    const rowNum = index + 2;
    
    // Validate required fields
    requiredFields.forEach(field => {
      const value = row[field] ? row[field].toString().trim() : '';
      if (!value) {
        rowErrors.push(`${field} is required`);
      }
    });

    // Validate email format
    const email = row['Email'] ? row['Email'].toString().trim() : '';
    if (email && !isValidEmail(email)) {
      rowErrors.push('Invalid email format');
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
      failedRecords++;
      allData.push({
        row,
        isValid: false,
        validationErrors: rowErrors,
      });
    } else {
      validData.push(row);
      allData.push({
        row,
        isValid: true,
        validationErrors: [],
      });
    }
  });

  return {
    isValid: validData.length > 0,
    errors,
    validData,
    failedRecords,
    allData,
  };
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Build an Elasticsearch document from a MongoDB contact document
function buildEsDocument(contactDoc) {
  const source = contactDoc._source;
  const esDoc = {
    full_name: [source.firstName, source.lastName].filter(Boolean).join(' '),
    importedAt: source.importedAt,
    importSource: source.importSource,
  };

  Object.keys(esFieldMappings).forEach(key => {
    const esField = esFieldMappings[key];
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'employees') {
        esDoc[esField] = parseInt(value, 10) || value;
      } else if (key === 'annualRevenue') {
        esDoc[esField] = parseInt(value, 10) || value;
      } else {
        esDoc[esField] = value;
      }
    }
  });

  return esDoc;
}

// Index contacts into Elasticsearch. Returns number of successfully indexed docs.
// async function indexContactsToES(contacts) {
//   const body = contacts.flatMap(doc => [
//     { index: { _index: 'contacts_search', _id: doc._id } },
//     buildEsDocument(doc),
//   ]);
//
//   if (body.length === 0) return 0;
//
//   const response = await esClient.bulk({ body, refresh: 'wait_for' });
//   if (response.errors) {
//     const errorItems = response.items.filter(i => i.index?.error);
//     errorItems.forEach(i => console.error(`[Import] ES index error for ${i.index._id}:`, i.index.error));
//     return response.items.length / 2 - errorItems.length;
//   }
//   const count = response.items.length / 2;
//   return count;
// }

// Insert contacts into database
async function insertContacts(validData, importBatchId) {
  const contacts = validData.map(row => {
    const contactData = {};
    
    // Map fields using the field mappings
    Object.keys(fieldMappings).forEach(header => {
      const value = row[header] ? row[header].toString().trim() : '';
      if (value) {
        contactData[fieldMappings[header]] = value;
      }
    });

    // Create the contact document in the format expected by contacts_v5
    return {
      _id: crypto.randomUUID(),
      _index: 'contacts_v5',
      _type: '_doc',
      _score: 1.0,
      _source: {
        ...contactData,
        importedAt: new Date().toISOString(),
        importSource: 'admin_bulk_import',
        importBatchId: importBatchId,
      }
    };
  });

  // Track the IDs for later update of contacts_imported
  const insertedIds = [];

  // Bulk insert into contacts_v5
  let insertedContacts = [];
  try {
    const result = await Contacts_V5.insertMany(contacts, { ordered: false });
    insertedContacts = contacts.slice(0, result.length);
    insertedIds.push(...insertedContacts.map(c => c._id));
  } catch (error) {
    console.error('[Import] Database insertion error:', error);
    
    // Handle duplicate key errors — only index the ones that were actually inserted
    if (error.code === 11000) {
      const failedIndices = new Set((error.writeErrors || []).map(e => e.index));
      insertedContacts = contacts.filter((_, i) => !failedIndices.has(i));
      insertedIds.push(...insertedContacts.map(c => c._id));
    } else {
      throw error;
    }
  }

  // Index into Elasticsearch (best-effort — don't fail import if ES is down)
  // let esIndexed = 0;
  // if (insertedContacts.length > 0) {
  //   try {
  //     esIndexed = await indexContactsToES(insertedContacts);
  //   } catch (esError) {
  //     console.error('[Import] Elasticsearch indexing error:', esError);
  //   }
  // }

  return { 
    insertedCount: insertedContacts.length, 
    // esIndexed,
    insertedIds,
  };
}

// Export the upload middleware and controller
module.exports = {
  upload: upload.single('file'),
  importContacts: adminImportController.importContacts
};
