// routes/teamRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const {
  requireTeamOwner,
  requireTeamAdminOrOwner,
  requireTeamMember,
} = require("../middleware/rbacMiddleware");
const teamController = require("../controllers/teamController");
const router = express.Router();

// Rate limiter for team operations (30 per hour)
const teamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// 1️⃣ Create a new team (auth required, permission check in controller)
// Controller allows: global admins, standalone users, or team owners
// Controller blocks: team admins and team members
router.post("/", authMiddleware, teamController.createTeam);

// 1.5️⃣ Update team name (team owner or admin)
router.patch("/:teamId/name", authMiddleware, workspaceContextMiddleware, requireTeamAdminOrOwner, teamController.updateTeamName);

// 2️⃣ Generate invite link for a team (team owner or admin can invite)
router.post("/invite-link", authMiddleware, workspaceContextMiddleware, requireTeamAdminOrOwner, teamLimiter, teamController.generateInviteLink);

// 3️⃣ Join a team via invite link
router.post("/join/:token", authMiddleware, workspaceContextMiddleware, teamLimiter, teamController.joinTeam);

// 4️⃣ Get all teams for logged-in user (auth required, will show owned teams or member teams)
router.get("/", authMiddleware, teamController.getUserTeams);

// 5️⃣ Remove a member from a team (team owner only - admins cannot remove members)
router.delete(
  "/member/:teamId/:memberId",
  authMiddleware,
  workspaceContextMiddleware,
  requireTeamOwner,
  teamLimiter,
  teamController.removeMember,
);

// 6️⃣ Remove all members from a team (team owner only)
router.delete(
  "/members/:teamId/all",
  authMiddleware,
  workspaceContextMiddleware,
  requireTeamOwner,
  teamLimiter,
  teamController.removeAllMembers,
);

// 7️⃣ Update a member's role (team owner only)
router.patch(
  "/member-role/:teamId",
  authMiddleware,
  workspaceContextMiddleware,
  requireTeamOwner,
  teamLimiter,
  teamController.updateMemberRole,
);

router.delete("/leave", authMiddleware, workspaceContextMiddleware, requireTeamMember, teamController.leaveTeam);
module.exports = router;
