const nodemailer = require("nodemailer");
const { getSetting } = require("./systemSettings");

/**
 * Creates and returns a configured Nodemailer transporter.
 * Reads credentials from system settings if available, falling back to env vars.
 */
const createTransporter = async () => {
  
  const host = (await getSetting("smtpHost")) || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number((await getSetting("smtpPort")) || process.env.SMTP_PORT) || 587;
  const secureSetting = await getSetting("smtpSecure");
  // For Gmail: port 465 uses secure: true (SSL), port 587 uses secure: false (STARTTLS)
  const secure =
    typeof secureSetting === "boolean"
      ? secureSetting
      : process.env.SMTP_SECURE === "true" || port === 465;
  const user = (await getSetting("smtpUser")) || process.env.SMTP_USER;
  const pass = (await getSetting("smtpPass")) || process.env.SMTP_PASS;


  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

/**
 * Sends an OTP verification email to the specified address.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} firstName - Recipient's first name for personalization
 */
const sendOtpEmail = async (to, otp, firstName) => {
  try {
    const transporter = await createTransporter();

    const fromAddress =
      (await getSetting("smtpFrom")) ||
      (process.env.SMTP_FROM ||
        (process.env.SMTP_USER ? `"Prospct" <${process.env.SMTP_USER}>` : ""));
    

    const mailOptions = {
      from: fromAddress,
      to,
      replyTo: "support@prospct.io",
      subject: "Verify your Prospct account",
      text: `Hi ${firstName || "there"},

Thanks for signing up! Use this code to verify your email address:

${otp}

This code expires in 10 minutes.

If you didn't create a Prospct account, you can safely ignore this email.

© ${new Date().getFullYear()} Prospct. All rights reserved.`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Verify your email</title>
        <style>
          body { margin: 0; padding: 0; background: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 36px 40px 28px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 36px 40px; }
          .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .otp-box { background: #f4f6fb; border: 2px dashed #6366f1; border-radius: 10px; text-align: center; padding: 24px 16px; margin: 24px 0; }
          .otp-box span { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #6366f1; }
          .note { font-size: 13px !important; color: #9ca3af !important; }
          .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>Prospct</h1>
            <p>Email Verification</p>
          </div>
          <div class="body">
            <p>Hi ${firstName || "there"},</p>
            <p>Thanks for signing up! Use the 6-digit code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
            <div class="otp-box">
              <span>${otp}</span>
            </div>
            <p class="note">If you didn't create a Prospct account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Prospct. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`[SMTP Debug Error] Failed to send OTP email:`, error);
    throw error;
  }
};

module.exports = { sendOtpEmail, createTransporter };
