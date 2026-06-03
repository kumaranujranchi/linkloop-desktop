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
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial; background:#f6f9fc;margin:0} .container{max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eef2f6} .header{background:linear-gradient(135deg,#4f46e5,#3b82f6);padding:28px;text-align:center;color:#fff} .content{padding:28px;color:#334155} .button{display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><div class="container"><div class="header"><h1>LinkBuild</h1></div><div class="content">${bodyContent}${ctaUrl ? `<p style="text-align:center;margin-top:20px"><a href="${ctaUrl}" class="button">${ctaText || "Open"}</a></p>` : ""}</div></div></body></html>`;
}

async function sendVerificationReminder() {
  const code = "linkbuild-verify=TEST-123456";
  const subject = `Please verify your website: shadcnspace.com`;
  const body = `
    <p>Hello ${toName},</p>
    <p>You recently added <strong>shadcnspace.com</strong> to LinkBuild but it looks like the site hasn't been verified yet.</p>
    <h4>DNS (Recommended)</h4>
    <p>Add the following TXT record to your domain's DNS zone:</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e6eef6;">${code}</pre>
    <h4>HTML Meta Tag</h4>
    <p>If you cannot edit DNS, add this meta tag to the &lt;head&gt; of your homepage:</p>
    <pre style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e6eef6;">&lt;meta name=\"linkbuild-verification\" content=\"${code}\" /&gt;</pre>
    <p>If you need help, visit your <a href="https://linkbuild.store/dashboard">dashboard</a> for verification instructions.</p>
    <p>Thanks,<br/>The LinkBuild Team</p>
  `;

  const html = getEmailTemplate(
    "Verify your website on LinkBuild",
    body,
    "https://linkbuild.store/dashboard",
    "Open Dashboard",
  );

  const res = await transporter.sendMail({
    from: '"Anuj Kumar" <support@linkbuild.store>',
    to: toEmail,
    subject,
    html,
  });
  console.log("Verification reminder sent:", res.messageId || res.response);
}

async function sendWelcomeEmail() {
  const subject = `Welcome to LinkBuild — ${toName}`;
  const body = `
    <p>Hello ${toName},</p>
    <p>Welcome to LinkBuild! I'm <strong>Anuj Kumar</strong>, CEO and Founder. We're excited to have you on board.</p>
    <p>LinkBuild helps you discover link exchange opportunities, monitor backlinks, and grow organic traffic. To get started, verify your website, add your first site, and explore the dashboard.</p>
    <p>If you ever need help, reply to this email and our team will assist you.</p>
    <p>Warm regards,<br/><strong>Anuj Kumar</strong><br/>CEO &amp; Founder — LinkBuild.Store</p>
  `;

  const html = getEmailTemplate(
    "Welcome to LinkBuild",
    body,
    "https://linkbuild.store/dashboard",
    "Go to Dashboard",
  );

  const res = await transporter.sendMail({
    from: '"Anuj Kumar" <support@linkbuild.store>',
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
