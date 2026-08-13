// controllers/teamController.js
const Team = require("../models/Team");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const teamController = {
  // 1️⃣ Create a new team (standalone or team owners only)
  createTeam: async (req, res) => {
    try {
      // CRITICAL: Only standalone users or team owners can create teams
      // Team members (non-owners) CANNOT create their own teams
      const hasTeam = req.user.teamId;
      const isTeamOwner = req.user.teamRole === "owner";

      if (hasTeam && !isTeamOwner) {
        return res.status(403).json({
          error: "Access denied: Only team owners can create additional teams. Members cannot create teams.",
          code: "MEMBER_CREATE_TEAM_FORBIDDEN",
          currentRole: req.user.teamRole
        });
      }

      const { name } = req.body;
      if (!name)
        return res.status(400).json({ error: "Team name is required" });

      const team = await Team.create({
        owner: req.user.userId, // Creator becomes owner
        name,
        members: [],
      });

      // CRITICAL: Link the owner to the team
      // This sets User.teamId so authMiddleware can resolve teamRole from Team.members
      await User.findByIdAndUpdate(req.user.userId, {
        teamId: team._id,
        invitedBy: null, // Owner invited themselves (no inviter)
      });

      res.status(201).json({
        team,
        message: "Team created successfully",
        userRole: "owner"
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 1.5️⃣ Update team name (team owner or admin)
  updateTeamName: async (req, res) => {
    try {
      const { teamId } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Team name is required" });
      }

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Verify user is team owner OR has admin role
      const isTeamOwner = team.owner.toString() === req.user.userId.toString();
      const membership = team.members.find(m => m.user && m.user.toString() === req.user.userId.toString());
      const isTeamAdmin = membership?.role === "admin";

      if (!isTeamOwner && !isTeamAdmin) {
        return res.status(403).json({ 
          error: "Access denied: Only team owners or admins can rename the workspace.",
          code: "INSUFFICIENT_TEAM_ROLE"
        });
      }

      team.name = name.trim();
      await team.save();

      res.status(200).json({ message: "Workspace name updated", team });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 2️⃣ Generate Invite Link (team owner or admin)
  generateInviteLink: async (req, res) => {
    try {
      // CRITICAL: Only team owners or admins can generate invite links
      const allowedRoles = ["owner", "admin"];
      if (!allowedRoles.includes(req.user.teamRole)) {
        return res.status(403).json({
          error: "Access denied: Only team owners or admins can generate invite links.",
          code: "INSUFFICIENT_TEAM_ROLE",
          currentRole: req.user.teamRole,
          requiredRoles: allowedRoles
        });
      }

      const { teamId } = req.body;

      if (!teamId)
        return res.status(400).json({ error: "Team ID is required" });

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Verify user belongs to this team (is owner or member with admin role)
      const membership = team.members.find(m => m.user && m.user.toString() === req.user.userId.toString());
      const isTeamOwner = team.owner.toString() === req.user.userId.toString();

      if (!isTeamOwner && !membership) {
        return res.status(403).json({ error: "You are not authorized to invite members to this team" });
      }

      // Create JWT token with teamId
      const token = jwt.sign({ teamId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Build invite link
      const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
      const inviteLink = `${clientUrl}/team/join/${token}`;

      res.status(200).json({ inviteLink });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 3️⃣ Join team after clicking invite link
  joinTeam: async (req, res) => {
    try {
      const { token } = req.params;
      if (!token)
        return res.status(400).json({ error: "Invite token is required" });

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { teamId } = decoded;

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Check if user is already a member
      const existingMember = team.members.find(
        (m) => m.user?.toString() === req.user.userId.toString(),
      );

      if (existingMember) {
        return res
          .status(400)
          .json({ error: "You are already a member of this team" });
      }

      // Also check by email to prevent duplicates
      const memberUser = await User.findById(req.user.userId);
      const existingEmail = team.members.find(
        (m) => m.email?.toLowerCase() === memberUser.email.toLowerCase(),
      );

      if (existingEmail) {
        return res
          .status(400)
          .json({ error: "This email is already a member of this team" });
      }

      // Check seat availability before adding
      const canJoin = await team.canInviteMoreMembers();
      if (!canJoin) {
        return res
          .status(403)
          .json({ error: "Team member limit reached. No available seats." });
      }

      // Add user as member to team
      const newMember = {
        user: memberUser._id,
        firstName: memberUser.firstName,
        lastName: memberUser.lastName,
        company: memberUser.company,
        countryCode: memberUser.countryCode,
        email: memberUser.email,
        role: "member",
        status: "joined",
      };

      team.members.push(newMember);
      await team.save();

      // CRITICAL: Update User document to link to team
      // This is required for authMiddleware to recognize team membership
      // Note: teamRole is stored ONLY in Team.members (single source of truth)
      await User.findByIdAndUpdate(req.user.userId, {
        teamId: team._id,
        invitedBy: team.owner, // Track who invited them
        // teamRole is NOT stored here - it comes from Team.members
      });

      res.status(200).json({
        message: "Joined team successfully",
        team,
        userRole: "member",
        teamId: team._id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 4️⃣ Get all teams for logged-in user (owner or member)
  getUserTeams: async (req, res) => {
    try {
      // Query for teams where user is owner OR member
      const teams = await Team.find({
        $or: [
          { owner: req.user.userId },
          { "members.user": req.user.userId }
        ],
      })
        .populate(
          "members.user",
          "firstName lastName email company countryCode role",
        )
        .populate(
          "owner",
          "firstName lastName email company countryCode role",
        )
        .populate("purchasedPlan", "maxUsers name");

      // Backfill: if a team has no purchasedPlan but the owner has a plan, sync it
      let backfilled = false;
      for (const team of teams) {
        if (!team.purchasedPlan && team.owner) {
          const ownerId = typeof team.owner === 'object' ? team.owner._id : team.owner;
          const owner = await User.findById(ownerId).select('plan');
          if (owner && owner.plan) {
            team.purchasedPlan = owner.plan;
            // Also backfill maxUsers from the plan
            const Plan = require('../models/Plans');
            const ownerPlan = await Plan.findById(owner.plan).select('maxUsers');
            team.maxUsers = ownerPlan?.maxUsers || 1;
            await team.save();
            backfilled = true;
          }
        }
      }
      // Re-populate purchasedPlan if any teams were backfilled
      if (backfilled) {
        await Team.populate(teams, { path: "purchasedPlan", select: "maxUsers name" });
      }

      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 5️⃣ Remove a member from a team (team owner only)
  removeMember: async (req, res) => {
    try {
      // CRITICAL: Only team owners can remove members (admins cannot)
      if (req.user.teamRole !== "owner") {
        return res.status(403).json({
          error: "Access denied: Only team owners can remove members.",
          code: "TEAM_OWNER_REQUIRED",
          currentRole: req.user.teamRole
        });
      }

      const { teamId, memberId } = req.params;

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Verify user is the team owner
      if (team.owner.toString() !== req.user.userId.toString()) {
        return res
          .status(403)
          .json({ error: "Only the team owner can remove members" });
      }

      // memberId is now the email (URL-encoded)
      const email = decodeURIComponent(memberId).toLowerCase().trim();

      // Find the member to get their user ID before removing
      const member = team.members.find(
        (m) => m.email && m.email.toLowerCase().trim() === email,
      );
      const memberUserId = member?.user;

      // Remove member from team
      team.removeMember(email);
      await team.save();

      // Also delete the user from Users table if they exist
      if (memberUserId) {
        await User.findByIdAndDelete(memberUserId);
      }

      res.status(200).json({ message: "Member removed and user account deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 6️⃣ Remove all members from a team (team owner only)

  // 7️⃣ Update a member's role (team owner only)
  updateMemberRole: async (req, res) => {
    try {
      // Only team owners can update member roles
      if (req.user.teamRole !== "owner") {
        return res.status(403).json({
          error: "Access denied: Only team owners can update member roles.",
          code: "TEAM_OWNER_REQUIRED",
          currentRole: req.user.teamRole
        });
      }

      const { teamId } = req.params;
      const { memberId, newRole } = req.body;

      if (!memberId || !newRole) {
        return res.status(400).json({ error: "memberId and newRole are required" });
      }

      const allowedRoles = ["admin", "member"];
      if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Verify user is the team owner
      if (team.owner.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ error: "Only the team owner can update member roles" });
      }

      // Find the member
      const member = team.members.find(m => m.user && m.user.toString() === memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found in team" });
      }

      // Prevent changing owner's role
      if (member.user.toString() === team.owner.toString()) {
        return res.status(400).json({ error: "Cannot change the owner's role" });
      }

      member.role = newRole;
      await team.save();

      res.status(200).json({ message: "Member role updated successfully", member });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  removeAllMembers: async (req, res) => {
    try {
      // CRITICAL: Only team owners can remove members
      if (req.user.teamRole !== "owner") {
        return res.status(403).json({
          error: "Access denied: Only team owners can remove members.",
          code: "TEAM_OWNER_REQUIRED",
          currentRole: req.user.teamRole
        });
      }

      const { teamId } = req.params;

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Verify user is the team owner
      if (team.owner.toString() !== req.user.userId.toString()) {
        return res
          .status(403)
          .json({ error: "Only the team owner can remove members" });
      }

      // Get all member user IDs before removing
      const memberUserIds = team.members
        .filter(m => m.user)
        .map(m => m.user);

      // Delete all member users from Users table
      if (memberUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: memberUserIds } });
      }

      team.removeAllMembers();
      await team.save();

      res.status(200).json({ message: "All members removed and user accounts deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 8️⃣ Leave the team (member only)
  leaveTeam: async (req, res) => {
    try {
      const userId = req.user.userId;
      const email = req.user.email?.toLowerCase();

      // Ensure user is a member and not owner
      if (!req.user.teamId) {
        return res.status(400).json({ error: "User is not part of any team" });
      }
      if (req.user.teamRole === "owner") {
        return res.status(403).json({ error: "Team owners cannot leave their own team" });
      }

      // Find the team
      const team = await Team.findById(req.user.teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Remove member from team
      if (email) {
        team.removeMember(email);
        await team.save();
      }

      // Delete user account
      await User.findByIdAndDelete(userId);

      res.status(200).json({ message: "Left team and account deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = teamController;
