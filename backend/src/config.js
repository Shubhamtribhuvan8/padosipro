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

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? "development";
  const smtpUser = unquote(env.SMTP_USER || env.EMAIL_USER);
  const smtpPass = unquote(env.SMTP_PASS || env.EMAIL_PASSWORD).replace(/\s+/g, "");
  const smtpHost = unquote(env.SMTP_HOST || env.EMAIL_HOST) || (smtpUser ? "smtp.gmail.com" : "");
  return {
    nodeEnv,
    port: Number(env.PORT ?? 4000),
    jwtSecret: env.JWT_SECRET || (nodeEnv === "production" ? "" : "dev-jwt-secret-change-me"),
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    otpPepper: env.OTP_PEPPER || (nodeEnv === "production" ? "" : "dev-otp-pepper-change-me"),
    databasePath: env.DATABASE_PATH || path.join(root, "data", "padosipro.db"),
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? (nodeEnv === "test" ? 4 : 10)),
    smtpHost,
    smtpPort: Number(unquote(env.SMTP_PORT || env.EMAIL_PORT) || (smtpHost === "smtp.gmail.com" ? 465 : 1025)),
    smtpUser,
    smtpPass,
    mailFrom: unquote(env.MAIL_FROM || env.EMAIL_FROM) || "PadosiPro <noreply@padosipro.local>",
    outboxDir: env.OUTBOX_DIR || path.join(root, "outbox"),
    logOtp: nodeEnv !== "production" || !smtpHost,
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
