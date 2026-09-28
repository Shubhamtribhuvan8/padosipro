import crypto from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(code, pepper) {
  return crypto.createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

function codesMatch(code, pepper, codeHash) {
  const actual = Buffer.from(hashOtpCode(code, pepper), "utf8");
  const expected = Buffer.from(codeHash, "utf8");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function issueOtp({ db, userId, pepper, now, mailer, email }) {
  const latest = db
    .prepare(
      "SELECT created_at FROM otp_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(userId);

  if (latest && now - latest.created_at < OTP_RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil(
      (OTP_RESEND_COOLDOWN_MS - (now - latest.created_at)) / 1000,
    );
    return {
      ok: false,
      status: 429,
      error: {
        code: "RESEND_COOLDOWN",
        message: `Please wait ${retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds,
      },
    };
  }

  db.prepare("UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0").run(userId);

  const code = generateOtpCode();
  db.prepare(
    `INSERT INTO otp_codes (id, user_id, code_hash, expires_at, attempts, used, created_at)
     VALUES (?, ?, ?, ?, 0, 0, ?)`,
  ).run(crypto.randomUUID(), userId, hashOtpCode(code, pepper), now + OTP_TTL_MS, now);

  mailer.sendOtp({ to: email, code });
  return { ok: true, retryAfterSeconds: 30 };
}

export function verifyOtp({ db, userId, code, pepper, now }) {
  const row = db
    .prepare(
      `SELECT id, code_hash, expires_at, attempts, used
       FROM otp_codes
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(userId);

  if (!row || row.used) {
    return fail("OTP_INVALID", "That code is not valid. Request a new one.");
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return fail("OTP_LOCKED", "Too many incorrect attempts. Request a new code.");
  }
  if (now > row.expires_at) {
    return fail("OTP_EXPIRED", "That code has expired. Request a new one.");
  }
  if (!/^\d{6}$/.test(code) || !codesMatch(code, pepper, row.code_hash)) {
    const attempts = row.attempts + 1;
    db.prepare("UPDATE otp_codes SET attempts = ? WHERE id = ?").run(attempts, row.id);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return fail("OTP_LOCKED", "Too many incorrect attempts. Request a new code.");
    }
    const left = OTP_MAX_ATTEMPTS - attempts;
    return fail("OTP_INVALID", `That code is incorrect. ${left} attempt${left === 1 ? "" : "s"} left.`);
  }

  db.prepare("UPDATE otp_codes SET used = 1 WHERE id = ?").run(row.id);
  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
  return { ok: true };
}

function fail(code, message) {
  return { ok: false, status: 400, error: { code, message } };
}
