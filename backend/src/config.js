import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function unquote(value) {
  const text = String(value ?? "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function resolveMail(env, nodeEnv) {
  const gmailClientId = unquote(env.GMAIL_CLIENT_ID);
  const gmailClientSecret = unquote(env.GMAIL_CLIENT_SECRET);
  const gmailRefreshToken = unquote(env.GMAIL_REFRESH_TOKEN);
  const brevoApiKey = unquote(env.BREVO_API_KEY);
  const resendApiKey = unquote(env.RESEND_API_KEY);
  const smtpUser = unquote(env.SMTP_USER || env.EMAIL_USER);
  const smtpPass = unquote(env.SMTP_PASS || env.EMAIL_PASSWORD).replace(/\s+/g, "");
  const explicitHost = unquote(env.SMTP_HOST || env.EMAIL_HOST);

  if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
    return {
      mailTransport: "gmail-api",
      smtpHost: "",
      smtpUser,
      smtpPass,
      gmailClientId,
      gmailClientSecret,
      gmailRefreshToken,
      brevoApiKey: "",
      resendApiKey: "",
    };
  }
  if (brevoApiKey) {
    return {
      mailTransport: "brevo",
      smtpHost: "",
      smtpUser,
      smtpPass,
      gmailClientId: "",
      gmailClientSecret: "",
      gmailRefreshToken: "",
      brevoApiKey,
      resendApiKey: "",
    };
  }
  if (resendApiKey) {
    return {
      mailTransport: "resend",
      smtpHost: "",
      smtpUser,
      smtpPass,
      gmailClientId: "",
      gmailClientSecret: "",
      gmailRefreshToken: "",
      brevoApiKey: "",
      resendApiKey,
    };
  }

  let smtpHost = explicitHost;
  if (!smtpHost && smtpUser && smtpPass && nodeEnv !== "production") {
    smtpHost = "smtp.gmail.com";
  }
  if (smtpHost === "smtp.gmail.com" && nodeEnv === "production") {
    smtpHost = "";
  }

  return {
    mailTransport: smtpHost ? "smtp" : "outbox",
    smtpHost,
    smtpUser,
    smtpPass,
    gmailClientId: "",
    gmailClientSecret: "",
    gmailRefreshToken: "",
    brevoApiKey: "",
    resendApiKey: "",
  };
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? "development";
  const mail = resolveMail(env, nodeEnv);
  const httpsMail = mail.mailTransport === "gmail-api" || mail.mailTransport === "brevo" || mail.mailTransport === "resend";
  return {
    nodeEnv,
    port: Number(env.PORT ?? 4000),
    jwtSecret: env.JWT_SECRET || (nodeEnv === "production" ? "" : "dev-jwt-secret-change-me"),
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    otpPepper: env.OTP_PEPPER || (nodeEnv === "production" ? "" : "dev-otp-pepper-change-me"),
    databasePath: env.DATABASE_PATH || path.join(root, "data", "padosipro.db"),
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? (nodeEnv === "test" ? 4 : 10)),
    ...mail,
    smtpPort: Number(unquote(env.SMTP_PORT || env.EMAIL_PORT) || (mail.smtpHost === "smtp.gmail.com" ? 465 : 1025)),
    mailFrom: unquote(env.MAIL_FROM || env.EMAIL_FROM) || "PadosiPro <noreply@padosipro.local>",
    outboxDir: env.OUTBOX_DIR || path.join(root, "outbox"),
    logOtp: nodeEnv !== "production" || (!mail.smtpHost && !httpsMail),
  };
}

export function assertConfig(config) {
  if (!config.jwtSecret || !config.otpPepper) {
    throw new Error("JWT_SECRET and OTP_PEPPER are required in production.");
  }
  if (!Number.isFinite(config.port) || config.port <= 0) {
    throw new Error("PORT must be a positive number.");
  }
}
