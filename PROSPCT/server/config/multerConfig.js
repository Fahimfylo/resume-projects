const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Function to create storage with dynamic directory and ensure the directory exists
const createStorage = (directory) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure the directory exists, if not, create it
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      cb(null, directory); // Set directory dynamically
    },
    filename: (req, file, cb) => {
      // Sanitize filename: use random hex + safe extension
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ext.match(/\.(csv|xls|xlsx|jpeg|jpg|png)$/) ? ext : ".bin";
      const randomName = crypto.randomBytes(16).toString("hex");
      cb(null, `${Date.now()}-${randomName}${safeExt}`);
    },
  });
};

// CSV File Filter (for .csv, .xls, .xlsx)
const csvFileFilter = (req, file, cb) => {
  const filetypes = /csv|xls|xlsx/; // Accept .csv, .xls, and .xlsx
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Please upload a CSV or XLS file."));
  }
};

// Image File Filter (for .jpeg, .jpg, .png)
const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/; // Accept .jpeg, .jpg, and .png
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed. Please upload an image file."));
  }
};

// Define CSV upload configuration
const csvUpload = multer({
  storage: createStorage("uploads/csv"),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// Define Image upload configuration
const imageUpload = multer({
  storage: createStorage("uploads/images"),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// Export both configurations
module.exports = {
  csvUpload,
  imageUpload,
};
