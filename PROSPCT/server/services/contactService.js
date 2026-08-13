const { getSetting } = require("../utils/systemSettings");

/**
 * Sends a custom plan request email.
 * @param {string} to - Recipient email address (support email)
 * @param {Object} formData - Form data from the contact form
 * @param {string} formData.name - User's name
 * @param {string} formData.email - User's email
 * @param {string} formData.description - Plan description
 * @param {Object} formData.features - Required features
 * @param {Object} formData.pricing - Pricing expectations
 * @param {string} formData.notes - Additional notes
 */
const sendCustomPlanRequestEmail = async (to, formData) => {

  const { createTransporter } = require("../utils/emailService");

  const transporter = await createTransporter();

  const fromAddress =
    (await getSetting("smtpFrom")) ||
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `"Prospct" <${process.env.SMTP_USER}>`
      : "noreply@prospct.com");

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const assignPlanUrl = `${clientUrl}/admin/plans/add?type=custom&assignedEmail=${encodeURIComponent(formData.email)}`;


  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body { margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { max-width: 600px; margin: 48px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { padding: 40px 40px 20px; text-align: left; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); }
        .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
        .body { padding: 40px; }
        .body p { color: #4b5563; font-size: 16px; line-height: 24px; margin: 16px 0; }
        .section { margin: 24px 0; }
        .section-title { color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #3B82F6; }
        .info-box { background-color: #eff6ff; padding: 16px; border-left: 4px solid #3B82F6; border-radius: 4px; margin: 16px 0; }
        .info-label { font-size: 13px; color: #6b7280; font-weight: 600; margin: 0 0 4px 0; }
        .info-value { font-size: 15px; color: #111827; margin: 0; }
        .feature-list { list-style: none; padding: 0; margin: 0; }
        .feature-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
        .feature-list li:last-child { border-bottom: none; }
        .divider { height: 1px; background-color: #e5e7eb; margin: 32px 0; }
        .footer { padding: 0 40px 40px; text-align: left; background-color: #f9fafb; }
        .footer-text { font-size: 13px; color: #9ca3af; line-height: 20px; }
        .btn-container { margin: 24px 0; text-align: center; }
        .btn {
          display: inline-block;
          background-color: #3B82F6;
          color: #ffffff !important;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Custom Plan Request</h1>
        </div>

        <div class="body">
          <p>A new custom plan request has been submitted. Here are the details:</p>

          <div class="info-box">
            <p class="info-label">FROM</p>
            <p class="info-value">${formData.name} &lt;${formData.email}&gt;</p>
          </div>

          <div class="section">
            <h2 class="section-title">Plan Description</h2>
            <p>${formData.description || "No description provided"}</p>
          </div>

          <div class="section">
            <h2 class="section-title">Features Required</h2>
            <ul class="feature-list">
              <li>• Email Credits: ${formData.features?.emailCredits || "Not specified"}</li>
              <li>• Phone Credits: ${formData.features?.phoneCredits || "Not specified"}</li>
              <li>• Verification Credits: ${formData.features?.verificationCredits || "Not specified"}</li>
              <li>• Export Credits: ${formData.features?.exportCredits || "Not specified"}</li>
              <li>• Additional Features: ${formData.features?.additional || "None"}</li>
            </ul>
          </div>

          <div class="section">
            <h2 class="section-title">Pricing Expectations</h2>
            <div class="info-box">
              <p class="info-label">Monthly Budget</p>
              <p class="info-value">$${formData.pricing?.monthlyBudget || "Not specified"}</p>
            </div>
            <div class="info-box">
              <p class="info-label">Yearly Budget</p>
              <p class="info-value">$${formData.pricing?.yearlyBudget || "Not specified"}</p>
            </div>
            <div class="info-box">
              <p class="info-label">Preferred Duration</p>
              <p class="info-value">${formData.pricing?.duration || "Not specified"}</p>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Additional Notes</h2>
            <p>${formData.notes || "No additional notes"}</p>
          </div>

          <div class="divider"></div>

          <p style="font-size: 13px; color: #9ca3af;">
            This request was submitted on ${new Date().toLocaleString()}.
          </p>

          <div class="divider"></div>

          <div class="btn-container">
            <a href="${assignPlanUrl}" class="btn">Assign Plan</a>
          </div>

          <p style="font-size: 13px; color: #9ca3af; text-align: center;">
            Clicking the button above will open the custom plan creation page with the requester's email pre-selected for assignment.
          </p>
        </div>

        <div class="footer">
          <p class="footer-text">
            &copy; ${new Date().getFullYear()} Prospct Inc. <br />
            Rajshahi, Bangladesh.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromAddress,
    to,
    subject: `Custom Plan Request from ${formData.name}`,
    html: htmlContent,
  };



  try {
    const info = await transporter.sendMail(mailOptions);
    
    
    return info;
  } catch (error) {
    console.error("\n❌ EMAIL SEND FAILED!");
    console.error("   ├─ Error Code:", error.code);
    console.error("   ├─ Error Message:", error.message);
    throw error;
  }
};

module.exports = {
  sendCustomPlanRequestEmail,
};
