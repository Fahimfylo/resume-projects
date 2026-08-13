/**
 * Workspace Context Middleware
 *
 * Determines the workspace owner context for every authenticated request.
 * Requires authMiddleware to run first (sets req.user with teamId, invitedBy, etc.).
 *
 * Rules:
 *   - If user.teamId exists: req.workspaceOwner = user.invitedBy (the owner who invited them)
 *   - Else: req.workspaceOwner = user._id (standalone or workspace owner)
 *
 * Sets on req:
 *   - workspaceOwner: ObjectId to use for ALL data queries
 *   - teamId: current team _id or null
 *   - isWorkspaceOwner: boolean
 *   - userRole: effective role in workspace ("owner" | "admin" | "member")
 *
 * Usage:
 *   router.get("/data", authMiddleware, workspaceContextMiddleware, handler);
 *
 * In handlers, ALWAYS use:
 *   const data = await Model.find({ owner: req.workspaceOwner });
 */
const workspaceContextMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { userId, teamId, teamRole, invitedBy, isWorkspaceOwner } = req.user;

    if (teamId) {
      // Team member: workspace owner is the person who invited them
      req.workspaceOwner = invitedBy || userId;
      req.teamId = teamId;
      req.isWorkspaceOwner = isWorkspaceOwner;
      req.userRole = isWorkspaceOwner ? "owner" : (teamRole || "member");
    } else {
      // Standalone user or workspace owner: they are their own workspace owner
      req.workspaceOwner = userId;
      req.teamId = null;
      req.isWorkspaceOwner = true;
      req.userRole = "owner";
    }

    next();
  } catch (error) {
    console.error("workspaceContextMiddleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = workspaceContextMiddleware;
