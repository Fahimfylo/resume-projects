const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");

const searchController = require("../controllers/searchController");

const rateLimit = require("express-rate-limit");



const router = express.Router();



// Higher rate limit for search since it's a core feature

const searchLimiter = rateLimit({

  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 1000, // 1000 requests per 15 minutes per IP

  standardHeaders: true,

  legacyHeaders: false,

  message: { error: "Too many search requests. Please try again later." },

});



router.post("/", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.search);

router.post("/count", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getSearchCount);

router.post("/batch", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchBatch);

router.post("/batch/next", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchBatchNext);

router.post("/export-csv", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.exportContactsCsv);

router.post("/export", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.exportContactsCsv);

router.post("/details", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getItemDetailsByIds);

router.post("/find-leads", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.findLeads);

router.get("/filter-counts", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getFilterCounts);

router.post("/save-share-state", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.saveShareState);

router.get("/share-state/:shareId", searchLimiter, searchController.getShareState);

router.get("/city-suggestions", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getCitySuggestions);

router.get("/company-domain-suggestions", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getCompanyDomainSuggestions);

router.get("/keywords-suggestions", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getKeywordsSuggestions);

router.get("/industry-suggestions", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getIndustrySuggestions);

router.get("/name-suggestions", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getPersonNameSuggestions);

router.post("/companies-count", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getUniqueCompaniesCount);

router.post("/companies-count-exact", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getExactUniqueCompaniesCount);

router.post("/companies", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchCompanies);

module.exports = router;

