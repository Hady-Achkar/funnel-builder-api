import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const SALT_LENGTH = 64; // 64 bytes for salt

/**
 * Get the encryption key from environment variables
 * Falls back to a default key for development (NOT for production)
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // For development only - generate a consistent key
    // In production, this should throw an error
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY environment variable is required in production"
      );
    }
    console.warn(
      "WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!"
    );
    return crypto
      .createHash("sha256")
      .update("default-dev-key-change-in-production")
      .digest("hex");
  }

  return key;
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text - The plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:salt:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from encryption key and salt
    const encryptionKey = getEncryptionKey();
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, "sha256");

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:salt:encryptedData
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${salt.toString(
      "hex"
    )}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param encryptedText - The encrypted text in format: iv:authTag:salt:encryptedData
 * @returns The decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivHex, authTagHex, saltHex, encryptedData] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const salt = Buffer.from(saltHex, "hex");

    // Derive key from encryption key and salt
    const encryptionKey = getEncryptionKey();
    const key = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, "sha256");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`);
  }
}
