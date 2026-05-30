// tests/unit/stock.service.test.ts
// Testes unitários do StockService

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    product: { findUnique: jest.fn(), update: jest.fn() },
    stockMovement: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import stockService from '../../src/services/stock.service';
import prisma from '../../src/config/prisma';
import { AppError } from '../../src/middlewares/error.middleware';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('StockService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('registerEntry()', () => {
    it('deve registrar entrada e incrementar quantidade do produto', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 1, name: 'Filtro de Óleo', quantity: 10, active: true,
      });

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (ops) => {
        return [{ id: 1, quantity: 15 }, { id: 1, type: 'ENTRY', quantity: 5 }];
      });

      const result = await stockService.registerEntry({
        productId: 1,
        quantity: 5,
        notes: 'Reposição semanal',
        userId: 1,
      });

      expect(result.product.quantity).toBe(15);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('deve rejeitar entrada com quantidade zero ou negativa', async () => {
      await expect(
        stockService.registerEntry({ productId: 1, quantity: 0, userId: 1 })
      ).rejects.toThrow(new AppError('A quantidade deve ser maior que zero.', 400));
    });

    it('deve rejeitar entrada para produto inexistente', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        stockService.registerEntry({ productId: 999, quantity: 5, userId: 1 })
      ).rejects.toThrow(new AppError('Produto não encontrado.', 404));
    });

    it('deve rejeitar entrada para produto inativo', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 1, name: 'Produto Inativo', active: false,
      });

      await expect(
        stockService.registerEntry({ productId: 1, quantity: 5, userId: 1 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('registerExitForOrder()', () => {
    it('deve rejeitar saída quando estoque é insuficiente', async () => {
      const mockDb = {
        product: {
          findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Pastilha', quantity: 2 }),
        },
      };

      await expect(
        stockService.registerExitForOrder(1, 5, 10, 1, mockDb)
      ).rejects.toThrow(AppError);
    });
  });
});
