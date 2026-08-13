const Team = require("../models/Team");
const User = require("../models/User");
const creditManager = require("../utils/creditManager");

/**
 * Permission Guard Middleware
 *
 * Restricts actions based on user role within the workspace.
 * Usage: app.post("/api/team/delete", authMiddleware, workspaceContextMiddleware, requireRole("owner"), controller);
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

/**
 * Example Protected Controller
 *
 * Demonstrates proper team-based data access using workspaceOwner pattern.
 *
 * KEY PRINCIPLE:
 *   ALWAYS use req.workspaceOwner (not req.user.userId) for data queries.
 *   This ensures both owners and members access the same workspace data.
 */
const exampleController = {
  /**
   * Get workspace resources (e.g., leads, contacts, credits)
   * Both owners and members see the SAME data.
   */
  getWorkspaceData: async (req, res) => {
    try {
      // ALWAYS use req.workspaceOwner for data queries
      const ownerId = req.workspaceOwner;

      // Example: Fetch resources owned by the workspace
      // const leads = await Lead.find({ owner: ownerId });
      // const contacts = await Contact.find({ owner: ownerId });

      res.status(200).json({
        message: "Workspace data retrieved successfully",
        workspaceOwner: ownerId,
        teamId: req.teamId,
        isOwner: req.isWorkspaceOwner,
        // leads,
        // contacts,
      });
    } catch (error) {
      console.error("getWorkspaceData error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * Create a resource in the workspace
   * Members and owners can both create resources.
   */
  createResource: async (req, res) => {
    try {
      const { name, data } = req.body;
      const ownerId = req.workspaceOwner;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Example: Create resource with workspace owner
      // const newResource = await Resource.create({
      //   name,
      //   data,
      //   owner: ownerId,  // Always use workspaceOwner!
      //   createdBy: req.user.userId, // Track who actually created it
      // });

      res.status(201).json({
        message: "Resource created successfully",
        // resource: newResource,
      });
    } catch (error) {
      console.error("createResource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * Delete a resource - OWNER ONLY
   * Members cannot delete workspace resources.
   */
  deleteResource: async (req, res) => {
    try {
      // This route should also use requireRole("owner") middleware
      const ownerId = req.workspaceOwner;
      const { resourceId } = req.params;

      // Example: Delete resource
      // const resource = await Resource.findOneAndDelete({
      //   _id: resourceId,
      //   owner: ownerId,  // Always scope to workspace owner
      // });

      // if (!resource) {
      //   return res.status(404).json({ message: "Resource not found" });
      // }

      res.status(200).json({
        message: "Resource deleted successfully",
      });
    } catch (error) {
      console.error("deleteResource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * Get workspace info (team details, members, etc.)
   */
  getWorkspaceInfo: async (req, res) => {
    try {
      const ownerId = req.workspaceOwner;

      if (!req.teamId) {
        return res.status(200).json({
          hasTeam: false,
          isOwner: true,
        });
      }

      const team = await Team.findById(req.teamId)
        .select("name owner members createdAt")
        .populate("owner", "firstName lastName email")
        .populate("members.user", "firstName lastName email");

      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      res.status(200).json({
        hasTeam: true,
        team: {
          id: team._id,
          name: team.name,
          owner: team.owner,
          members: team.members.map((m) => ({
            user: m.user,
            email: m.email,
            firstName: m.firstName,
            lastName: m.lastName,
            role: m.role,
            status: m.status,
            joinedAt: m.joinedAt,
          })),
          createdAt: team.createdAt,
        },
        currentUserRole: req.userRole,
        isOwner: req.isWorkspaceOwner,
      });
    } catch (error) {
      console.error("getWorkspaceInfo error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * Get credits for the workspace
   * Members see the OWNER's credits, not their own.
   */
  getWorkspaceCredits: async (req, res) => {
    try {
      const creditData = await creditManager.getCredits(req.workspaceOwner);

      if (!creditData) {
        return res.status(404).json({ message: "Workspace owner not found" });
      }

      res.status(200).json({
        credits: creditData.credits,
        plan: creditData.plan,
        isOwner: req.isWorkspaceOwner,
      });
    } catch (error) {
      console.error("getWorkspaceCredits error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * Example: Use credits (always deducts from workspace owner)
   */
  useCredits: async (req, res) => {
    try {
      const { creditType, amount } = req.body;

      if (!creditType || !amount) {
        return res.status(400).json({ message: "creditType and amount are required" });
      }

      // Deduct from workspace owner (NOT the member)
      const result = await creditManager.deduct(req.workspaceOwner, creditType, amount);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({
        message: `${amount} ${creditType} credit(s) deducted`,
        remaining: result.remaining,
      });
    } catch (error) {
      console.error("useCredits error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = { exampleController, requireRole };
