const User = require("../models/User");
const { getIO } = require("../utils/socket");

const observeUserCredits = () => {
  try {
    const changeStream = User.watch(); // Watch all User changes

    changeStream.on("change", async (change) => {
      // Only process 'update' operations
      if (
        change.operationType === "update" &&
        change.updateDescription &&
        change.updateDescription.updatedFields
      ) {
        // Check if any updated field starts with 'credits'
        const updatedKeys = Object.keys(change.updateDescription.updatedFields);
        const hasCreditUpdate = updatedKeys.some((key) =>
          key.startsWith("credits")
        );

        if (!hasCreditUpdate) return; // Skip if no credit updates

        const userId = change.documentKey._id;

        try {
          // Fetch fresh user data to send complete credit details
          const user = await User.findById(userId).select("credits");
          if (!user) return;

          const io = getIO();
          if (io) {
            // Emit updated credits to the user's specific room
            io.to(`user_${userId.toString()}`).emit(
              "creditsUpdated",
              user.credits
            );
          }
        } catch (err) {
          console.error(
            "[UserObserver Inner Error] Failed to process change stream event:",
            err
          );
        }
      }
    });

    changeStream.on("error", (error) => {
      console.error("[UserObserver Error] Change stream error:", error);
    });

  } catch (error) {
    if (error.code === 40573 || error.message?.includes("replica set")) {
    } else {
      console.error(
        "Failed to start User Change Stream (is Replica Set running?):",
        error.message
      );
    }
  }
};

module.exports = observeUserCredits;
