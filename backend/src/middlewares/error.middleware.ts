// src/middlewares/error.middleware.ts
// Middleware global de tratamento de erros

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos.',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Erros customizados da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Erro de duplicidade MySQL (Prisma)
  if ((err as any).code === 'P2002') {
    res.status(409).json({
      error: 'Já existe um registro com estes dados. Verifique campos únicos como e-mail, CPF/CNPJ ou código.',
    });
    return;
  }

  // Registro não encontrado (Prisma)
  if ((err as any).code === 'P2025') {
    res.status(404).json({ error: 'Registro não encontrado.' });
    return;
  }

  // Erro genérico
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
};
