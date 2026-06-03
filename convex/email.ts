"use node";

import { v, ConvexError } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { getUserIdFromToken } from "./auth_helpers";
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
    /* ---- Reset & Base ---- */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7fb;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; }

    /* ---- Wrapper ---- */
    .wrapper {
      background-color: #f4f7fb;
      width: 100%;
      padding: 40px 16px;
      box-sizing: border-box;
    }

    /* ---- Preheader ---- */
    .preheader {
      font-size: 0; display: none; max-height: 0; overflow: hidden;
      mso-hide: all;
    }

    /* ---- Container ---- */
    .container {
      background-color: #ffffff;
      border-radius: 16px;
      max-width: 560px;
      margin: 0 auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03);
      border: 1px solid #e8edf2;
      overflow: hidden;
    }

    /* ---- Header ---- */
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #3b82f6 100%);
      padding: 36px 32px 28px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399);
    }
    .header-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .header-logo-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-logo-icon svg { width: 20px; height: 20px; }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .header-subtitle {
      color: rgba(255,255,255,0.75);
      font-size: 13px;
      margin-top: 4px;
      font-weight: 400;
    }

    /* ---- Content ---- */
    .content {
      padding: 36px 32px 24px;
      color: #1e293b;
      line-height: 1.7;
    }
    .content p {
      font-size: 15px;
      margin-top: 0;
      margin-bottom: 20px;
      color: #334155;
    }
    .content h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 28px 0 12px;
    }
    .content h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 24px 0 8px;
    }
    .content h4 {
      font-size: 14px;
      font-weight: 700;
      color: #4f46e5;
      margin: 24px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content strong {
      color: #0f172a;
    }
    .content ul {
      padding: 0 0 0 20px;
      margin: 12px 0 20px;
    }
    .content li {
      font-size: 15px;
      color: #334155;
      margin-bottom: 8px;
    }

    /* ---- Divider ---- */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 28px 0;
    }

    /* ---- Info Cards / Highlights ---- */
    .highlight-box {
      background: linear-gradient(135deg, #f8faff, #f0f4ff);
      border: 1px solid #e0e7ff;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .highlight-box p { margin: 0; font-size: 14px; }
    .highlight-box strong { color: #4f46e5; }

    /* ---- Code Block / Verification ---- */
    .code-block {
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px 18px;
      border-radius: 10px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-all;
      margin: 8px 0 16px;
      border: 1px solid #1e293b;
      overflow-x: auto;
    }
    .code-block .comment { color: #64748b; }
    .code-block .string { color: #34d399; }
    .code-block .tag { color: #60a5fa; }
    .code-block .attr { color: #f59e0b; }

    /* ---- Info Row (two-column layout) ---- */
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-size: 14px; }
    .info-value { color: #0f172a; font-weight: 600; font-size: 14px; text-align: right; }

    /* ---- Signature Block ---- */
    .signature {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 2px solid #f1f5f9;
    }
    .signature-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .signature-title {
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
    }
    .signature-company {
      font-size: 13px;
      color: #4f46e5;
      font-weight: 600;
      margin-top: 2px;
    }

    /* ---- Button ---- */
    .button-container {
      text-align: center;
      margin: 32px 0 8px;
    }
    .button {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
      display: inline-block;
      box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.35);
      transition: all 0.15s ease;
      letter-spacing: 0.2px;
    }
    .button:hover {
      box-shadow: 0 6px 20px -2px rgba(79, 70, 229, 0.45);
      transform: translateY(-1px);
    }
    .button-secondary {
      background: #ffffff;
      color: #4f46e5 !important;
      border: 2px solid #e0e7ff;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      display: inline-block;
    }

    /* ---- Meta Steps ---- */
    .step-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 16px 0;
    }
    .step-card .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px; height: 24px;
      background: #4f46e5;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      margin-right: 8px;
    }
    .step-card .step-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 15px;
    }
    .step-card p {
      font-size: 14px;
      margin: 8px 0 0 !important;
    }

    /* ---- Footer ---- */
    .footer {
      background-color: #f8fafc;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid #e8edf2;
    }
    .footer-logo-text {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .footer p {
      font-size: 12px;
      color: #94a3b8;
      margin: 4px 0;
      line-height: 1.5;
    }
    .footer-social {
      margin: 14px 0;
    }
    .footer-social a {
      display: inline-block;
      margin: 0 6px;
      text-decoration: none;
    }
    .footer-social a svg { width: 20px; height: 20px; }
    .footer-links a {
      color: #64748b;
      text-decoration: none;
      margin: 0 8px;
      font-size: 12px;
    }
    .footer-links a:hover { color: #4f46e5; }

    /* ---- Responsive ---- */
    @media only screen and (max-width: 480px) {
      .wrapper { padding: 16px 8px; }
      .content { padding: 28px 20px 16px; }
      .header { padding: 28px 20px 20px; }
      .footer { padding: 20px 20px; }
      .button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Preheader text (hidden) for inbox preview -->
    <div class="preheader">${title} — LinkBuild</div>

    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-logo">
          <div class="header-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h1>LinkBuild</h1>
        </div>
        <div class="header-subtitle">${title}</div>
      </div>

      <!-- Content -->
      <div class="content">
        ${bodyContent}
        ${ctaUrl && ctaText ? `
          <div class="divider"></div>
          <div class="button-container">
            <a href="${ctaUrl}" class="button">${ctaText}</a>
          </div>
        ` : ""}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-logo-text">⚡ LinkBuild</div>
        <p style="margin-top: 6px;">Backlink Exchange Marketplace</p>
        <div class="footer-social">
          <a href="https://linkbuild.store" aria-label="Website">
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </a>
        </div>
        <div class="footer-links">
          <a href="https://linkbuild.store">Website</a>
          <a href="https://linkbuild.store/terms.html">Terms</a>
          <a href="https://linkbuild.store/privacy-policy.html">Privacy</a>
        </div>
        <p style="margin-top: 10px;">This is an automated notification from LinkBuild. Please do not reply directly to this email.</p>
        <p>&copy; ${new Date().getFullYear()} LinkBuild. All rights reserved.</p>
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
      <p style="font-size: 17px;">Hello ${args.name},</p>

      <div class="highlight-box">
        <p>🎉 Great news! Your website <strong>${args.domain}</strong> has been successfully verified and is now <strong>live</strong> on the LinkBuild marketplace.</p>
      </div>

      <p>Other users can now discover your domain, view its SEO metrics, and send you link exchange requests. Here's what's next:</p>
      <ul>
        <li><strong>Browse the marketplace</strong> — Find websites in your niche to partner with</li>
        <li><strong>Monitor your backlinks</strong> — Track all incoming and outgoing links</li>
        <li><strong>Grow your network</strong> — Build quality relationships with other site owners</li>
      </ul>
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
      <p style="font-size: 17px;">Hello ${args.receiverName},</p>

      <div class="highlight-box">
        <p>📬 You have a new message from <strong>${args.senderName}</strong> on LinkBuild.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
        <p style="font-style: italic; color: #475569; font-size: 14px; margin: 0;">"${args.messageText}"</p>
      </div>

      <p>Click the button below to view the full conversation and reply directly in the chat.</p>
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
      <p style="font-size: 17px;">Hello ${args.receiverName},</p>

      <div class="highlight-box">
        <p>🤝 You've received a link exchange request from <strong>${args.senderName}</strong>.</p>
      </div>

      <div style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: linear-gradient(135deg, #f8faff, #f0f4ff); border-bottom: 1px solid #e2e8f0;">
            <th style="padding: 14px 18px; text-align: left; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Details</th>
            <th style="padding: 14px 18px; text-align: right; color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Website</th>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 14px 18px; color: #64748b;">Source Site (Their Link)</td>
            <td style="padding: 14px 18px; text-align: right; font-weight: 700; color: #0f172a;">${args.fromDomain}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; color: #64748b;">Target Site (Your Link)</td>
            <td style="padding: 14px 18px; text-align: right; font-weight: 700; color: #0f172a;">${args.toDomain}</td>
          </tr>
        </table>
      </div>

      <p>Review the proposal details on your dashboard to <strong>accept</strong>, negotiate terms, or reject the exchange request.</p>
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

// 4. Email reminder for website verification (sent if site still unverified after delay)
export const sendWebsiteVerificationReminder = internalAction({
  args: {
    websiteId: v.id("websites"),
  },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.websiteId);
    if (!website) return;
    // Only send reminder if still pending and not verified
    if (website.verified || website.status !== "pending") return;

    const owner = await ctx.db.get(website.ownerId);
    if (!owner || !owner.email) return;

    const subject = `Please verify your website: ${website.domain}`;
    const bodyContent = `
      <p style="font-size: 17px;">Hello ${owner.name || ''},</p>

      <div class="highlight-box">
        <p>You recently added <strong>${website.domain}</strong> to LinkBuild, but your website is still awaiting verification. Complete it now to go live on the marketplace! ⏳</p>
      </div>

      <p>Choose <strong>one</strong> of the following methods to verify ownership:</p>

      <div class="divider"></div>

      <h4>Method 1: DNS (Recommended)</h4>
      <p>Add the following TXT record to your domain's DNS settings:</p>
      <div class="code-block">${website.verificationCode}</div>
      <p>⏱️ DNS propagation usually takes 5–15 minutes, but may take up to a few hours. Once added, click "Verify" on your dashboard.</p>

      <div class="divider"></div>

      <h4>Method 2: HTML Meta Tag</h4>
      <p>If you can't edit DNS, paste this meta tag into the <code>&lt;head&gt;</code> of your homepage:</p>
      <div class="code-block">&lt;meta name="linkbuild-verification" content="${website.verificationCode}" /&gt;</div>
      <p>Save the file and return to your dashboard to verify.</p>

      <div class="divider"></div>

      <p style="margin-bottom: 0;">Need help? Just reply to this email — our team will guide you through the process.</p>
    `;

    const html = getEmailTemplate("Verify your website on LinkBuild", bodyContent, "https://linkbuild.store/dashboard", "Open Dashboard");
    await sendMail(owner.email, subject, html);
  },
});

// 5. Welcome email sent on signup (from CEO Anuj Kumar)
export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = `Welcome to LinkBuild — ${args.name}`;
    const bodyContent = `
      <p style="font-size: 17px;">Hello ${args.name},</p>

      <div class="highlight-box">
        <p>Welcome to <strong>LinkBuild</strong>! I'm <strong>Anuj Kumar</strong>, CEO and Founder. We're genuinely excited to have you on board. 🎉</p>
      </div>

      <p>LinkBuild is the smartest way to grow your website's SEO through quality link exchanges. Here's what you can do right now:</p>

      <div class="step-card">
        <span class="step-num">1</span>
        <span class="step-title">Verify Your Website</span>
        <p>Add your domain and complete the DNS or Meta Tag verification to prove ownership. It takes less than 2 minutes.</p>
      </div>

      <div class="step-card">
        <span class="step-num">2</span>
        <span class="step-title">Explore the Marketplace</span>
        <p>Browse hundreds of websites in your niche. Check their DA, traffic, and spam scores to find the perfect exchange partners.</p>
      </div>

      <div class="step-card">
        <span class="step-num">3</span>
        <span class="step-title">Send &amp; Receive Requests</span>
        <p>Propose link exchanges, negotiate anchor text, and grow your backlink profile — all from one dashboard.</p>
      </div>

      <p>If you ever get stuck or have a question, simply reply to this email. Our team is here to help you succeed.</p>

      <div class="signature">
        <div class="signature-name">Anuj Kumar</div>
        <div class="signature-title">CEO &amp; Founder</div>
        <div class="signature-company">LinkBuild.Store</div>
      </div>
    `;

    const html = getEmailTemplate("Welcome to LinkBuild 🚀", bodyContent, "https://linkbuild.store/dashboard", "Go to Dashboard");
    await sendMail(args.email, subject, html);
  },
});

// Public action to trigger a test email (can be run via: npx convex run email:testEmail '{"email": "kumaranujranchi@gmail.com"}')
export const testEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const subject = "🧪 LinkBuild Test Email";
    const bodyContent = `
      <p style="font-size: 17px;">Hello Admin,</p>

      <div class="highlight-box">
        <p>✅ This is a successful test email from your <strong>LinkBuild</strong> SMTP mail trigger system.</p>
      </div>

      <div style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: linear-gradient(135deg, #f8faff, #f0f4ff); border-bottom: 1px solid #e2e8f0;">
            <th style="padding: 12px 18px; text-align: left; color: #64748b; font-weight: 600; font-size: 13px;">Config</th>
            <th style="padding: 12px 18px; text-align: right; color: #64748b; font-weight: 600; font-size: 13px;">Value</th>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 18px; color: #64748b;">SMTP Host</td>
            <td style="padding: 12px 18px; text-align: right; font-weight: 700; color: #0f172a;">smtp.hostinger.com</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 18px; color: #64748b;">Port</td>
            <td style="padding: 12px 18px; text-align: right; font-weight: 700; color: #0f172a;">465 (SSL/TLS)</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; color: #64748b;">Sender</td>
            <td style="padding: 12px 18px; text-align: right; font-weight: 700; color: #0f172a;">support@linkbuild.store</td>
          </tr>
        </table>
      </div>

      <p>If you received this email, the SMTP setup and environment password configuration are fully correct!</p>
    `;
    const html = getEmailTemplate("SMTP Test Connection", bodyContent);
    await sendMail(args.email, subject, html);
    return { success: true };
  },
});

