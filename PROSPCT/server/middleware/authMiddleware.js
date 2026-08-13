const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");
const { resolveUserPermissions } = require("../services/permissionService");

/**
 * Auth Middleware - Production-ready multi-tenant authentication
 *
 * JWT payload is minimal: { userId }
 * ALL authorization decisions are based on fresh DB data.
 *
 * Role Resolution (Single Source of Truth):
 *   - Global role: User.role ("admin" | "user")
 *   - Team role: Team.members.role ("owner" | "admin" | "member")
 *   - NO role duplication in User collection
 *
 * Sets on req.user:
 *   - _id: user's own MongoDB _id
 *   - userId: same as _id (for consistency)
 *   - email: user's email
 *   - role: global role ("user" | "admin")
 *   - teamId: team _id if member of a team, null otherwise
 *   - teamRole: resolved from Team.members (null if not joined member)
 *   - isTeamOwner: true only if Team.owner matches user._id
 *   - isTeamAdmin: true if Team.members.role === "admin" or "owner"
 *   - isTeamMember: true if any joined membership exists
 *   - permissions: full permission object from permissionService
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "undefined" || token === "null" || token === "") {
    return res.status(401).json({ message: "Access Denied: Invalid or missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // JWT contains ONLY userId - everything else comes from DB
    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch fresh user data from database
    const user = await User.findById(userId).select("_id email role teamId invitedBy isBlocked");
    if (!user) {
      console.error(`[authMiddleware] User not found for userId: ${userId}`);
      return res.status(401).json({ message: "User account not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }

    // Resolve permissions using centralized service
    // This pulls teamRole from Team.members (single source of truth)
    const permissions = await resolveUserPermissions(user._id, user.teamId);

    // Build req.user with resolved permissions
    req.user = {
      // Identity
      _id: user._id,
      userId: user._id,
      email: user.email,

      // Global role (from User collection)
      role: permissions.globalRole,
      isGlobalAdmin: permissions.isGlobalAdmin,

      // Team context (from Team.members - single source of truth)
      teamId: permissions.teamId,
      teamRole: permissions.teamRole, // "owner" | "admin" | "member" | null
      invitedBy: user.invitedBy || null,

      // Permission flags (resolved from Team.members)
      isTeamOwner: permissions.isTeamOwner,
      isTeamAdmin: permissions.isTeamAdmin,
      isTeamMember: permissions.isTeamMember,

      // Full permissions object for advanced checks
      permissions: permissions,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
