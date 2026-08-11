import CryptoJS from "crypto-js";

/**
 * Reversible AES-256 encryption for storing Gmail account passwords.
 * CRYPTO_SECRET_KEY must be a server-only env var (never NEXT_PUBLIC_*).
 * This file must only ever be imported from API routes / server code —
 * never from a "use client" component, or the secret would ship to the browser.
 */
function getSecretKey(): string {
  const key = process.env.CRYPTO_SECRET_KEY;
  if (!key) {
    throw new Error(
      "CRYPTO_SECRET_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your environment."
    );
  }
  return key;
}

export function encryptPassword(plainText: string): string {
  return CryptoJS.AES.encrypt(plainText, getSecretKey()).toString();
}

export function decryptPassword(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, getSecretKey());
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error("Failed to decrypt password — the stored value may be corrupted.");
  }
  return result;
}
