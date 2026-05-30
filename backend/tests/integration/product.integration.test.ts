// tests/integration/product.integration.test.ts
// Testes de integração dos endpoints de produtos

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock do Azure Blob
jest.mock('../../src/utils/azure-blob.util', () => ({
  __esModule: true,
  default: { upload: jest.fn().mockResolvedValue('https://blob.azure.com/test.jpg') },
}));

import prisma from '../../src/config/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Helper: gera token JWT de teste
function makeToken(role: 'ADMIN' | 'USER' = 'ADMIN') {
  return jwt.sign(
    { userId: 1, role, email: 'test@test.com' },
    'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Products Endpoints — Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('GET /api/products', () => {
    it('deve retornar 200 com lista de produtos para usuário autenticado', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 1, code: 'FIL-001', name: 'Filtro de Óleo', quantity: 10, active: true, category: { name: 'Filtros' } },
      ]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveLength(1);
    });

    it('deve retornar 401 para requisição sem token', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/products', () => {
    it('deve criar produto com sucesso quando admin envia dados válidos', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null); // sem duplicidade

      (mockPrisma.product.create as jest.Mock).mockResolvedValue({
        id: 1, code: 'FIL-001', name: 'Filtro de Óleo', quantity: 0,
        category: { name: 'Filtros' },
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
        .send({ code: 'FIL-001', name: 'Filtro de Óleo', categoryId: 1, unitPrice: 18.90 });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('FIL-001');
    });

    it('deve retornar 403 quando usuário sem perfil ADMIN tenta criar produto', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${makeToken('USER')}`)
        .send({ code: 'FIL-001', name: 'Filtro de Óleo', categoryId: 1, unitPrice: 18.90 });

      expect(res.status).toBe(403);
    });

    it('deve retornar 409 quando código de produto já existe', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 99 }); // já existe

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
        .send({ code: 'FIL-001', name: 'Filtro Duplicado', categoryId: 1, unitPrice: 18.90 });

      expect(res.status).toBe(409);
    });
  });
});
