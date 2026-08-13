const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminController = {
  // ===============================
  // ADD NEW ADMIN
  // ===============================
  addAdmin: async (req, res) => {
    const {
      email,
      password,
      firstName,
      lastName,
      countryCode,
      role = "admin",
    } = req.body;

    try {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Validate and auto-format countryCode
      let formattedCountryCode = (countryCode || "").trim();
      if (formattedCountryCode) {
        if (!formattedCountryCode.startsWith("+")) formattedCountryCode = "+" + formattedCountryCode;
        if (!/^\+\d{1,3}$/.test(formattedCountryCode)) {
          return res.status(400).json({ 
            success: false,
            message: "Invalid country code format. Please use format like +1, +880, etc." 
          });
        }
      }

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = new Admin({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        countryCode: formattedCountryCode || "+1",
        role,
      });

      await newAdmin.save();

      res.status(201).json({
        success: true,
        message: "Admin added successfully",
      });
    } catch (error) {
      console.error("Add admin error:", error);
      res.status(500).json({
        success: false,
        message: "Error adding admin",
      });
    }
  },

  // ===============================
  // ADMIN LOGIN (FIXED)
  // ===============================
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // 🔐 PASSWORD CHECK (THIS WAS MISSING BEFORE)
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const adminAccessToken = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "8d" },
      );

      res.status(200).json({
        success: true,
        message: "Admin login successful",
        adminAccessToken,
        admin: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during admin login",
      });
    }
  },

  // ===============================
  // GET ALL ADMINS (PAGINATION)
  // ===============================
  getAllAdmins: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const skip = (page - 1) * limit;

      const admins = await Admin.find()
        .select("-password")
        .skip(skip)
        .limit(limit);

      const totalCount = await Admin.countDocuments();

      res.status(200).json({
        success: true,
        admins,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Fetch admins error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admins",
      });
    }
  },

  // ===============================
  // SEARCH ADMIN
  // ===============================
  getAdminBySearch: async (req, res) => {
    try {
      const { id, email, firstName, lastName, role } = req.query;

      if (!id && !email && !firstName && !lastName && !role) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one search parameter",
        });
      }

      const query = {};
      if (id) query._id = id;
      if (email) query.email = email;
      if (firstName) query.firstName = { $regex: firstName, $options: "i" };
      if (lastName) query.lastName = { $regex: lastName, $options: "i" };
      if (role) query.role = role;

      const admin = await Admin.findOne(query).select("-password");

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error("Search admin error:", error);
      res.status(500).json({
        success: false,
        message: "Error searching admin",
      });
    }
  },

  getAdminById: async (req, res) => {
    try {
      const { adminId } = req.params;
      const admin = await Admin.findById(adminId).select("-password");

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error("Fetch admin error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admin",
      });
    }
  },

  // ===============================
  // UPDATE ADMIN (SAFE FIELDS ONLY)
  // ===============================
  updateAdmin: async (req, res) => {
    try {
      const { adminId } = req.params;

      const allowedUpdates = [
        "firstName",
        "lastName",
        "countryCode",
        "profilePicture",
      ];
      const updates = {};

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          // Validate and auto-format countryCode
          if (field === "countryCode") {
            let cc = (req.body[field] || "").trim();
            if (cc) {
              if (!cc.startsWith("+")) cc = "+" + cc;
              if (!/^\+\d{1,3}$/.test(cc)) {
                return res.status(400).json({
                  success: false,
                  message: "Invalid country code format. Please use format like +1, +880, etc."
                });
              }
            }
            updates[field] = cc;
          } else {
            updates[field] = req.body[field];
          }
        }
      });

      const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates, {
        new: true,
      }).select("-password");

      if (!updatedAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        admin: updatedAdmin,
      });
    } catch (error) {
      console.error("Update admin error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating admin",
      });
    }
  },

  // ===============================
  // DELETE ADMIN
  // ===============================
  deleteAdmin: async (req, res) => {
    try {
      const { adminId } = req.params;

      const deletedAdmin = await Admin.findByIdAndDelete(adminId);

      if (!deletedAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting admin",
      });
    }
  },

  // ===============================
  // DELETE ALL ADMINS
  // ===============================
  deleteAllAdmins: async (req, res) => {
    try {
      await Admin.deleteMany({});
      res.status(200).json({
        success: true,
        message: "All admins deleted successfully",
      });
    } catch (error) {
      console.error("Delete all admins error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting admins",
      });
    }
  },

  // ===============================
  // Teams (Admin)
  // ===============================
  getAllTeams: async (req, res) => {
    try {
      const Team = require('../models/Team');
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const teams = await Team.find()
        .populate('owner', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email')
        .populate('purchasedPlan')
        .skip(skip)
        .limit(parseInt(limit, 10))
        .sort({ createdAt: -1 });

      const totalCount = await Team.countDocuments();

      res.status(200).json({ success: true, teams, totalCount });
    } catch (error) {
      console.error('getAllTeams error', error);
      res.status(500).json({ success: false, message: 'Error fetching teams' });
    }
  },

  getTeamByOwner: async (req, res) => {
    try {
      const Team = require('../models/Team');
      const { ownerId } = req.params;
      if (!ownerId) return res.status(400).json({ success: false, message: 'ownerId required' });

      const team = await Team.findOne({ owner: ownerId })
        .populate('owner', 'firstName lastName email')
        .populate('members.user', 'firstName lastName email')
        .populate('purchasedPlan');

      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      res.status(200).json({ success: true, team });
    } catch (error) {
      console.error('getTeamByOwner error', error);
      res.status(500).json({ success: false, message: 'Error fetching team' });
    }
  },

  deleteTeam: async (req, res) => {
    try {
      const Team = require('../models/Team');
      const User = require('../models/User');
      const { teamId } = req.params;
      if (!teamId) return res.status(400).json({ success: false, message: 'teamId required' });

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      // Collect member user ids to delete (exclude owner)
      const memberUserIds = team.members.filter(m => m.user).map(m => m.user.toString());

      await Team.findByIdAndDelete(teamId);

      // Delete member user accounts (but do not delete owner)
      for (const uid of memberUserIds) {
        if (uid !== team.owner.toString()) {
          await User.findByIdAndDelete(uid).catch(() => null);
        }
      }

      res.status(200).json({ success: true, message: 'Team deleted' });
    } catch (error) {
      console.error('deleteTeam error', error);
      res.status(500).json({ success: false, message: 'Error deleting team' });
    }
  },

  deleteTeamMember: async (req, res) => {
    try {
      const Team = require('../models/Team');
      const User = require('../models/User');
      const { teamId, memberEmail } = req.params;
      if (!teamId || !memberEmail) return res.status(400).json({ success: false, message: 'teamId and memberEmail required' });

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

      const email = decodeURIComponent(memberEmail).toLowerCase();
      const member = team.members.find(m => m.email === email);
      if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

      const memberUserId = member.user;
      team.removeMember(email);
      await team.save();

      if (memberUserId) {
        await User.findByIdAndDelete(memberUserId).catch(() => null);
      }

      res.status(200).json({ success: true, message: 'Member removed' });
    } catch (error) {
      console.error('deleteTeamMember error', error);
      res.status(500).json({ success: false, message: 'Error removing member' });
    }
  },
};

module.exports = adminController;
