/**
 * Generate Temporary Password Utility
 *
 * Generates cryptographically secure temporary passwords for migrated users
 *
 * @see ARCHITECTURE.md - Service utility patterns
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically secure temporary password
 *
 * Password format:
 * - 16 characters total
 * - Mix of uppercase, lowercase, and numbers
 * - No special characters (easier for users to type)
 * - Cryptographically random using Node crypto module
 *
 * @returns {string} A 16-character temporary password
 *
 * @example
 * const password = generateTempPassword();
 * // Returns something like: "Kx9mP2nQ4rT8vL3w"
 */
export function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O for clarity
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // Removed i, l, o for clarity
  const numbers = '23456789'; // Removed 0, 1 for clarity

  const allChars = uppercase + lowercase + numbers;

  let password = '';

  // Ensure at least 2 uppercase, 2 lowercase, and 2 numbers
  password += getRandomChar(uppercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(numbers);
  password += getRandomChar(numbers);

  // Fill remaining 10 characters randomly
  for (let i = 0; i < 10; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password);
}

/**
 * Gets a cryptographically random character from a character set
 */
function getRandomChar(charset: string): string {
  const randomIndex = crypto.randomInt(0, charset.length);
  return charset[randomIndex];
}

/**
 * Shuffles a string using Fisher-Yates algorithm with crypto random
 */
function shuffleString(str: string): string {
  const chars = str.split('');

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
