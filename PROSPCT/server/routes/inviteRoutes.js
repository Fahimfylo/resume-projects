const express = require("express");
const rateLimit = require("express-rate-limit");
const inviteController = require("../controllers/inviteController");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const { requireTeamOwner, requireTeamAdminOrOwner } = require("../middleware/rbacMiddleware");

const router = express.Router();

// Rate limiter for invite sending (10 invites per hour)
const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many invite attempts. Please try again later." },
});

// Rate limiter for token verification (20 per hour)
const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again later." },
});

// Rate limiter for list and revoke (30 per hour)
const generalInviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// POST /api/invite/send — team admin or owner can send invites
router.post("/send", authMiddleware, workspaceContextMiddleware, requireTeamAdminOrOwner, inviteLimiter, inviteController.sendInvite);

// POST /api/invite/verify — verify an invite token (used during registration) - no auth required
router.post("/verify", verifyLimiter, inviteController.verifyInviteToken);

// GET /api/invite/list — get all invites from workspace (team admin or owner)
router.get("/list", authMiddleware, workspaceContextMiddleware, requireTeamAdminOrOwner, generalInviteLimiter, inviteController.getInvites);

// POST /api/invite/revoke/:inviteId — revoke a pending invite (team owner only)
router.post("/revoke/:inviteId", authMiddleware, workspaceContextMiddleware, requireTeamOwner, generalInviteLimiter, inviteController.revokeInvite);

module.exports = router;
