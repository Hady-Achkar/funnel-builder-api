import { getPrisma } from "../../../lib/prisma";

export class UsernameGenerator {
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly MAX_USERNAME_LENGTH = 30;

  /**
   * Generate a unique username from first name, last name, and email
   */
  static async generateUniqueUsername(
    firstName: string,
    lastName: string,
    email: string
  ): Promise<string> {
    const prisma = getPrisma();

    // Clean and prepare base components
    const cleanFirstName = this.cleanString(firstName);
    const cleanLastName = this.cleanString(lastName);
    const emailLocal = email.split("@")[0];
    const cleanEmailLocal = this.cleanString(emailLocal);

    // Try different combinations
    const baseOptions = [
      `${cleanFirstName}${cleanLastName}`,
      `${cleanFirstName}_${cleanLastName}`,
      `${cleanFirstName}${cleanEmailLocal}`,
      `${cleanFirstName}_${cleanEmailLocal}`,
      `${cleanEmailLocal}${cleanLastName}`,
      `${cleanEmailLocal}_${cleanLastName}`,
      cleanEmailLocal,
      `${cleanFirstName}${cleanLastName.charAt(0)}`,
      `${cleanFirstName.charAt(0)}${cleanLastName}`,
    ];

    // Try each base option
    for (const baseUsername of baseOptions) {
      const truncatedBase = this.truncateToMaxLength(baseUsername);
      
      // Try without number first
      if (await this.isUsernameAvailable(truncatedBase)) {
        return truncatedBase;
      }

      // Try with numbers
      for (let i = 1; i <= this.MAX_ATTEMPTS; i++) {
        const numberedUsername = this.truncateToMaxLength(`${truncatedBase}${i}`);
        if (await this.isUsernameAvailable(numberedUsername)) {
          return numberedUsername;
        }
      }
    }

    // Fallback: use random string
    return this.generateFallbackUsername();
  }

  /**
   * Clean string by removing special characters and converting to lowercase
   */
  private static cleanString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 15); // Limit individual components
  }

  /**
   * Truncate username to maximum length
   */
  private static truncateToMaxLength(username: string): string {
    return username.substring(0, this.MAX_USERNAME_LENGTH);
  }

  /**
   * Check if username is available in database
   */
  private static async isUsernameAvailable(username: string): Promise<boolean> {
    const prisma = getPrisma();
    
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    return !existingUser;
  }

  /**
   * Generate fallback username using timestamp
   */
  private static generateFallbackUsername(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${randomPart}`;
  }
}