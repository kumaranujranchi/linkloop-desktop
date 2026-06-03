#!/usr/bin/env node
import nodemailer from "nodemailer";

// Usage: node scripts/send_sample_emails.js [toEmail] [name]
const toEmail = process.argv[2] || "kumaranujranchi@gmail.com";
const toName = process.argv[3] || "Vaibhav Gupta";

const EMAIL_PASS = process.env.EMAIL_PASSWORD;
if (!EMAIL_PASS) {
  console.error(
    "ERROR: EMAIL_PASSWORD environment variable is not set. Aborting.",
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "support@linkbuild.store",
    pass: EMAIL_PASS,
  },
});

function getEmailTemplate(title, bodyContent, ctaUrl, ctaText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;-webkit-font-smoothing:antialiased}
    a{text-decoration:none}
    .wrapper{background:#f4f7fb;width:100%;padding:40px 16px;box-sizing:border-box}
    .container{background:#fff;border-radius:16px;max-width:560px;margin:0 auto;box-shadow:0 8px 32px rgba(0,0,0,0.06),0 2px 8px rgba(0,0,0,0.03);border:1px solid #e8edf2;overflow:hidden}
    .header{background:linear-gradient(135deg,#4f46e5,#6366f1,#3b82f6);padding:36px 32px 28px;text-align:center;position:relative}
    .header::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)}
    .header-logo{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px}
    .header-logo-icon{width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .header h1{color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.3px}
    .header-subtitle{color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px}
    .content{padding:36px 32px 24px;color:#1e293b;line-height:1.7}
    .content p{font-size:15px;margin:0 0 20px;color:#334155}
    .content h4{font-size:14px;font-weight:700;color:#4f46e5;margin:24px 0 8px;text-transform:uppercase;letter-spacing:0.5px}
    .divider{height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);margin:28px 0}
    .highlight-box{background:linear-gradient(135deg,#f8faff,#f0f4ff);border:1px solid #e0e7ff;border-radius:12px;padding:16px 20px;margin:20px 0}
    .highlight-box p{margin:0;font-size:14px}
    .code-block{background:#0f172a;color:#e2e8f0;padding:14px 18px;border-radius:10px;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:13px;line-height:1.5;word-break:break-all;margin:8px 0 16px;border:1px solid #1e293b;overflow-x:auto}
    .step-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:16px 0}
    .step-num{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#4f46e5;color:#fff;font-size:12px;font-weight:700;border-radius:6px;margin-right:8px}
    .step-title{font-weight:700;color:#0f172a;font-size:15px}
    .step-card p{font-size:14px;margin:8px 0 0!important}
    .signature{margin-top:28px;padding-top:20px;border-top:2px solid #f1f5f9}
    .signature-name{font-size:16px;font-weight:700;color:#0f172a}
    .signature-title{font-size:13px;color:#64748b;margin-top:2px}
    .signature-company{font-size:13px;color:#4f46e5;font-weight:600;margin-top:2px}
    .button-container{text-align:center;margin:32px 0 8px}
    .button{background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff!important;padding:14px 32px;font-size:15px;font-weight:700;border-radius:10px;display:inline-block;box-shadow:0 4px 12px -2px rgba(79,70,229,0.35);letter-spacing:0.2px}
    .footer{background:#f8fafc;padding:28px 32px;text-align:center;border-top:1px solid #e8edf2}
    .footer p{font-size:12px;color:#94a3b8;margin:4px 0;line-height:1.5}
    .footer-links{margin-top:10px}
    .footer-links a{color:#64748b;text-decoration:none;margin:0 8px;font-size:12px}
    @media only screen and (max-width:480px){.wrapper{padding:16px 8px}.content{padding:28px 20px 16px}.header{padding:28px 20px 20px}}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">
          <div class="header-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" style="width:20px;height:20px">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h1>LinkBuild</h1>
        </div>
        <div class="header-subtitle">${title}</div>
      </div>
      <div class="content">
        ${bodyContent}
        ${ctaUrl ? `<div class="divider"></div><div class="button-container"><a href="${ctaUrl}" class="button">${ctaText || "Open"}</a></div>` : ""}
      </div>
      <div class="footer">
        <p style="font-size:14px;font-weight:800;color:#0f172a">⚡ LinkBuild</p>
        <p>Backlink Exchange Marketplace</p>
        <div class="footer-links">
          <a href="https://linkbuild.store">Website</a>
          <a href="https://linkbuild.store/terms.html">Terms</a>
          <a href="https://linkbuild.store/privacy-policy.html">Privacy</a>
        </div>
        <p style="margin-top:8px">&copy; LinkBuild. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendVerificationReminder() {
  const code = "linkbuild-verify=Lx8qKm3pR7tN9fB2wV4cJ6hY";
  const subject = `Please verify your website: shadcnspace.com`;
  const body = `
    <p style="font-size:17px">Hello ${toName},</p>
    <div class="highlight-box">
      <p>You recently added <strong>shadcnspace.com</strong> to LinkBuild, but your website is still awaiting verification. Complete it now to go live on the marketplace! ⏳</p>
    </div>
    <p>Choose <strong>one</strong> of the following methods to verify ownership:</p>
    <div class="divider"></div>
    <h4>Method 1: DNS (Recommended)</h4>
    <p>Add the following TXT record to your domain's DNS settings:</p>
    <div class="code-block">${code}</div>
    <p>⏱️ DNS propagation usually takes 5–15 minutes, but may take up to a few hours. Once added, click "Verify" on your dashboard.</p>
    <div class="divider"></div>
    <h4>Method 2: HTML Meta Tag</h4>
    <p>If you can't edit DNS, paste this meta tag into the <code>&lt;head&gt;</code> of your homepage:</p>
    <div class="code-block">&lt;meta name="linkbuild-verification" content="${code}" /&gt;</div>
    <p>Save the file and return to your dashboard to verify.</p>
    <div class="divider"></div>
    <p style="margin-bottom:0">Need help? Just reply to this email — our team will guide you through the process.</p>
  `;

  const html = getEmailTemplate(
    "Verify your website on LinkBuild",
    body,
    "https://linkbuild.store/dashboard",
    "Open Dashboard",
  );

  const res = await transporter.sendMail({
    from: '"LinkBuild Support" <support@linkbuild.store>',
    to: toEmail,
    subject,
    html,
  });
  console.log("Verification reminder sent:", res.messageId || res.response);
}

async function sendWelcomeEmail() {
  const subject = `Welcome to LinkBuild — ${toName}`;
  const body = `
    <p style="font-size:17px">Hello ${toName},</p>
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

  const html = getEmailTemplate(
    "Welcome to LinkBuild 🚀",
    body,
    "https://linkbuild.store/dashboard",
    "Go to Dashboard",
  );

  const res = await transporter.sendMail({
    from: '"LinkBuild Support" <support@linkbuild.store>',
    to: toEmail,
    subject,
    html,
  });
  console.log("Welcome email sent:", res.messageId || res.response);
}

async function main() {
  try {
    console.log("Sending verification reminder to", toEmail);
    await sendVerificationReminder();
    console.log("Sending welcome email to", toEmail);
    await sendWelcomeEmail();
    console.log("Done");
  } catch (e) {
    console.error("Failed to send emails:", e);
    process.exit(1);
  }
}

main();
