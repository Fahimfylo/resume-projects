const { sendCustomPlanRequestEmail } = require("../services/contactService");
const { getSetting } = require("../utils/systemSettings");

/**
 * Controller for handling contact form submissions
 */
const sendCustomPlanRequest = async (req, res) => {
  try {
    const { name, email, description, features, pricing, notes } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Get receiver email from system settings
    const receiverEmail = await getSetting("receiverEmail");

    // Prepare form data
    const formData = {
      name,
      email,
      description,
      features: features || {},
      pricing: pricing || {},
      notes,
    };

    // Send email
    await sendCustomPlanRequestEmail(receiverEmail, formData);

    res.status(200).json({
      success: true,
      message: "Custom plan request sent successfully",
    });
  } catch (error) {
    console.error("Error sending custom plan request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send custom plan request",
      error: error.message,
    });
  }
};

module.exports = {
  sendCustomPlanRequest,
};
