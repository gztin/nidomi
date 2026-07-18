const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const randomToken = () => crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");

export async function sha256(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashPassword(password: string, salt = randomToken().slice(0, 32)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 210000 }, key, 256);
  return `pbkdf2-sha256$210000$${salt}$${hex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterations, salt] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || iterations !== "210000" || !salt) return false;
  return (await hashPassword(password, salt)) === stored;
}
