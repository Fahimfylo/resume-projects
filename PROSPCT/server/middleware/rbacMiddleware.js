/**
 * RBAC Middleware - Role-Based Access Control
 *
 * SINGLE SOURCE OF TRUTH:
 * - Global role: User.role ("admin" | "user")
 * - Team role: Team.members.role ("owner" | "admin" | "member")
 *
 * Role Resolution:
 * - req.user.teamRole is resolved by authMiddleware using permissionService
 * - Team role comes ONLY from Team.members (never from User collection)
 * - Membership status === "joined" is verified by authMiddleware
 *
 * Role Hierarchy:
 * Global Admin > Team Owner > Team Admin > Team Member
 *
 * Must be used AFTER authMiddleware.
 */

/**
 * Require global admin role (application-level)
 * Use for: system administration, user management, global settings
 */
const requireGlobalAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied: Global administrator privileges required.",
      code: "GLOBAL_ADMIN_REQUIRED"
    });
  }
  next();
};

/**
 * Require global user role (authenticated non-admin)
 * Use for: regular user routes that should block admins (rare)
 */
const requireGlobalUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({
      message: "Access denied: This action is restricted to regular users.",
      code: "GLOBAL_USER_REQUIRED"
    });
  }
  next();
};

/**
 * Require any authenticated user (admin or user)
 * Basic authentication check
 */
const requireAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

/**
 * Require team owner role (workspace-level)
 * Use for: team deletion, billing management, member removal
 */
const requireTeamOwner = (req, res, next) => {
  // Must have team context
  if (!req.user || !req.user.teamId) {
    return res.status(403).json({
      message: "Access denied: Team membership required.",
      code: "TEAM_MEMBERSHIP_REQUIRED"
    });
  }

  // Must be team owner
  if (req.user.teamRole !== "owner") {
    return res.status(403).json({
      message: "Access denied: Team owner privileges required.",
      code: "TEAM_OWNER_REQUIRED"
    });
  }

  next();
};

/**
 * Require team admin or owner role (workspace-level)
 * Use for: inviting members, team settings, moderate management
 */
const requireTeamAdminOrOwner = (req, res, next) => {
  // Must have team context
  if (!req.user || !req.user.teamId) {
    return res.status(403).json({
      message: "Access denied: Team membership required.",
      code: "TEAM_MEMBERSHIP_REQUIRED"
    });
  }

  // Must be admin or owner
  const allowedRoles = ["owner", "admin"];
  if (!allowedRoles.includes(req.user.teamRole)) {
    return res.status(403).json({
      message: "Access denied: Team admin or owner privileges required.",
      code: "TEAM_ADMIN_REQUIRED",
      currentRole: req.user.teamRole
    });
  }

  next();
};

/**
 * Require any team member (owner, admin, or member)
 * Use for: accessing team data, workspace features
 */
const requireTeamMember = (req, res, next) => {
  // Must have team context
  if (!req.user || !req.user.teamId) {
    return res.status(403).json({
      message: "Access denied: Team membership required.",
      code: "TEAM_MEMBERSHIP_REQUIRED"
    });
  }

  // Must have a valid team role
  const allowedRoles = ["owner", "admin", "member"];
  if (!allowedRoles.includes(req.user.teamRole)) {
    return res.status(403).json({
      message: "Access denied: Valid team membership required.",
      code: "INVALID_TEAM_ROLE"
    });
  }

  next();
};

module.exports = {
  requireGlobalAdmin,
  requireGlobalUser,
  requireAuthenticated,
  requireTeamOwner,
  requireTeamAdminOrOwner,
  requireTeamMember,
};
