import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { CATALOGUE, URGENCIES } from "./catalogue.js";
import { issueOtp, verifyOtp } from "./otp.js";
import { validateEmailOnly, validateOtpRequest, validateOtpStart, validateProfile, validateRequest } from "./validate.js";

export function createApp({ db, config, mailer, now = () => Date.now() }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/auth/otp", (req, res) => {
    const parsed = validateOtpStart(req.body);
    if (!parsed.ok) return validation(res, parsed.fields);

    const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(parsed.email);
    if (existing?.email_verified && existing.mobile && existing.mobile !== parsed.mobile) {
      return error(res, 409, "MOBILE_MISMATCH", "This email is linked to a different mobile number.");
    }

    const userId = existing?.id ?? crypto.randomUUID();
    if (existing) {
      db.prepare("UPDATE users SET mobile = ? WHERE id = ?").run(parsed.mobile, userId);
    } else {
      db.prepare(
        "INSERT INTO users (id, email, password_hash, email_verified, tasks_confirmed, mobile, created_at) VALUES (?, ?, '', 0, 0, ?, ?)",
      ).run(userId, parsed.email, parsed.mobile, new Date(now()).toISOString());
    }

    const issued = issueOtp({
      db,
      userId,
      pepper: config.otpPepper,
      now: now(),
      mailer,
      email: parsed.email,
    });
    if (!issued.ok) return res.status(issued.status).json({ error: issued.error });

    res.status(existing ? 200 : 201).json({
      email: parsed.email,
      mobile: parsed.mobile,
      message: "We've sent a code to your email. It expires in 10 minutes.",
      retryAfterSeconds: issued.retryAfterSeconds,
    });
  });

  app.post("/api/auth/verify", (req, res) => {
    const parsed = validateOtpRequest(req.body);
    if (!parsed.ok) return validation(res, parsed.fields);
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(parsed.email);
    if (!user) return error(res, 400, "OTP_INVALID", "That code is not valid. Request a new one.");

    if (!user.email_verified) {
      const result = verifyOtp({
        db,
        userId: user.id,
        code: parsed.code,
        pepper: config.otpPepper,
        now: now(),
      });
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      ensureProfile(db, user, now());
    } else {
      const result = verifyOtp({
        db,
        userId: user.id,
        code: parsed.code,
        pepper: config.otpPepper,
        now: now(),
      });
      if (!result.ok) return res.status(result.status).json({ error: result.error });
    }

    const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    const token = jwt.sign({ sub: fresh.id, email: fresh.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    res.json({ token, ...mePayload(db, fresh) });
  });

  app.post("/api/auth/resend", (req, res) => {
    const parsed = validateEmailOnly(req.body);
    if (!parsed.ok) return validation(res, parsed.fields);
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.email);
    if (!user) {
      return res.json({ message: "If that account exists, a code is on its way.", retryAfterSeconds: 30 });
    }
    const issued = issueOtp({
      db,
      userId: user.id,
      pepper: config.otpPepper,
      now: now(),
      mailer,
      email: parsed.email,
    });
    if (!issued.ok) return res.status(issued.status).json({ error: issued.error });
    res.json({ message: "We sent a new code to your email.", retryAfterSeconds: issued.retryAfterSeconds });
  });

  app.get("/api/me", requireUser, (req, res) => {
    res.json(mePayload(db, req.user));
  });

  app.put("/api/profile", requireUser, (req, res) => {
    const parsed = validateProfile(req.body);
    if (!parsed.ok) return validation(res, parsed.fields);
    const { name, address, businessName } = parsed.value;
    const mobile = req.user.mobile || "";
    db.prepare(
      `INSERT INTO profiles (user_id, name, mobile, address, business_name, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         name = excluded.name,
         mobile = excluded.mobile,
         address = excluded.address,
         business_name = excluded.business_name,
         updated_at = excluded.updated_at`,
    ).run(req.user.id, name, mobile, address, businessName, new Date(now()).toISOString());
    res.json(mePayload(db, req.user));
  });

  app.get("/api/catalogue", requireUser, (_req, res) => {
    res.json({ categories: publicCatalogue(), urgencies: URGENCIES });
  });

  app.get("/api/requests", requireUser, (req, res) => {
    res.json({ requests: listRequests(db, req.user.id) });
  });

  app.get("/api/requests/:id", requireUser, (req, res) => {
    const request = listRequests(db, req.user.id).find((item) => item.id === req.params.id);
    if (!request) return error(res, 404, "NOT_FOUND", "We could not find that request.");
    res.json({ request });
  });

  app.post("/api/requests", requireUser, (req, res) => {
    const parsed = validateRequest(req.body, publicCatalogue(), URGENCIES);
    if (!parsed.ok) return validation(res, parsed.fields);
    const { category, service, urgency, details, scheduledFor } = parsed.value;
    const id = crypto.randomUUID();
    const timestamp = new Date(now()).toISOString();
    db.prepare(
      `INSERT INTO requests (id, user_id, category_id, category_name, service_id, service_name, urgency, scheduled_for, details, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(id, req.user.id, category.id, category.name, service.id, service.name, urgency, scheduledFor, details, timestamp, timestamp);
    const request = listRequests(db, req.user.id).find((item) => item.id === id);
    res.status(201).json({ request });
  });

  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.parse.failed") {
      return errorResponse(res, 400, "BAD_JSON", "Request body must be JSON.");
    }
    console.error(error);
    return errorResponse(res, 500, "INTERNAL", "Something went wrong. Please try again.");
  });

  function requireUser(req, res, next) {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return error(res, 401, "UNAUTHORIZED", "Please log in again.");
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
      if (!user || !user.email_verified) return error(res, 401, "UNAUTHORIZED", "Please log in again.");
      req.user = user;
      next();
    } catch {
      return error(res, 401, "UNAUTHORIZED", "Your session has expired. Please log in again.");
    }
  }

  return app;
}

function ensureProfile(db, user, nowMs) {
  const existing = db.prepare("SELECT user_id FROM profiles WHERE user_id = ?").get(user.id);
  if (existing) return;
  const local = user.email.split("@")[0].split(/[._+-]/)[0] || "there";
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  db.prepare(
    "INSERT INTO profiles (user_id, name, mobile, address, business_name, updated_at) VALUES (?, ?, ?, '', NULL, ?)",
  ).run(user.id, name, user.mobile || "", new Date(nowMs).toISOString());
}

function mePayload(db, user) {
  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(user.id);
  return {
    user: {
      id: fresh.id,
      email: fresh.email,
      mobile: fresh.mobile,
      emailVerified: Boolean(fresh.email_verified),
    },
    profile: profile
      ? {
          name: profile.name,
          mobile: profile.mobile,
          address: profile.address,
          businessName: profile.business_name,
        }
      : null,
    requests: listRequests(db, user.id),
  };
}

function listRequests(db, userId) {
  return db
    .prepare(
      `SELECT id, category_id, category_name, service_id, service_name, urgency, scheduled_for, details, status, created_at, updated_at
       FROM requests WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      serviceId: row.service_id,
      serviceName: row.service_name,
      urgency: row.urgency,
      scheduledFor: row.scheduled_for,
      details: row.details,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
}

function publicCatalogue() {
  return CATALOGUE.map((category) => ({
    id: category.id,
    name: category.name,
    blurb: category.blurb,
    icon: category.icon,
    soon: category.soon,
    services: category.services,
  }));
}

function validation(res, fields) {
  const message = Object.values(fields)[0] ?? "Please check the form.";
  return res.status(400).json({ error: { code: "VALIDATION", message, fields } });
}

function error(res, status, code, message) {
  return errorResponse(res, status, code, message);
}

function errorResponse(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}
