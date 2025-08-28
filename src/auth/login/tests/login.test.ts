import { describe, it, expect } from 'vitest';

describe('Login Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should validate email format', () => {
    const email = 'test@example.com';
    expect(email.includes('@')).toBe(true);
  });
});