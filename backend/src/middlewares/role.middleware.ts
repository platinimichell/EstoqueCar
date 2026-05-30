// src/middlewares/role.middleware.ts
// Middleware de autorização baseado em perfil (ADMIN / USER)

import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    return;
  }

  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  next();
};
