const jwt = require("jsonwebtoken");
const Member = require("../models/Member");
const User = require("../models/User");

/**
 * ⚠️ DEPRECATED: This middleware references the legacy Member model.
 * The multi-tenant system now uses authMiddleware + workspaceContextMiddleware
 * which handles both owners and team members through the User model.
 * Do NOT use this middleware for new routes.
 *
 * Auth middleware for team members.
 * Verifies the JWT and ensures the member exists and is active.
 * Attaches member + owner info to req.user for resource access.
 */
const memberAuthMiddleware = async (req, res, next) => {
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

    // Must be a member token
    if (!decoded.isMember || !decoded.memberId) {
      return res.status(403).json({ message: "Member access required" });
    }

    // Verify member still exists and is active
    const member = await Member.findById(decoded.memberId)
      .select("_id email firstName lastName role status team owner")
      .populate("team owner");

    if (!member) {
      return res.status(401).json({ message: "Member account not found" });
    }

    if (member.status !== "active") {
      return res.status(403).json({ message: `Member account is ${member.status}` });
    }

    // Verify owner still exists
    const owner = await User.findById(decoded.userId).select("_id email");
    if (!owner) {
      return res.status(401).json({ message: "Team owner account not found" });
    }

    // Attach info for resource access
    req.user = {
      _id: member._id,
      memberId: member._id,
      userId: owner._id, // Owner's ID for resource access
      teamId: member.team._id,
      role: member.role,
      isMember: true,
      owner: {
        _id: owner._id,
        email: owner.email,
      },
    };

    next();
  } catch (error) {
    console.error("Member auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = memberAuthMiddleware;
