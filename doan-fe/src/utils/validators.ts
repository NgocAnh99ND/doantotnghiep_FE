export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

export function isValidPhone(phone: string) {
  const p = normalizePhone(phone);
  return /^\+?\d{9,15}$/.test(p);
}

export function isValidPassword(pw: string) {
  return pw.trim().length >= 6;
}

export function isValidName(name: string) {
  return name.trim().length >= 2;
}
