const axios = require("axios");
const fs = require("fs");
const BulkEmailFile = require("../models/BulkEmailFile");
const User = require("../models/User");
const csvParser = require("csv-parser");
const emailVerificationQueue = require("../queues/emailVerificationQueue");
const path = require("path");

const emailVerificationController = {
  singleEmailVerify: async (req, res) => {
    const debounce_api_key = process.env.DEBOUNCE_API;
    try {
      const { emailList } = req.body;

      // Check if the email list exceeds the limit of 20 emails
      if (emailList.length > 20) {
        return res.status(400).json({
          error: "You can only verify a maximum of 20 emails at a time.",
        });
      }

      // Array to store each email's verification result
      const verificationResults = [];

      for (const email of emailList) {
        try {
          const response = await axios.get(
            `https://api.debounce.io/v1/?email=${email}&api=${debounce_api_key}`
          );

          if (response.status === 200 && response.data.success) {
            const verificationCode = response.data.debounce.code;
            verificationResults.push({
              email: email,
              status: verificationCode,
              date: new Date().toISOString(), // Add current date
              success: true,
            });
          } else {
            verificationResults.push({
              email: email,
              status: "unknown",
              date: new Date().toISOString(),
              success: false,
              message: "Verification failed for this email",
            });
          }
        } catch (err) {
          // Handle any error that occurs during the API request
          verificationResults.push({
            email: email,
            status: "unknown",
            date: new Date().toISOString(),
            success: false,
            message: `Error verifying email: ${err.message}`,
          });
        }
      }

      res.status(200).json({
        message: "Email verified successfully",
        results: verificationResults,
      });
    } catch (err) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  bulkEmailVerify: async (req, res) => {
    const debounce_api_key = process.env.DEBOUNCE_API;

    try {
      const userId = req.user.userId;
      const { fileId } = req.body;

      // Get the file from database
      const file = await BulkEmailFile.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Verify file ownership
      if (file.user.toString() !== userId.toString()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Construct full public URL for Debounce API
      const serverBaseUrl = process.env.SERVER_BASE_URL || "https://app.prospct.io";
      const publicFileUrl = `${serverBaseUrl}/${file.filePath}`;

      // Debug: Log the URL being sent to Debounce

      // Queue the email verification job
      emailVerificationQueue
        .add({
          apiKey: debounce_api_key,
          fileId: fileId,
          filePath: publicFileUrl,
        })
        .then((job) => {
        })
        .catch((err) => {
          console.error(`Failed to add job: ${err.message}`);
        });

      // Return a response immediately
      res.status(200).json({
        message: "Email verification started. You can check the status later.",
        fileId,
      });
    } catch (err) {
      console.error("Error during email verification process:", err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },

  fileUpload: async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Find the authenticated user (assuming user info is in req.user)
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Initialize variables to store email data
      let emails = [];
      let duplicateEmails = [];
      let invalidEmails = [];

      // Use a set to track duplicate emails
      const emailSet = new Set();

      // Parse the CSV file and process email data
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (row) => {
          const email = row["email"]; // Assumes emails are in a column named 'email'

          // Simple email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            invalidEmails.push(email); // Invalid email format
          } else if (emailSet.has(email)) {
            duplicateEmails.push(email); // Track duplicates
          } else {
            emails.push(email); // Valid unique email
            emailSet.add(email);
          }
        })
        .on("end", async () => {
          // All rows processed, calculate totals
          const totalEmails =
            emails.length + duplicateEmails.length + invalidEmails.length;

          // Calculate billable emails
          const billableEmails =
            totalEmails - duplicateEmails.length - invalidEmails.length;

          // Create a new file entry in the database
          // Store relative URL path (forward slashes for cross-platform)
          const relativePath = req.file.path.replace(/\\/g, "/");
          const newFile = new BulkEmailFile({
            fileName: req.file.originalname,
            filePath: relativePath,
            user: user._id,
            totalEmails,
            billableEmails,
            invalidEmails: invalidEmails.length,
            duplicateEmails: duplicateEmails.length,
          });

          const savedFile = await newFile.save();

          // File has been uploaded successfully, return the file info
          return res.status(200).json({
            message: "File uploaded successfully",
            file: savedFile,
          });
        })
        .on("error", (error) => {
          return res
            .status(500)
            .json({ error: "Error processing file: " + error.message });
        });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getFiles: async (req, res) => {
    try {
      const files = await BulkEmailFile.find({ user: req.user.userId });
      res.status(200).json(files);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  deleteFile: async (req, res) => {
    try {
      const file = await BulkEmailFile.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      if (file.user.toString() !== req.user.userId.toString()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await BulkEmailFile.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  downloadResults: async (req, res) => {
    try {
      const file = await BulkEmailFile.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      if (file.user.toString() !== req.user.userId.toString()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { filePath } = file;
      if (!filePath) {
        return res.status(404).json({ message: "No file path available" });
      }

      const fileName = `results-${file.fileName || "verified"}`;

      if (filePath.startsWith("uploads/")) {
        const fullPath = path.join(__dirname, "..", filePath);
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ message: "File not found on server" });
        }
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        fs.createReadStream(fullPath).pipe(res);
      } else if (filePath.startsWith("http")) {
        const dlResponse = await axios({
          method: "GET",
          url: filePath,
          responseType: "stream",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/csv,text/plain,*/*",
          },
        });
        res.setHeader("Content-Type", dlResponse.headers["content-type"] || "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        dlResponse.data.pipe(res);
      } else {
        return res.status(400).json({ message: "Invalid file path format" });
      }
    } catch (err) {
      console.error("Error downloading results:", err.message);
      res.status(500).json({ message: "Failed to download file" });
    }
  },
};

module.exports = emailVerificationController;
