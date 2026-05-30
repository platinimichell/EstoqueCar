// src/services/auth.service.ts
// Serviço de autenticação: login, troca de senha, geração de tokens

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'Mudar123@';
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    firstLogin: boolean;
  };
}

export class AuthService {
  /**
   * Realiza o login do usuário.
   * Se a senha for a padrão, sinaliza que o usuário deve trocá-la.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const payload = { userId: user.id, role: user.role, email: user.email };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        firstLogin: user.firstLogin,
      },
    };
  }

  /**
   * Troca a senha do usuário.
   * Após a troca bem-sucedida, remove o flag firstLogin.
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatch) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    // Valida a nova senha: mínimo 8 chars, letra maiúscula, número, caractere especial
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new AppError(
        'A nova senha deve ter ao menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.',
        400
      );
    }

    if (newPassword === DEFAULT_PASSWORD) {
      throw new AppError('A nova senha não pode ser a senha padrão do sistema.', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        firstLogin: false,
      },
    });
  }

  /**
   * Renova o access token usando o refresh token.
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        userId: number;
        role: string;
        email: string;
      };

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.active) {
        throw new AppError('Sessão inválida.', 401);
      }

      const payload = { userId: user.id, role: user.role, email: user.email };
      const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);

      return { token: newToken };
    } catch {
      throw new AppError('Refresh token inválido ou expirado.', 401);
    }
  }
}

export default new AuthService();
