import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const base64Key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!base64Key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not configured.");
  }
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

/** Encrypts a secret (e.g. an OAuth refresh token) into a single storable string. */
export function encryptSecret(plaintext: string, key: Buffer = getKey()): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((buf) => buf.toString("base64")).join(".");
}

/** Reverses `encryptSecret`. Throws if the ciphertext was tampered with or the key is wrong. */
export function decryptSecret(stored: string, key: Buffer = getKey()): string {
  const parts = stored.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret.");
  }
  const [ivB64, authTagB64, encryptedB64] = parts;
  if (!ivB64 || !authTagB64) {
    throw new Error("Malformed encrypted secret.");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
