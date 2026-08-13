const express = require("express");
const adminController = require("../controllers/adminController");
const planController = require("../controllers/planController");
const adminMiddleware = require("../middleware/adminMiddleware");
const { upload, importContacts } = require("../controllers/adminImportController");

const router = express.Router();


router.get("/", adminMiddleware, adminController.getAllAdmins);
router.get("/search", adminMiddleware, adminController.getAdminBySearch);
router.get("/:adminId", adminMiddleware, adminController.getAdminById);
router.post("/addAdmin", adminMiddleware, adminController.addAdmin);
router.post("/delete", adminMiddleware, adminController.deleteAllAdmins);
router.delete("/delete/:adminId", adminMiddleware, adminController.deleteAdmin);
router.put("/update/:adminId", adminMiddleware, adminController.updateAdmin);

// Admin: Team management
router.get('/users/teams', adminMiddleware, adminController.getAllTeams);
router.get('/users/teams/:ownerId', adminMiddleware, adminController.getTeamByOwner);
router.delete('/users/teams/:teamId', adminMiddleware, adminController.deleteTeam);
router.delete('/users/teams/:teamId/member/:memberEmail', adminMiddleware, adminController.deleteTeamMember);

// Import contacts route
router.post("/import-contacts", adminMiddleware, upload, importContacts);

module.exports = router;
