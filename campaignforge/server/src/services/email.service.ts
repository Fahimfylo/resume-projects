// ── SMTP temporarily disabled ──
// import nodemailer from 'nodemailer';
// import { env } from '../config/env.js';
// import { logger } from '../utils/logger.js';

// const transporter = nodemailer.createTransport({
//   host: env.smtp.host,
//   port: env.smtp.port,
//   secure: env.smtp.port === 465,
//   auth: {
//     user: env.smtp.user,
//     pass: env.smtp.pass,
//   },
// });

// async function sendMailSafe(mailOptions: nodemailer.SendMailOptions): Promise<void> {
//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     logger.error(`Email send failed to ${mailOptions.to}: ${(error as Error).message}`);
//     throw error;
//   }
// }

// export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
//   await sendMailSafe({
//     from: env.smtp.from,
//     to: email,
//     subject: 'Your verification code - Campaign Forge',
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//         <h2>Welcome to Campaign Forge</h2>
//         <p>Your verification code is:</p>
//         <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">${code}</div>
//         <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
//         <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
//       </div>
//     `,
//   });
// }

// export async function sendVerificationEmail(email: string, token: string): Promise<void> {
//   const verificationUrl = `${env.appUrl}/verify-email?token=${token}`;

//   await sendMailSafe({
//     from: env.smtp.from,
//     to: email,
//     subject: 'Verify your email - Campaign Forge',
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//         <h2>Welcome to Campaign Forge</h2>
//         <p>Click the button below to verify your email address.</p>
//         <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #1A1A1A; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//           Verify Email
//         </a>
//         <p style="color: #666; font-size: 14px;">Or paste this link in your browser:<br/>${verificationUrl}</p>
//         <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
//       </div>
//     `,
//   });
// }

// export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
//   const resetUrl = `${env.appUrl}/reset-password?token=${token}`;

//   await sendMailSafe({
//     from: env.smtp.from,
//     to: email,
//     subject: 'Reset your password - Campaign Forge',
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//         <h2>Password Reset Request</h2>
//         <p>Click the button below to reset your password. This link expires in 1 hour.</p>
//         <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1A1A1A; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
//           Reset Password
//         </a>
//         <p style="color: #666; font-size: 14px;">Or paste this link in your browser:<br/>${resetUrl}</p>
//         <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
//       </div>
//     `,
//   });
// }