// Public action to send a sample verification reminder email (for testing)
export const sampleSendVerificationEmail = action({
  args: { email: v.string(), name: v.string(), domain: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const subject = `Please verify your website: ${args.domain}`;
    const bodyContent = `
      <p style="font-size: 17px;">Hello ${args.name || ''},</p>

      <div class="highlight-box">
        <p>You recently added <strong>${args.domain}</strong> to LinkBuild, but your website is still awaiting verification. Complete it now to go live on the marketplace! ⏳</p>
      </div>

      <p>Choose <strong>one</strong> of the following methods to verify ownership:</p>

      <div class="divider"></div>

      <h4>Method 1: DNS (Recommended)</h4>
      <p>Add the following TXT record to your domain's DNS settings:</p>
      <div class="code-block">${args.code}</div>
      <p>⏱️ DNS propagation usually takes 5–15 minutes, but may take up to a few hours. Once added, click "Verify" on your dashboard.</p>

      <div class="divider"></div>

      <h4>Method 2: HTML Meta Tag</h4>
      <p>If you can't edit DNS, paste this meta tag into the <code>&lt;head&gt;</code> of your homepage:</p>
      <div class="code-block">&lt;meta name="linkbuild-verification" content="${args.code}" /&gt;</div>
      <p>Save the file and return to your dashboard to verify.</p>

      <div class="divider"></div>

      <p style="margin-bottom: 0;">Need help? Just reply to this email — our team will guide you through the process.</p>
    `;
    const html = getEmailTemplate("Verify your website on LinkBuild", bodyContent, "https://linkbuild.store/dashboard", "Open Dashboard");
    await sendMail(args.email, subject, html);
    return { success: true };
  },
});

