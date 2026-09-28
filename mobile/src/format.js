const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE = /^[6-9]\d{9}$/;

export function validateWelcome(email, mobile) {
  const fields = {};
  if (!MOBILE.test(String(mobile).replace(/\s+/g, ""))) {
    fields.mobile = "Enter a 10-digit Indian mobile number.";
  }
  if (!EMAIL.test(String(email).trim().toLowerCase())) {
    fields.email = "Enter a valid email address.";
  }
  return fields;
}

export function validateDetails(details, urgency, scheduledFor) {
  const fields = {};
  const note = String(details ?? "").trim();
  if (note.length < 3 || note.length > 500) {
    fields.details = "Add a short note, up to 500 characters.";
  }
  if (urgency === "scheduled" && String(scheduledFor ?? "").trim().length < 3) {
    fields.scheduledFor = "Add the day or time you have in mind.";
  }
  return fields;
}

export function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}•••@${domain}`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(profile, email) {
  const raw = profile?.name || String(email || "there").split("@")[0];
  const part = raw.split(/[._\s+-]/)[0] || "there";
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function shortCategory(name) {
  const map = {
    "Errands & Daily Tasks": "Errands",
    "Home Services": "Home",
    "Travel & Tourism": "Travel",
    "Health & Medical": "Health",
    "Senior Care": "Senior Care",
    "Events & Management": "Events",
    "Workforce Management": "Workforce",
    "Digital & Tech Help": "Digital",
    "Relocation Services": "Relocation",
    "Fashion & Styling": "Fashion",
    "Religious & Cultural": "Religious",
    "Business Support": "Business",
    "Education Support": "Education",
    "Insurance & Loans": "Insurance",
  };
  return map[name] || name;
}
