const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(values) {
  const fields = {};
  const email = values.email.trim().toLowerCase();
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  if (values.password.length < 8 || values.password.length > 72) {
    fields.password = "Use 8 to 72 characters.";
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    fields.password = "Include at least one letter and one number.";
  }
  if (values.confirmPassword !== values.password) fields.confirmPassword = "Passwords do not match.";
  return fields;
}

export function validateLogin(values) {
  const fields = {};
  if (!EMAIL.test(values.email.trim().toLowerCase())) fields.email = "Enter a valid email address.";
  if (!values.password) fields.password = "Enter your password.";
  return fields;
}

export function validateProfile(values) {
  const fields = {};
  const name = values.name.trim();
  const mobile = values.mobile.replace(/\s+/g, "");
  const address = values.address.trim();
  const businessName = values.businessName.trim();
  if (name.length < 2) fields.name = "Enter your name.";
  if (!/^[6-9]\d{9}$/.test(mobile)) fields.mobile = "Enter a 10-digit Indian mobile number.";
  if (address.length < 8 || address.length > 240) {
    fields.address = "Enter an address between 8 and 240 characters.";
  }
  if (businessName && (businessName.length < 2 || businessName.length > 80)) {
    fields.businessName = "Use 2 to 80 characters, or leave this blank.";
  }
  return fields;
}