// Public action to send a sample welcome email (for testing)
export const sampleSendWelcomeEmail = action({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const subject = `Welcome to LinkBuild — ${args.name}`;
    const bodyContent = `
      <p style="font-size: 17px;">Hello ${args.name},</p>

      <div class="highlight-box">
        <p>Welcome to <strong>LinkBuild</strong>! I'm <strong>Anuj Kumar</strong>, CEO and Founder. We're genuinely excited to have you on board. 🎉</p>
      </div>

      <p>LinkBuild is the smartest way to grow your website's SEO through quality link exchanges. Here's what you can do right now:</p>

      <div class="step-card">
        <span class="step-num">1</span>
        <span class="step-title">Verify Your Website</span>
        <p>Add your domain and complete the DNS or Meta Tag verification to prove ownership. It takes less than 2 minutes.</p>
      </div>

      <div class="step-card">
        <span class="step-num">2</span>
        <span class="step-title">Explore the Marketplace</span>
        <p>Browse hundreds of websites in your niche. Check their DA, traffic, and spam scores to find the perfect exchange partners.</p>
      </div>

      <div class="step-card">
        <span class="step-num">3</span>
        <span class="step-title">Send &amp; Receive Requests</span>
        <p>Propose link exchanges, negotiate anchor text, and grow your backlink profile — all from one dashboard.</p>
      </div>

      <p>If you ever get stuck or have a question, simply reply to this email. Our team is here to help you succeed.</p>

      <div class="signature">
        <div class="signature-name">Anuj Kumar</div>
        <div class="signature-title">CEO &amp; Founder</div>
        <div class="signature-company">LinkBuild.Store</div>
      </div>
    `;
    const html = getEmailTemplate("Welcome to LinkBuild 🚀", bodyContent, "https://linkbuild.store/dashboard", "Go to Dashboard");
    await sendMail(args.email, subject, html);
    return { success: true };
  },
});

// ========== ADMIN HELPERS ==========

async function verifyAdminToken(db: any, token: string) {
  const userId = await getUserIdFromToken(db, token);
  if (!userId) throw new ConvexError("Not authenticated");
  const user = await db.get(userId);
  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized access to admin APIs");
  }
  return user;
}

// ========== BULK EMAIL ==========

// Admin: send a bulk email to all platform users
export const sendBulkEmail = action({
  args: {
    token: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);

    // Fetch all users with valid emails
    const allUsers = await ctx.db.query("users").collect();
    const validUsers = allUsers.filter(u => u.email && u.email.includes('@'));

    if (validUsers.length === 0) {
      return { success: false, error: "No users with valid emails found", sent: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send to each user individually
    for (const user of validUsers) {
      try {
        // Personalize: replace {{name}} with user's name
        const personalHtml = args.htmlBody.replace(/\{\{name\}\}/g, user.name || 'User');
        const personalSubject = args.subject.replace(/\{\{name\}\}/g, user.name || 'User');

        await sendMail(user.email, personalSubject, personalHtml);
        sentCount++;
      } catch (e) {
        console.error(`Failed to send bulk email to ${user.email}:`, e);
        failedCount++;
      }
    }

    return {
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: validUsers.length,
    };
  },
});
