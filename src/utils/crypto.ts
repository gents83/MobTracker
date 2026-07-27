/**
 * Symmetric obfuscation utility for securing URL parameters.
 * Uses a standard, synchronous, URL-safe algorithm combining a custom reversible XOR
 * with a deterministic static key, followed by URL-safe Base64 encoding.
 * This guarantees the path-level/identifier parameter is hidden from immediate observation,
 * while being fully compatible with synchronous single-page app loading/initialization.
 */

const OBFL_KEY = "MOBTRACK_SECURE_KEY";

/**
 * Encrypts/obfuscates a plain text string into a URL-safe format.
 */
export function encryptPairId(plainText: string): string {
  if (!plainText) return "";

  // XOR encoding
  let xorResult = "";
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i) ^ OBFL_KEY.charCodeAt(i % OBFL_KEY.length);
    xorResult += String.fromCharCode(charCode);
  }

  // Convert to Base64
  const base64 = btoa(unescape(encodeURIComponent(xorResult)));

  // Make Base64 URL-safe (replace +, / and trim =)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decrypts/de-obfuscates a URL-safe formatted string back to its plain text format.
 */
export function decryptPairId(cipherText: string): string {
  if (!cipherText) return "";

  try {
    // Restore URL-safe Base64 formatting
    let base64 = cipherText
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Pad Base64 if needed
    const pad = base64.length % 4;
    if (pad > 0) {
      base64 += "=".repeat(4 - pad);
    }

    // Decode Base64
    const xorResult = decodeURIComponent(escape(atob(base64)));

    // Re-apply XOR to decrypt
    let plainText = "";
    for (let i = 0; i < xorResult.length; i++) {
      const charCode = xorResult.charCodeAt(i) ^ OBFL_KEY.charCodeAt(i % OBFL_KEY.length);
      plainText += String.fromCharCode(charCode);
    }

    return plainText;
  } catch (err) {
    console.error("Failed to decrypt pair ID:", err);
    return "";
  }
}
