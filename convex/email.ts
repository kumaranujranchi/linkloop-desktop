"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import nodemailer from "nodemailer";

// Initialize SMTP transporter using Hostinger SMTP details
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true for port 465 (SSL/TLS)
  auth: {
    user: "support@linkbuild.store",
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to send email via transporter
async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_PASSWORD) {
    console.warn("⚠️ EMAIL_PASSWORD is not set in Convex environment variables. Skipping email trigger.");
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: '"LinkBuild Support" <support@linkbuild.store>',
      to,
      subject,
      html,
    });
    console.log(`✉️ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to} via SMTP:`, error);
  }
}

// Branded premium responsive HTML layout for emails
function getEmailTemplate(title: string, bodyContent: string, ctaUrl?: string, ctaText?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #f6f9fc;
      width: 100%;
      padding: 40px 0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      max-width: 600px;
      margin: 0 auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2f6;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
      color: #334155;
      line-height: 1.6;
    }
    .content p {
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 16px;
    }
    .button {
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .footer-links {
      margin-top: 12px;
    }
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>LinkBuild</h1>
      </div>
      <div class="content">
        ${bodyContent}
        ${ctaUrl && ctaText ? `
          <div class="button-container">
            <a href="${ctaUrl}" class="button">${ctaText}</a>
          </div>
        ` : ""}
      </div>
      <div class="footer">
        <p>This is an automated notification from LinkBuild. Please do not reply directly to this email.</p>
        <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} LinkBuild. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ========== INTERNAL ACTIONS ==========

// 1. Email trigger for website verification success
export const sendWebsiteVerifiedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = `🎉 Website Verified Successfully: ${args.domain}`;
    const bodyContent = `
      <p>Hello ${args.name},</p>
      <p>Great news! Your website <strong>${args.domain}</strong> has been successfully verified and is now active on the LinkBuild marketplace.</p>
      <p>Other users can now search for your domain, view its SEO metrics, and send you link exchange requests. You can also view your live site performance on the dashboard.</p>
      <p>Thank you for collaborating with the LinkBuild community!</p>
    `;
    const html = getEmailTemplate(
      "Website Verified Successfully",
      bodyContent,
      "https://linkbuild.store/dashboard",
      "Go to Dashboard"
    );
    await sendMail(args.email, subject, html);
  },
});

// 2. Email trigger for new chat messages
export const sendNewMessageEmail = internalAction({
  args: {
    email: v.string(),
    receiverName: v.string(),
    senderName: v.string(),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = `💬 New message from ${args.senderName} on LinkBuild`;
    const bodyContent = `
      <p>Hello ${args.receiverName},</p>
      <p>You have received a new chat message from <strong>${args.senderName}</strong> on LinkBuild:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #475569; font-size: 15px;">
        "${args.messageText}"
      </div>
      <p>Click the button below to view the conversation and reply directly in the chat.</p>
    `;
    const html = getEmailTemplate(
      "New Chat Message Received",
      bodyContent,
      "https://linkbuild.store/chat",
      "View Conversation"
    );
    await sendMail(args.email, subject, html);
  },
});

// 3. Email trigger for a new exchange request
export const sendExchangeRequestEmail = internalAction({
  args: {
    email: v.string(),
    receiverName: v.string(),
    senderName: v.string(),
    fromDomain: v.string(),
    toDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = `🤝 New Link Exchange Request from ${args.senderName}`;
    const bodyContent = `
      <p>Hello ${args.receiverName},</p>
      <p>You have received a new link exchange request from <strong>${args.senderName}</strong> on LinkBuild:</p>
      
      <div style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600;">Details</th>
            <th style="padding: 12px 16px; text-align: right; color: #64748b; font-weight: 600;">Website</th>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 16px; color: #64748b;">Source Site (Their Link)</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #1e293b;">${args.fromDomain}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #64748b;">Target Site (Your Link)</td>
            <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #1e293b;">${args.toDomain}</td>
          </tr>
        </table>
      </div>

      <p>Review the proposal details on your dashboard to accept, negotiate terms, or reject the exchange request.</p>
    `;
    const html = getEmailTemplate(
      "New Link Exchange Request",
      bodyContent,
      "https://linkbuild.store/dashboard?tab=exchanges",
      "Review Request"
    );
    await sendMail(args.email, subject, html);
  },
});
