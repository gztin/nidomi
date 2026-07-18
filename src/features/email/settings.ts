type EmailSettingsRow = {
  apiKeyCiphertext: string;
  apiKeyIv: string;
  fromName: string;
  fromEmail: string;
  updatedAt: string;
};

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function createEncryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptApiKey(apiKey: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await createEncryptionKey(secret),
    new TextEncoder().encode(apiKey),
  );
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function decryptApiKey(ciphertext: string, iv: string, secret: string) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    await createEncryptionKey(secret),
    base64ToBytes(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export async function getStoredEmailSettings(db: D1Database, encryptionSecret?: string) {
  const row = await db.prepare(
    "SELECT api_key_ciphertext apiKeyCiphertext,api_key_iv apiKeyIv,from_name fromName,from_email fromEmail,updated_at updatedAt FROM email_provider_settings WHERE provider='resend'",
  ).first<EmailSettingsRow>();
  if (!row) return null;
  return {
    ...row,
    apiKey: encryptionSecret
      ? await decryptApiKey(row.apiKeyCiphertext, row.apiKeyIv, encryptionSecret)
      : null,
  };
}

export function maskApiKey(apiKey: string) {
  return `${apiKey.slice(0, 3)}••••••••${apiKey.slice(-4)}`;
}
