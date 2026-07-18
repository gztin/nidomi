const encoder = new TextEncoder();
const decoder = new TextDecoder();

const letterCodes: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17,
  I: 34, J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23,
  Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30,
  Y: 31, Z: 33,
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function importSecret(secret: string, usage: "encrypt" | "hmac") {
  const bytes = base64ToBytes(secret.trim());
  if (bytes.byteLength !== 32) throw new Error("IDENTITY_SECRET_INVALID");
  return crypto.subtle.importKey(
    "raw",
    bytes,
    usage === "encrypt" ? { name: "AES-GCM" } : { name: "HMAC", hash: "SHA-256" },
    false,
    usage === "encrypt" ? ["encrypt", "decrypt"] : ["sign"],
  );
}

export function normalizeIdentityNumber(value: string) {
  return value.trim().replaceAll(/\s/g, "").toUpperCase();
}

export function isValidTaiwanIdentityNumber(value: string) {
  const normalized = normalizeIdentityNumber(value);
  if (!/^[A-Z][12]\d{8}$/.test(normalized)) return false;
  const letterCode = letterCodes[normalized[0]];
  if (!letterCode) return false;
  const digits = normalized.slice(1).split("").map(Number);
  const sum = Math.floor(letterCode / 10) + (letterCode % 10) * 9
    + digits.slice(0, 8).reduce((total, digit, index) => total + digit * (8 - index), 0)
    + digits[8];
  return sum % 10 === 0;
}

export function maskIdentityNumber(value: string) {
  const normalized = normalizeIdentityNumber(value);
  return `${normalized.slice(0, 2)}****${normalized.slice(-4)}`;
}

export async function protectIdentityNumber(value: string, encryptionSecret: string, hmacSecret: string) {
  const normalized = normalizeIdentityNumber(value);
  if (!isValidTaiwanIdentityNumber(normalized)) throw new Error("IDENTITY_NUMBER_INVALID");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptionKey = await importSecret(encryptionSecret, "encrypt");
  const hmacKey = await importSecret(hmacSecret, "hmac");
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, encryptionKey, encoder.encode(normalized));
  const lookupHmac = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(normalized));
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    lookupHmac: bytesToHex(new Uint8Array(lookupHmac)),
    masked: maskIdentityNumber(normalized),
  };
}

export async function revealIdentityNumber(ciphertext: string, iv: string, encryptionSecret: string) {
  const key = await importSecret(encryptionSecret, "encrypt");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );
  return decoder.decode(plaintext);
}
