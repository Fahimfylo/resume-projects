const Queue = require("bull");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const BulkEmailFile = require("../models/BulkEmailFile");
const { emitVerificationUpdate } = require("../utils/socket");

// Email verification queue using Bull and Redis
const emailVerificationQueue = new Queue("email-verification", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  },
});

emailVerificationQueue.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Function to poll for email verification status
const pollVerificationStatus = async (
  listId,
  apiKey,
  maxRetries = 60,
  retryDelay = 10000
) => {
  const debounce_status_api_url = `https://bulk.debounce.io/v1/status/?list_id=${listId}&api=${apiKey}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const statusResponse = await axios.get(debounce_status_api_url, {
        headers: {
          "Content-Type": "application/json",
        },
      });


      // Check if the API returned an error
      if (statusResponse.data.success === "0" || statusResponse.data.success === 0) {
        console.error("Debounce API error:", statusResponse.data.debounce?.error || "Unknown error");
        throw new Error(statusResponse.data.debounce?.error || "Debounce API error");
      }

      // Check if debounce object exists and has status
      if (!statusResponse.data.debounce || !statusResponse.data.debounce.status) {
        console.error("Invalid API response structure:", statusResponse.data);
        throw new Error("Invalid response from Debounce API");
      }

      if (statusResponse.data.debounce.status === "completed") {
        return statusResponse.data.debounce;
      } else if (
        ["preparing", "queued", "validating", "processing"].includes(
          statusResponse.data.debounce.status
        )
      ) {
      } else {
        console.error(
          "Unexpected status:",
          statusResponse.data.debounce.status
        );
        throw new Error(`Unexpected status: ${statusResponse.data.debounce.status}`);
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error.message);
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  console.error("Verification process timed out");
  return null;
};

// Process jobs from the queue
emailVerificationQueue.process(1, async (job, done) => {
  const { listId, apiKey, fileId, filePath } = job.data;
  const debounce_bulk_api_url = "https://bulk.debounce.io/v1/upload/";


  try {
    // Step 1: Send the file link to Debounce API
    const requestUrl = `${debounce_bulk_api_url}?url=${encodeURIComponent(filePath)}&api=${apiKey}`;

    const uploadResponse = await axios.get(requestUrl,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );


    // Check for Debounce API errors
    if (uploadResponse.data.success === "0" || uploadResponse.data.success === 0) {
      const errorMsg = uploadResponse.data.debounce?.error || "Failed to upload file to Debounce";
      throw new Error(errorMsg);
    }

    // Check if we have a valid list_id
    if (!uploadResponse.data.debounce || !uploadResponse.data.debounce.list_id) {
      throw new Error("Invalid response from Debounce: missing list_id");
    }

    const debounceListId = uploadResponse.data.debounce.list_id;

    // Update the status of the existing file to "processing"
    await BulkEmailFile.findByIdAndUpdate(fileId, {
      status: "processing",
    });

    const verificationResult = await pollVerificationStatus(
      debounceListId,
      apiKey
    );

    if (verificationResult) {
      // Download the Debounce results file locally instead of relying on their download link
      let newPath = null;
      if (verificationResult.download_link) {
        try {
          const dlResponse = await axios({
            method: "GET",
            url: verificationResult.download_link,
            responseType: "stream",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/csv,text/plain,*/*",
            },
          });
          const resultsDir = path.join(__dirname, "..", "uploads", "csv");
          if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
          const destPath = path.join(resultsDir, `results-${fileId}.csv`);
          const writer = fs.createWriteStream(destPath);
          dlResponse.data.pipe(writer);
          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });
          const stats = fs.statSync(destPath);
          if (stats.size > 50) {
            newPath = `uploads/csv/results-${fileId}.csv`;
          } else {
            console.error("[Verify] Downloaded file too small (" + stats.size + " bytes), keeping Debounce link");
          }
        } catch (dlErr) {
          console.error("Failed to download Debounce results:", dlErr.message);
        }
      }

      const finalPath = newPath || verificationResult.download_link;
      if (!finalPath) {
        console.error("[Verify] No download_link from Debounce, marking as failed");
        emitVerificationUpdate(fileId, "failed");
        await BulkEmailFile.findByIdAndUpdate(fileId, { status: "failed" });
        done(new Error("No download_link received from Debounce"));
        return;
      }

      await BulkEmailFile.findByIdAndUpdate(fileId, {
        filePath: finalPath,
        status: "completed",
      });

      // Emit after DB is updated so the frontend receives the correct filePath
      emitVerificationUpdate(fileId, "completed", finalPath);
      done(null, verificationResult);
    } else {
      emitVerificationUpdate(fileId, "failed");
      await BulkEmailFile.findByIdAndUpdate(fileId, {
        status: "failed",
      });
      done(new Error("Verification process timed out"));
    }
  } catch (error) {
    emitVerificationUpdate(fileId, "failed");
    console.error("Error processing email verification job:", error);
    await BulkEmailFile.findByIdAndUpdate(fileId, {
      status: "failed",
    });
    done(error);
  }
});

// Optional: Listen to job events for logging or notifications
emailVerificationQueue.on("completed", (job, result) => {
});

emailVerificationQueue.on("failed", (job, err) => {
});

module.exports = emailVerificationQueue;
