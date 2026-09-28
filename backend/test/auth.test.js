import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS, generateOtpCode, hashOtpCode } from "../src/otp.js";

const config = {
  jwtSecret: "test-jwt-secret",
  jwtExpiresIn: "1h",
  otpPepper: "test-pepper",
  bcryptRounds: 4,
};

function setup() {
  const db = openDatabase(":memory:");
  const sent = [];
  const mailer = { sendOtp({ to, code }) { sent.push({ to, code }); } };
  let clock = Date.parse("2026-09-28T09:00:00.000Z");
  const app = createApp({ db, config, mailer, now: () => clock });
  return {
    app,
    db,
    sent,
    advance(ms) { clock += ms; },
  };
}

async function listen(app) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

async function api(base, path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  return { status: response.status, json };
}

test("OTP codes are 6 digits and only the hash is comparable", () => {
  const code = generateOtpCode();
  assert.match(code, /^\d{6}$/);
  const hash = hashOtpCode(code, "pepper");
  assert.notEqual(hash, code);
  assert.equal(hash, hashOtpCode(code, "pepper"));
});

test("phone and email OTP signs the user in", async (t) => {
  const ctx = setup();
  const { server, base } = await listen(ctx.app);
  t.after(() => server.close());

  const started = await api(base, "/api/auth/otp", {
    method: "POST",
    body: { email: "Home@Example.com", mobile: "9876543210" },
  });
  assert.equal(started.status, 201);
  assert.equal(ctx.sent[0].to, "home@example.com");
  const stored = ctx.db.prepare("SELECT code_hash FROM otp_codes").get();
  assert.notEqual(stored.code_hash, ctx.sent[0].code);

  const wrong = await api(base, "/api/auth/verify", {
    method: "POST",
    body: { email: "home@example.com", code: ctx.sent[0].code === "000000" ? "000001" : "000000" },
  });
  assert.equal(wrong.json.error.code, "OTP_INVALID");

  const verified = await api(base, "/api/auth/verify", {
    method: "POST",
    body: { email: "home@example.com", code: ctx.sent[0].code },
  });
  assert.equal(verified.status, 200);
  assert.ok(verified.json.token);
  assert.equal(verified.json.user.mobile, "9876543210");
  assert.equal(verified.json.profile.name, "Home");

  const me = await api(base, "/api/me", { token: verified.json.token });
  assert.equal(me.status, 200);
});

test("OTP expires, locks after 5 attempts, and resend waits 30 seconds", async (t) => {
  const ctx = setup();
  const { server, base } = await listen(ctx.app);
  t.after(() => server.close());

  await api(base, "/api/auth/otp", {
    method: "POST",
    body: { email: "expire@example.com", mobile: "9876543210" },
  });
  const code = ctx.sent[0].code;
  ctx.advance(OTP_TTL_MS + 1);
  const expired = await api(base, "/api/auth/verify", {
    method: "POST",
    body: { email: "expire@example.com", code },
  });
  assert.equal(expired.json.error.code, "OTP_EXPIRED");

  ctx.advance(31_000);
  const resent = await api(base, "/api/auth/resend", {
    method: "POST",
    body: { email: "expire@example.com" },
  });
  assert.equal(resent.status, 200);
  const fresh = ctx.sent.at(-1).code;
  for (let attempt = 1; attempt <= OTP_MAX_ATTEMPTS; attempt += 1) {
    const result = await api(base, "/api/auth/verify", {
      method: "POST",
      body: { email: "expire@example.com", code: fresh === "111111" ? "222222" : "111111" },
    });
    assert.equal(result.json.error.code, attempt === OTP_MAX_ATTEMPTS ? "OTP_LOCKED" : "OTP_INVALID");
  }

  const tooSoon = await api(base, "/api/auth/resend", {
    method: "POST",
    body: { email: "expire@example.com" },
  });
  assert.equal(tooSoon.status, 429);
  assert.equal(tooSoon.json.error.code, "RESEND_COOLDOWN");
});

test("catalogue has the service groups and a request can be saved", async (t) => {
  const ctx = setup();
  const { server, base } = await listen(ctx.app);
  t.after(() => server.close());
  await api(base, "/api/auth/otp", {
    method: "POST",
    body: { email: "asha@example.com", mobile: "9876543210" },
  });
  const verified = await api(base, "/api/auth/verify", {
    method: "POST",
    body: { email: "asha@example.com", code: ctx.sent[0].code },
  });
  const token = verified.json.token;
  const catalogue = await api(base, "/api/catalogue", { token });
  assert.ok(catalogue.json.categories.length >= 8);
  const services = catalogue.json.categories.reduce((sum, category) => sum + category.services.length, 0);
  assert.ok(services >= 20);

  const bad = await api(base, "/api/requests", {
    method: "POST",
    token,
    body: { categoryId: "education", serviceId: "missing", urgency: "express", details: "test" },
  });
  assert.equal(bad.status, 400);

  const created = await api(base, "/api/requests", {
    method: "POST",
    token,
    body: {
      categoryId: "education",
      serviceId: "tutors",
      urgency: "express",
      details: "Need a tutor this week",
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.request.serviceName, "Tutors & Classes");
  assert.equal(created.json.request.status, "pending");
});
