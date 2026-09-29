import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export function encodeGmailRaw({ from, to, subject, text, html }) {
  const boundary = `padosipro_${Date.now()}`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

async function sendGmailApi({ config, from, to, subject, text, html }) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.gmailClientId,
      client_secret: config.gmailClientSecret,
      refresh_token: config.gmailRefreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || `Gmail token refresh failed (${tokenResponse.status})`);
  }

  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodeGmailRaw({ from, to, subject, text, html }) }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API ${response.status}: ${body.slice(0, 280)}`);
  }
}

async function sendBrevo({ config, from, to, subject, text, html }) {
  const senderEmail = config.smtpUser || from.match(/<([^>]+)>/)?.[1] || from;
  const senderName = from.match(/^([^<]+)</)?.[1]?.trim() || "PadosiPro";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.brevoApiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo ${response.status}: ${body.slice(0, 280)}`);
  }
}

async function sendResend({ config, from, to, subject, text, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body.slice(0, 280)}`);
  }
}

function writeOutbox({ config, log, to, subject, text, code }) {
  const dir = path.resolve(config.outboxDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${to.replace(/[^a-z0-9@._-]/gi, "_")}.txt`);
  fs.writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
  if (config.logOtp) {
    log.log(`[mail] OTP for ${to}: ${code} (saved to ${file})`);
  }
}

export function createMailer({ config, log = console }) {
  const transporter =
    config.mailTransport === "smtp"
      ? nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpPort === 465,
          auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        })
      : null;

  return {
    sendOtp({ to, code }) {
      const subject = "Your PadosiPro verification code";
      const text = `Your PadosiPro verification code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this email.`;
      const html = `<p>Your PadosiPro verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`;
      const from = config.mailFrom;

      const finish = (label) => {
        log.log(`[mail] OTP email sent to ${to} via ${label}`);
      };
      const fail = (error) => {
        log.log(`[mail] Failed to send OTP to ${to}: ${error.message}`);
        log.log(`[mail] OTP for ${to}: ${code}`);
      };

      if (config.mailTransport === "gmail-api") {
        sendGmailApi({ config, from, to, subject, text, html }).then(() => finish("Gmail API")).catch(fail);
        return;
      }
      if (config.mailTransport === "brevo") {
        sendBrevo({ config, from, to, subject, text, html }).then(() => finish("Brevo")).catch(fail);
        return;
      }
      if (config.mailTransport === "resend") {
        sendResend({ config, from, to, subject, text, html }).then(() => finish("Resend")).catch(fail);
        return;
      }
      if (!transporter) {
        writeOutbox({ config, log, to, subject, text, code });
        return;
      }

      transporter
        .sendMail({ from, to, subject, text, html })
        .then(() => finish(`SMTP ${config.smtpHost}`))
        .catch(fail);
    },
  };
}
