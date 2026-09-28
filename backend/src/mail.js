import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export function createMailer({ config, log = console }) {
  const smtpConfigured = Boolean(config.smtpHost);
  const transporter = smtpConfigured
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

      if (!transporter) {
        const dir = path.resolve(config.outboxDir);
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${Date.now()}-${to.replace(/[^a-z0-9@._-]/gi, "_")}.txt`);
        fs.writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
        if (config.logOtp) {
          log.log(`[mail] OTP for ${to}: ${code} (saved to ${file})`);
        }
        return;
      }

      transporter
        .sendMail({ from: config.mailFrom, to, subject, text, html })
        .then(() => {
          log.log(`[mail] OTP email sent to ${to}`);
        })
        .catch((error) => {
          log.log(`[mail] Failed to send OTP to ${to}: ${error.message}`);
          log.log(`[mail] OTP for ${to}: ${code}`);
        });
    },
  };
}
