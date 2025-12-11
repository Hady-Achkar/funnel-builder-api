export class TemporaryPasswordGenerator {
  private static readonly ADJECTIVES = [
    'Quick', 'Bright', 'Swift', 'Smart', 'Cool', 'Fast', 'Sharp', 'Strong',
    'Bold', 'Fresh', 'Clear', 'Prime', 'Pure', 'True', 'Safe', 'Sure'
  ];

  private static readonly NOUNS = [
    'Lion', 'Eagle', 'Tiger', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Star',
    'Moon', 'Sun', 'Fire', 'Wave', 'Rock', 'Tree', 'Wind', 'Sky'
  ];

  static generateReadablePassword(): string {
    const adjective = this.ADJECTIVES[Math.floor(Math.random() * this.ADJECTIVES.length)];
    const noun = this.NOUNS[Math.floor(Math.random() * this.NOUNS.length)];
    const number = Math.floor(Math.random() * 999) + 100; // 3-digit number
    
    return `${adjective}${noun}${number}`;
  }

  static generateSecurePassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}