/**
 * Permission Middleware for Multi-Tenant Workspace
 *
 * Reusable guards for role-based access control.
 * Must be used AFTER authMiddleware and workspaceContextMiddleware.
 *
 * Usage:
 *   router.delete("/team", authMiddleware, workspaceContextMiddleware, requireOwner, handler);
 *   router.post("/member", authMiddleware, workspaceContextMiddleware, requireTeamRole("owner", "admin"), handler);
 */

/**
 * Only the workspace owner can proceed.
 */
const requireOwner = (req, res, next) => {
  if (!req.isWorkspaceOwner) {
    return res.status(403).json({ message: "Only the workspace owner can perform this action." });
  }
  next();
};

/**
 * Allow specific team roles. Pass allowed roles as arguments.
 *
 * Examples:
 *   requireTeamRole("owner")           - only owner
 *   requireTeamRole("owner", "admin")  - owner or admin
 *   requireTeamRole("owner", "admin", "member") - any team member
 */
const requireTeamRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: `This action requires one of: ${allowedRoles.join(", ")}.`,
      });
    }
    next();
  };
};

/**
 * Allow any authenticated user who has a workspace context.
 * Blocks standalone users from accessing team-specific routes.
 */
const requireTeamMember = (req, res, next) => {
  if (!req.user.teamId) {
    return res.status(403).json({ message: "Team membership required." });
  }
  next();
};

/**
 * Allow only standalone users or workspace owners (no team members).
 * Useful for routes that should NOT be accessible by team members
 * (e.g., personal billing, subscription management).
 */
const requireStandaloneOrOwner = (req, res, next) => {
  if (req.user.teamId && !req.isWorkspaceOwner) {
    return res.status(403).json({ message: "This action is not available for team members." });
  }
  next();
};

/**
 * Allow workspace owners and admins only.
 * Future-ready for admin role support within teams.
 */
const requireAdminOrOwner = (req, res, next) => {
  if (!req.userRole || !["owner", "admin"].includes(req.userRole)) {
    return res.status(403).json({ message: "This action requires owner or admin privileges." });
  }
  next();
};

/**
 * STRICT: Only standalone users or workspace owners can proceed.
 * Team members (invited users) are explicitly blocked.
 * Use for: team creation, sending invites, billing management.
 */
const requireOwnerOnly = (req, res, next) => {
  // Block 1: Must be authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  // Block 2: Team members cannot perform owner actions
  if (req.user.teamId && !req.isWorkspaceOwner) {
    return res.status(403).json({
      message: "Access denied: This action is restricted to workspace owners only.",
      code: "MEMBER_ACTION_FORBIDDEN"
    });
  }

  // Block 3: Pending invitations cannot perform actions
  if (req.user.teamId && req.user.teamRole === null) {
    return res.status(403).json({
      message: "Access denied: Pending invitations cannot perform this action.",
      code: "PENDING_MEMBER_FORBIDDEN"
    });
  }

  next();
};

module.exports = { requireOwner, requireTeamRole, requireTeamMember, requireStandaloneOrOwner, requireAdminOrOwner, requireOwnerOnly };
