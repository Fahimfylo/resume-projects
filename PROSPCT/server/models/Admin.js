const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    default: "+1",
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    minlength: 8,
  },
  profilePicture: {
    type: String,
  },
  token: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    default: "admin", // or define your roles here
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
