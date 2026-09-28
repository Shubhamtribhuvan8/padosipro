const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE = /^[6-9]\d{9}$/;
const NAME = /^[\p{L}][\p{L} .'-]{0,79}$/u;

export function validateOtpStart(body) {
  const fields = {};
  const email = String(body?.email ?? "").trim().toLowerCase();
  const mobile = String(body?.mobile ?? "").replace(/\s+/g, "");
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  if (!MOBILE.test(mobile)) fields.mobile = "Enter a 10-digit Indian mobile number.";
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, email, mobile };
}

export function validateOtpRequest(body) {
  const fields = {};
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").replace(/\s+/g, "");
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  if (!/^\d{6}$/.test(code)) fields.code = "Enter the 6-digit code.";
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, email, code };
}

export function validateEmailOnly(body) {
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { ok: false, fields: { email: "Enter a valid email address." } };
  }
  return { ok: true, email };
}

export function validateProfile(body) {
  const fields = {};
  const name = String(body?.name ?? "").trim();
  const address = String(body?.address ?? "").trim();
  const businessRaw = body?.businessName;
  const businessName =
    businessRaw == null || String(businessRaw).trim() === "" ? null : String(businessRaw).trim();

  if (!NAME.test(name) || name.length < 2) {
    fields.name = "Enter your name using letters, spaces, or hyphens.";
  }
  if (address && (address.length < 8 || address.length > 240)) {
    fields.address = "Enter an address between 8 and 240 characters, or leave it blank.";
  }
  if (businessName && (businessName.length < 2 || businessName.length > 80)) {
    fields.businessName = "Business name should be 2 to 80 characters, or leave it blank.";
  }

  return Object.keys(fields).length
    ? { ok: false, fields }
    : { ok: true, value: { name, address, businessName } };
}

export function validateRequest(body, catalogue, urgencies) {
  const fields = {};
  const categoryId = String(body?.categoryId ?? "");
  const serviceId = String(body?.serviceId ?? "");
  const urgency = String(body?.urgency ?? "");
  const details = String(body?.details ?? "").trim();
  const scheduledFor = String(body?.scheduledFor ?? "").trim();
  const category = catalogue.find((item) => item.id === categoryId);
  const service = category?.services.find((item) => item.id === serviceId);

  if (!category) fields.categoryId = "Choose a category.";
  if (!service) fields.serviceId = "Choose a service.";
  if (!urgencies.some((item) => item.id === urgency)) fields.urgency = "Choose when you need this.";
  if (urgency === "scheduled" && scheduledFor.length < 3) {
    fields.scheduledFor = "Add the day or time you have in mind.";
  }
  if (details.length < 3 || details.length > 500) {
    fields.details = "Add a short note, up to 500 characters.";
  }

  return Object.keys(fields).length
    ? { ok: false, fields }
    : { ok: true, value: { category, service, urgency, details, scheduledFor: scheduledFor || null } };
}
