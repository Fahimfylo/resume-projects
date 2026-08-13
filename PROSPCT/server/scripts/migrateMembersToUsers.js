/**
 * Migration Script: Member Collection -> User Collection
 *
 * Purpose: Migrate all documents from the Member collection into the User collection,
 * then remove all Member-based logic from the codebase.
 *
 * How to run:
 *   node server/scripts/migrateMembersToUsers.js
 *
 * What it does:
 *   1. Finds all Member documents
 *   2. For each member, creates a corresponding User document with:
 *      - role: "member"
 *      - teamRole: member.role ("member" | "admin")
 *      - invitedBy: member.owner
 *      - teamId: member.team
 *      - isVerified: true
 *      - credits: { all zeros }
 *      - plan: null
 *      - subscription: null
 *   3. Updates the Team.members[].user references to point to new User _id
 *   4. Reports results
 *
 * IMPORTANT: Run this script ONCE. Back up your database first.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Member = require("../models/Member");
const User = require("../models/User");
const Team = require("../models/Team");

async function migrate() {

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/prospct";
  await mongoose.connect(mongoUri);

  const members = await Member.find({}).populate("team owner");

  if (members.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const member of members) {
    try {
      const email = member.email.toLowerCase();

      // Check if a User with this email already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // Check if already migrated (has teamId)
        if (existingUser.teamId) {
          skipped++;
          continue;
        }

        // Update existing user with team context
        existingUser.role = "member";
        existingUser.teamRole = member.role || "member";
        existingUser.invitedBy = member.owner;
        existingUser.teamId = member.team._id;
        existingUser.isVerified = true;
        existingUser.credits = {
          emailCredits: { current: 0, max: 0 },
          phoneCredits: { current: 0, max: 0 },
          verificationCredits: { current: 0, max: 0 },
          exportCredits: { current: 0, max: 0 },
        };
        existingUser.plan = null;
        existingUser.subscription = null;
        await existingUser.save();

        // Update team member reference
        await Team.updateOne(
          { _id: member.team._id, "members.email": email },
          { $set: { "members.$.user": existingUser._id } }
        );

        migrated++;
        continue;
      }

      // Create new User document
      const newUser = new User({
        email,
        firstName: member.firstName,
        lastName: member.lastName,
        password: member.password, // Already hashed
        role: "member",
        teamRole: member.role || "member",
        invitedBy: member.owner,
        teamId: member.team._id,
        isVerified: true,
        credits: {
          emailCredits: { current: 0, max: 0 },
          phoneCredits: { current: 0, max: 0 },
          verificationCredits: { current: 0, max: 0 },
          exportCredits: { current: 0, max: 0 },
        },
        plan: null,
        subscription: null,
        createdAt: member.createdAt || new Date(),
      });

      await newUser.save();

      // Update team member reference to new User _id
      await Team.updateOne(
        { _id: member.team._id, "members.email": email },
        { $set: { "members.$.user": newUser._id } }
      );

      migrated++;
    } catch (err) {
      console.error(`[ERROR] Failed to migrate ${member.email}: ${err.message}`);
      errors++;
    }
  }


  if (errors === 0 && migrated > 0) {
  } else if (errors > 0) {
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
