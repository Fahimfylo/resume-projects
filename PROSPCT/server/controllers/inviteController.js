const Team = require("../models/Team");
const User = require("../models/User");
const { createRelationToken } = require("../utils/inviteToken");
const { createTransporter } = require("../utils/emailService");
const { getSetting } = require("../utils/systemSettings");

const INVITE_EXPIRY_HOURS = 24;

const inviteController = {
  /**
   * sendInvite
   * Adds a pending member to the team, sends email with encrypted link.
   * Only team owners or admins can send invites (enforced by requireTeamAdminOrOwner middleware).
   */
  sendInvite: async (req, res) => {
    try {
      const { email } = req.body;
      // Use authenticated user's ID as inviter - NOT workspaceOwner (permissions come from user, not data)
      const inviterId = req.user.userId;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const inviter = await User.findById(inviterId).select(
        "email firstName lastName company plan",
      );
      if (!inviter) {
        return res.status(404).json({ error: "Inviter not found" });
      }

      if (inviter.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: "You cannot invite yourself" });
      }

      // Find team where current user is owner or admin member
      // For owners: find team by owner field
      // For admins: find team by membership
      let team = await Team.findOne({
        $or: [
          { owner: inviterId },
          { "members.user": inviterId, "members.role": { $in: ["owner", "admin"] } }
        ]
      });
      if (!team) {
        const Plan = require("../models/Plans");
        const inviterPlan = inviter.plan ? await Plan.findById(inviter.plan).select("maxUsers") : null;
        team = await Team.create({
          owner: inviterId,
          name: `${inviter.company || inviter.firstName + "'s"} Workspace`,
          members: [],
          purchasedPlan: inviter.plan || null,
          maxUsers: inviterPlan?.maxUsers || 1,
        });
      }

      // Check if already pending/joined in THIS team first
      const existingMember = team.members.find(
        (m) => m.email === email.toLowerCase(),
      );

      if (existingMember) {
        if (existingMember.status === "joined") {
          return res.status(400).json({ error: "This user is already a team member" });
        }
        // Already pending — return existing token (resend scenario)
        const relationToken = createRelationToken(existingMember.email);
        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
        return res.status(200).json({
          message: "Invite already sent",
          relationToken,
          relationEmail: existingMember.email,
          workspaceName: team.name,
          inviteLink: `${frontendUrl}/register?relationToken=${relationToken}&relationEmail=${encodeURIComponent(existingMember.email)}`,
        });
      }

      // Only check User collection if NOT already a pending team member
      const existingUser = await User.findOne({ email: email.toLowerCase() }).select("_id email firstName lastName isVerified teamId");
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered" });
      }

      // Add pending member
      await team.addMember({
        email: email.toLowerCase(),
        firstName: "",
        lastName: "",
        company: inviter.company || "",
        role: "member",
        status: "pending",
      });
      await team.save();

      const member = team.members.find(
        (m) => m.email === email.toLowerCase(),
      );

      // Token is email-based (unique per team due to unique index)
      const relationToken = createRelationToken(member.email);
      const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const inviteLink = `${frontendUrl}/register?relationToken=${relationToken}&relationEmail=${encodeURIComponent(email.toLowerCase())}`;

      // Send email
      let emailSent = false;
      try {
        const transporter = await createTransporter();
        const fromAddress =
          (await getSetting("smtpFrom")) ||
          process.env.SMTP_FROM ||
          (process.env.SMTP_USER ? `"Prospct" <${process.env.SMTP_USER}>` : "");

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: `${inviter.firstName} ${inviter.lastName} invited you to join ${team.name} on Prospct`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>You're invited to Prospct</title>
              <style>
                body { margin: 0; padding: 0; background: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; }
                .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 36px 40px 28px; text-align: center; }
                .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 700; }
                .body { padding: 36px 40px; }
                .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
                .workspace { background: #f0f0ff; padding: 12px 20px; border-radius: 8px; margin: 16px 0; font-weight: 600; color: #6366f1; text-align: center; font-size: 18px; }
                .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 16px 0; }
                .note { font-size: 13px !important; color: #9ca3af !important; }
                .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="header">
                  <h1>Prospct</h1>
                  <p>You're Invited!</p>
                </div>
                <div class="body">
                  <p>Hi there,</p>
                  <p><strong>${inviter.firstName} ${inviter.lastName}</strong> has invited you to join their workspace on <strong>Prospct</strong>.</p>
                  <div class="workspace">${team.name}</div>
                  <p>Click the button below to create your account and join the workspace:</p>
                  <p style="text-align: center;">
                    <a href="${inviteLink}" class="btn">Join ${team.name}</a>
                  </p>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #6366f1; font-size: 13px;">${inviteLink}</p>
                  <p class="note">If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                  &copy; ${new Date().getFullYear()} Prospct. All rights reserved.
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("Failed to send invite email:", mailErr.message);
      }

      res.status(200).json({
        message: `Invite sent to ${email}`,
        relationToken,
        relationEmail: email.toLowerCase(),
        workspaceName: team.name,
        inviteLink,
        emailSent,
      });
    } catch (error) {
      console.error("sendInvite error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  /**
   * verifyInviteToken
   * Decrypts relationToken to get email, finds pending member in Team.
   */
  verifyInviteToken: async (req, res) => {
    try {
      const { relationToken } = req.body;

      if (!relationToken) {
        return res.status(400).json({ error: "Invite token is required" });
      }

      // Decrypt to get email (stored as token payload)
      let email;
      try {
        const payload = require("../utils/inviteToken").extractInviteId(relationToken);
        // payload is now the email string (we store email as the token content)
        email = typeof payload === "string" ? payload : payload.email || payload.inviteId;
      } catch (decryptErr) {
        console.error("Token decryption failed:", decryptErr.message);
        return res.status(400).json({ error: "Invalid or tampered invite token" });
      }

      if (!email) {
        return res.status(400).json({ error: "Invalid invite token" });
      }

      // Find team with this pending member
      const team = await Team.findOne({
        "members.email": email.toLowerCase(),
        "members.status": "pending",
      });

      if (!team) {
        return res.status(404).json({ error: "Invite not found" });
      }

      const member = team.members.find(
        (m) => m.email === email.toLowerCase() && m.status === "pending",
      );

      if (!member) {
        return res.status(404).json({ error: "Invite not found" });
      }

      // Check if invite has expired
      const invitedAt = member.joinedAt || team.createdAt;
      const expiryTime = invitedAt.getTime() + (INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
      if (Date.now() > expiryTime) {
        return res.status(410).json({ error: "Invite has expired" });
      }

      const inviter = await User.findById(team.owner).select(
        "firstName lastName email company",
      );

      res.status(200).json({
        valid: true,
        invitedBy: {
          firstName: inviter?.firstName,
          lastName: inviter?.lastName,
          email: inviter?.email,
          company: inviter?.company,
        },
        email: member.email,
        teamId: team._id,
      });
    } catch (error) {
      console.error("verifyInviteToken error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  /**
   * getInvites
   * Returns all pending and joined members from teams where user is owner or admin.
   */
  getInvites: async (req, res) => {
    try {
      // Find teams where current user is owner or has admin role
      const userId = req.user.userId;
      const team = await Team.findOne({
        $or: [
          { owner: userId },
          { "members.user": userId, "members.role": { $in: ["owner", "admin"] } }
        ]
      });

      if (!team) {
        return res.status(200).json({ invites: [] });
      }

      const invites = team.members
        .filter((m) => m.status === "pending")
        .sort((a, b) => (b.joinedAt || b.createdAt) - (a.joinedAt || a.createdAt))
        .map((m) => ({
          email: m.email,
          status: m.status,
          createdAt: m.joinedAt || team.createdAt,
        }));

      res.status(200).json({ invites });
    } catch (error) {
      console.error("getInvites error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  /**
   * revokeInvite
   * Removes a pending member from the team.
   * Only team owners can revoke invites (enforced by requireTeamOwner middleware).
   */
  revokeInvite: async (req, res) => {
    try {
      const { inviteId } = req.params;
      const userId = req.user.userId; // Use authenticated user's ID

      if (!inviteId || inviteId === "undefined") {
        return res.status(400).json({ error: "inviteId is required" });
      }

      // inviteId is the email in this new schema
      const email = inviteId;

      // Find team where user is the owner
      const team = await Team.findOne({ owner: userId });
      if (!team) {
        return res.status(404).json({ error: "Team not found or you are not the owner" });
      }

      const member = team.members.find((m) => m.email === email.toLowerCase());
      if (!member || member.status === "joined") {
        return res.status(404).json({ error: "Invite not found or already joined" });
      }

      team.removeMember(email);
      await team.save();

      res.status(200).json({ message: "Invite revoked" });
    } catch (error) {
      console.error("revokeInvite error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
};

module.exports = inviteController;
