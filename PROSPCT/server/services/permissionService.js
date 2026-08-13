/**
 * Permission Service - Centralized RBAC Resolution
 *
 * SINGLE SOURCE OF TRUTH for all permission checks.
 *
 * Role Sources:
 * - Global Role: User.role ("admin" | "user")
 * - Team Role: Team.members.role ("owner" | "admin" | "member")
 *
 * NO role duplication in User collection.
 * NO cached roles. Fresh database lookup every time.
 */

const User = require("../models/User");
const Team = require("../models/Team");

/**
 * Resolve user permissions for a specific context
 * @param {string} userId - The user ID to resolve permissions for
 * @param {string|null} teamId - Optional team context (null for standalone)
 * @returns {Promise<Object>} Resolved permissions
 */
const resolveUserPermissions = async (userId, teamId = null) => {
  // Fetch user with minimal fields
  const user = await User.findById(userId).select("_id email role isBlocked");

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isBlocked) {
    throw new Error("User account is blocked");
  }

  // Base permission object
  const permissions = {
    // Identity
    userId: user._id,
    email: user.email,

    // Global role (from User collection)
    globalRole: user.role || "user",
    isGlobalAdmin: user.role === "admin",

    // Team context (from Team.members - SINGLE SOURCE OF TRUTH)
    teamId: null,
    teamRole: null,
    membershipStatus: null,

    // Computed flags
    isTeamOwner: false,
    isTeamAdmin: false,
    isTeamMember: false,
    canInvite: false,
    canManageBilling: false,
    canRemoveMembers: false,
    canDeleteTeam: false,
  };

  // If teamId provided, resolve team-specific permissions
  if (teamId) {
    const team = await Team.findById(teamId).select("_id owner members");

    if (team) {
      // Check if user is the team owner
      const isOwner = team.owner.toString() === userId.toString();

      if (isOwner) {
        permissions.teamId = team._id;
        permissions.teamRole = "owner";
        permissions.membershipStatus = "joined";
        permissions.isTeamOwner = true;
        permissions.isTeamAdmin = false;
        permissions.isTeamMember = true;
        permissions.canInvite = true;
        permissions.canManageBilling = true;
        permissions.canRemoveMembers = true;
        permissions.canDeleteTeam = true;
      } else {
        // Check membership in Team.members (SOURCE OF TRUTH)
        const membership = team.members.find(
          (m) => m.user && m.user.toString() === userId.toString()
        );

        if (membership && membership.status === "joined") {
          permissions.teamId = team._id;
          permissions.teamRole = membership.role; // "admin" or "member"
          permissions.membershipStatus = membership.status;
          permissions.isTeamOwner = false;
          permissions.isTeamAdmin = membership.role === "admin";
          permissions.isTeamMember = true;
          permissions.canInvite = membership.role === "owner" || membership.role === "admin";
          permissions.canManageBilling = false; // Only owners can manage billing
          permissions.canRemoveMembers = false; // Only owners can remove members
          permissions.canDeleteTeam = false; // Only owners can delete team
        }
        // If no membership or status !== "joined", user has no team access
      }
    }
  } else {
    // No teamId provided - check if user is a team owner (owner may have missing teamId)
    const ownedTeam = await Team.findOne({ owner: userId }).select("_id owner members");
    if (ownedTeam) {
      permissions.teamId = ownedTeam._id;
      permissions.teamRole = "owner";
      permissions.membershipStatus = "joined";
      permissions.isTeamOwner = true;
      permissions.isTeamAdmin = false;
      permissions.isTeamMember = true;
      permissions.canInvite = true;
      permissions.canManageBilling = true;
      permissions.canRemoveMembers = true;
      permissions.canDeleteTeam = true;
    }
  }

  return permissions;
};

/**
 * Get team role for a user (convenience function)
 * Returns null if not a member or not joined
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<string|null>} "owner" | "admin" | "member" | null
 */
const getTeamRole = async (userId, teamId) => {
  const team = await Team.findById(teamId).select("owner members");

  if (!team) return null;

  // Check if owner
  if (team.owner.toString() === userId.toString()) {
    return "owner";
  }

  // Check membership
  const membership = team.members.find(
    (m) => m.user && m.user.toString() === userId.toString() && m.status === "joined"
  );

  return membership ? membership.role : null;
};

/**
 * Check if user has specific permission
 * @param {Object} permissions - Result from resolveUserPermissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (permissions, permission) => {
  const permissionMap = {
    // Global permissions
    "global:admin": permissions.isGlobalAdmin,
    "global:user": permissions.globalRole === "user",

    // Team permissions
    "team:owner": permissions.isTeamOwner,
    "team:admin": permissions.isTeamAdmin || permissions.isTeamOwner, // Owner can do admin things
    "team:member": permissions.isTeamMember,
    "team:any": permissions.teamRole !== null,

    // Action permissions
    "action:invite": permissions.canInvite,
    "action:billing": permissions.canManageBilling,
    "action:remove_member": permissions.canRemoveMembers,
    "action:delete_team": permissions.canDeleteTeam,
    "action:manage_team": permissions.isTeamOwner || permissions.isTeamAdmin,
  };

  return permissionMap[permission] || false;
};

/**
 * Verify team membership with strict status check
 * Throws if not a valid joined member
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<Object>} Membership info
 */
const verifyTeamMembership = async (userId, teamId) => {
  const team = await Team.findById(teamId).select("owner members");

  if (!team) {
    throw new Error("Team not found");
  }

  // Check if owner
  if (team.owner.toString() === userId.toString()) {
    return {
      role: "owner",
      status: "joined",
      isOwner: true,
    };
  }

  // Check membership with STRICT status check
  const membership = team.members.find(
    (m) => m.user && m.user.toString() === userId.toString()
  );

  if (!membership) {
    throw new Error("Not a team member");
  }

  if (membership.status !== "joined") {
    throw new Error(`Membership status is ${membership.status}, not joined`);
  }

  return {
    role: membership.role,
    status: membership.status,
    isOwner: false,
  };
};

module.exports = {
  resolveUserPermissions,
  getTeamRole,
  hasPermission,
  verifyTeamMembership,
};
