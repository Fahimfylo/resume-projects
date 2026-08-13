import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"NEXUS" <${fromEmail}>`,
    to: email,
    subject: 'Verify your NEXUS account',
    html: `
      <div style="font-family: 'Courier New', monospace; background: #0a0a0f; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; border: 1px solid rgba(0, 255, 200, 0.3); padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: #00ffc8; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #0a0a0f; font-size: 28px; font-weight: 900;">N</span>
            </div>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Verify Your Identity</h1>
          </div>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; text-align: center; margin-bottom: 24px;">
            Enter this code to activate your NEXUS account
          </p>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(0, 255, 200, 0.2); padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 900; color: #00ffc8; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">
            This code expires in 10 minutes. If you didn't request this, ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  console.log('[EMAIL]', info.messageId, 'sent to', email);
}
