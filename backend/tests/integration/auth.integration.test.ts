// tests/integration/auth.integration.test.ts
// Testes de integração dos endpoints de autenticação

import request from 'supertest';
import app from '../../src/app';

// Mock do Prisma para não precisar de banco real nos testes
jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from '../../src/config/prisma';
import bcrypt from 'bcryptjs';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Endpoints — Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    process.env.JWT_EXPIRES_IN = '8h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  // ─── POST /api/auth/login ─────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('deve retornar 200 e tokens quando credenciais são válidas', async () => {
      const hash = await bcrypt.hash('Mudar123@', 10);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1, name: 'Admin', email: 'admin@test.com',
        passwordHash: hash, role: 'ADMIN', firstLogin: true, active: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Mudar123@' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('deve retornar 401 quando credenciais são inválidas', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente@test.com', password: 'qualquer' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar 400 quando e-mail tem formato inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'email-invalido', password: '123' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 quando campos obrigatórios estão ausentes', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com' }); // sem password

      expect(response.status).toBe(400);
    });
  });

  // ─── PUT /api/auth/change-password ────────────────────────────────────────

  describe('PUT /api/auth/change-password', () => {
    it('deve retornar 401 quando requisição não tem token', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({ currentPassword: 'Mudar123@', newPassword: 'Nova@Senha1' });

      expect(response.status).toBe(401);
    });
  });
});
