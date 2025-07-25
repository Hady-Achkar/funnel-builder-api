import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await AuthService.register({ email, name, password });
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message === 'User already exists') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await AuthService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        res.status(401).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await AuthService.forgotPassword({ email });
      res.json(result);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      const result = await AuthService.resetPassword({ token, newPassword });
      res.json(result);
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.message === 'Invalid or expired reset token') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}