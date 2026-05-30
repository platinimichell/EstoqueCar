// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha obrigatória.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token obrigatório.' });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  logout(_req: Request, res: Response) {
    // JWT é stateless; logout é feito no cliente descartando o token
    res.json({ message: 'Logout realizado com sucesso.' });
  }
}

export default new AuthController();
