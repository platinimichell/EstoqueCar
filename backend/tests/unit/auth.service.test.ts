// tests/unit/auth.service.test.ts
// Testes unitários do AuthService

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock do Prisma
jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));


import authService from '../../src/services/auth.service';
import prisma from '../../src/config/prisma';
import { AppError } from '../../src/middlewares/error.middleware';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-12345';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-12345';
    process.env.JWT_EXPIRES_IN = '8h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('deve retornar token e dados do usuário quando credenciais são válidas', async () => {
      const hash = await bcrypt.hash('Mudar123@', 10);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        role: 'ADMIN',
        firstLogin: true,
        active: true,
      });

      const result = await authService.login('admin@test.com', 'Mudar123@');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('ADMIN');
    });

    it('deve lançar AppError 401 quando usuário não existe', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('naoexiste@test.com', 'senha123'))
        .rejects
        .toThrow(new AppError('E-mail ou senha inválidos.', 401));
    });

    it('deve lançar AppError 401 quando usuário está inativo', async () => {
      const hash = await bcrypt.hash('senha123', 10);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 2, email: 'inativo@test.com', passwordHash: hash, active: false,
      });

      await expect(authService.login('inativo@test.com', 'senha123'))
        .rejects
        .toThrow(new AppError('E-mail ou senha inválidos.', 401));
    });

    it('deve lançar AppError 401 quando senha está errada', async () => {
      const hash = await bcrypt.hash('senhaCorreta', 10);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1, email: 'user@test.com', passwordHash: hash, active: true,
      });

      await expect(authService.login('user@test.com', 'senhaErrada'))
        .rejects
        .toThrow(new AppError('E-mail ou senha inválidos.', 401));
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────

  describe('changePassword()', () => {
    it('deve trocar a senha e remover flag firstLogin com dados válidos', async () => {
      const oldHash = await bcrypt.hash('Mudar123@', 10);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1, passwordHash: oldHash,
      });

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 1 });

      await authService.changePassword(1, 'Mudar123@', 'NovaSenha@1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ firstLogin: false }),
        })
      );
    });

    it('deve rejeitar nova senha que não atende aos requisitos de segurança', async () => {
      const hash = await bcrypt.hash('Mudar123@', 10);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1, passwordHash: hash,
      });

      await expect(authService.changePassword(1, 'Mudar123@', 'senhasimples'))
        .rejects
        .toThrow(AppError);
    });

    it('deve rejeitar se a nova senha for igual à senha padrão', async () => {
      const hash = await bcrypt.hash('Mudar123@', 10);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1, passwordHash: hash,
      });

      await expect(authService.changePassword(1, 'Mudar123@', 'Mudar123@'))
        .rejects
        .toThrow(AppError);
    });
  });
});
