const crypto = require("crypto");

/**
 * AES-256-CBC encryption for invite transport tokens.
 *
 * The relationToken sent to the frontend is an AES-encrypted string
 * containing the MongoDB invite ID. This is NOT stored in the DB —
 * only the ID is stored. Decryption requires the INVITE_TOKEN_SECRET.
 */

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

/**
 * Derive a fixed-length 256-bit key from the secret string using SHA-256.
 */
function getKey() {
  const secret = process.env.INVITE_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("INVITE_TOKEN_SECRET must be set in environment and at least 16 characters");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plain text string and return a URL-safe base64 encoded string.
 * Format: iv:encrypted (both base64-encoded)
 */
function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Return iv:encrypted as URL-safe base64
  return `${iv.toString("base64url")}:${encrypted.replace(/\+/g, "-").replace(/\//g, "_")}`;
}

/**
 * Decrypt an encrypted string back to plain text.
 */
function decrypt(encryptedText) {
  const key = getKey();
  const [ivBase64, encryptedBase64] = encryptedText.split(":");

  if (!ivBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted token format");
  }

  // Restore standard base64 from URL-safe variant
  const iv = Buffer.from(ivBase64, "base64url");
  const encrypted = encryptedBase64.replace(/-/g, "+").replace(/_/g, "/");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = { encrypt, decrypt, getKey };
