import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { encodeGmailRaw } from "../src/mail.js";

test("production does not dial smtp.gmail.com", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    JWT_SECRET: "x",
    OTP_PEPPER: "y",
    EMAIL_USER: "a@gmail.com",
    EMAIL_PASSWORD: "abcd efgh",
    EMAIL_HOST: "smtp.gmail.com",
    EMAIL_PORT: "465",
  });
  assert.equal(config.mailTransport, "outbox");
  assert.equal(config.smtpHost, "");
  assert.equal(config.smtpPass, "abcdefgh");
});

test("Gmail API is preferred over SMTP when a refresh token is set", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    JWT_SECRET: "x",
    OTP_PEPPER: "y",
    SMTP_HOST: "smtp.gmail.com",
    GMAIL_CLIENT_ID: "id",
    GMAIL_CLIENT_SECRET: "secret",
    GMAIL_REFRESH_TOKEN: "token",
  });
  assert.equal(config.mailTransport, "gmail-api");
  assert.equal(config.logOtp, false);
});

test("Docker Mailpit SMTP stays in place", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    JWT_SECRET: "x",
    OTP_PEPPER: "y",
    SMTP_HOST: "mailpit",
    SMTP_PORT: "1025",
  });
  assert.equal(config.mailTransport, "smtp");
  assert.equal(config.smtpHost, "mailpit");
  assert.equal(config.smtpPort, 1025);
});

test("Gmail raw message is base64url", () => {
  const raw = encodeGmailRaw({
    from: "PadosiPro <a@gmail.com>",
    to: "b@example.com",
    subject: "Your PadosiPro verification code",
    text: "code 123456",
    html: "<p>123456</p>",
  });
  const decoded = Buffer.from(raw, "base64url").toString("utf8");
  assert.match(decoded, /To: b@example.com/);
  assert.match(decoded, /code 123456/);
  assert.equal(raw.includes("+"), false);
  assert.equal(raw.includes("/"), false);
});
