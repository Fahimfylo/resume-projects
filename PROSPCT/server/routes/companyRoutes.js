/**
 * Company Routes
 * 
 * API endpoints for company operations:
 * - GET /api/companies/unique - Get deduplicated unique companies
 * - GET /api/companies/search - Search companies by name/domain
 * - GET /api/companies/stats - Get company statistics
 * - GET /api/companies/:id - Get company by ID
 * 
 * @version 1.0.0
 */

const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// Import middleware (adjust paths as needed)
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");

/**
 * @route   GET /api/companies/counts
 * @desc    Get counts of UNIQUE companies (not contacts) for filter display
 * @access  Private
 * 
 * Example:
 * GET /api/companies/counts
 */
router.get(
  "/counts",
  authMiddleware,
  workspaceContextMiddleware,
  companyController.getCompanyCounts
);

/**
 * @route   GET /api/companies/unique
 * @desc    Get deduplicated list of unique companies
 * @query   approach - "nodejs" | "elasticsearch" | "hybrid" (default: "nodejs")
 * @query   limit - Maximum companies to return (default: 1000, max: 50000)
 * @query   batchSize - Batch size for processing (default: 1000)
 * @access  Private
 * 
 * Example:
 * GET /api/companies/unique?approach=nodejs&limit=100&batchSize=1000
 */
router.get(
  "/unique",
  authMiddleware,
  workspaceContextMiddleware,
  companyController.getUniqueCompanies
);

/**
 * @route   GET /api/companies/search
 * @desc    Search companies by name or domain
 * @query   q - Search query (required, min 2 chars)
 * @query   field - "name" | "domain" | "all" (default: "all")
 * @query   limit - Maximum results (default: 50)
 * @access  Private
 * 
 * Example:
 * GET /api/companies/search?q=sysco&field=all&limit=20
 */
router.get(
  "/search",
  authMiddleware,
  workspaceContextMiddleware,
  companyController.searchCompanies
);

/**
 * @route   GET /api/companies/stats
 * @desc    Get company statistics and analytics
 * @access  Private
 * 
 * Example:
 * GET /api/companies/stats
 */
router.get(
  "/stats",
  authMiddleware,
  workspaceContextMiddleware,
  companyController.getCompanyStats
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get detailed information about a specific company
 * @access  Private
 * 
 * Example:
 * GET /api/companies/57cf8a48a6da984c4213ccbc
 */
router.get(
  "/:id",
  authMiddleware,
  workspaceContextMiddleware,
  companyController.getCompanyById
);

module.exports = router;
