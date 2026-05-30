// src/services/stock.service.ts
// Serviço de movimentação de estoque: entradas manuais e saídas por pedido

import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export interface StockEntryData {
  productId: number;
  quantity: number;
  notes?: string;
  userId: number;
}

export interface StockFilters {
  productId?: number;
  type?: 'ENTRY' | 'EXIT';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class StockService {
  /**
   * Registra uma entrada de estoque manual.
   * Incrementa a quantidade do produto e cria um registro de movimentação.
   */
  async registerEntry(data: StockEntryData) {
    if (data.quantity <= 0) {
      throw new AppError('A quantidade deve ser maior que zero.', 400);
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });

    if (!product) throw new AppError('Produto não encontrado.', 404);
    if (!product.active) throw new AppError('Produto inativo. Reative-o antes de registrar entradas.', 400);

    // Transação: atualiza produto + cria movimentação atomicamente
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: data.productId },
        data: { quantity: { increment: data.quantity } },
      }),
      prisma.stockMovement.create({
        data: {
          productId: data.productId,
          type: 'ENTRY',
          quantity: data.quantity,
          referenceType: 'MANUAL',
          notes: data.notes,
          userId: data.userId,
        },
      }),
    ]);

    return { product: updatedProduct, movement };
  }

  /**
   * Registra a saída do estoque ao baixar um pedido.
   * Chamado internamente pelo OrderService.
   */
  async registerExitForOrder(
    productId: number,
    quantity: number,
    orderId: number,
    userId: number,
    tx?: any
  ) {
    const db = tx || prisma;

    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product) throw new AppError(`Produto ID ${productId} não encontrado.`, 404);

    if (product.quantity < quantity) {
      throw new AppError(
        `Estoque insuficiente para "${product.name}". Disponível: ${product.quantity}, solicitado: ${quantity}.`,
        400
      );
    }

    await db.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    });

    await db.stockMovement.create({
      data: {
        productId,
        type: 'EXIT',
        quantity,
        referenceId: orderId,
        referenceType: 'ORDER',
        userId,
      },
    });
  }

  /**
   * Lista o histórico de movimentações de estoque com filtros.
   */
  async getMovements(filters: StockFilters) {
    const { productId, type, startDate, endDate, page = 1, limit = 30 } = filters;

    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Retorna produtos com estoque abaixo ou igual ao mínimo definido.
   */

  /*
  async getLowStockProducts() {
    return prisma.product.findMany({
      where: {
        active: true,
        //quantity < min_quantity
        // Prisma não suporta comparação entre campos diretamente no where,
        // então usamos raw query no ProductService para isso.
      },
      include: { category: true },
      orderBy: { quantity: 'asc' },
    });
  } */
/*
  async getLowStockProducts() {
  return prisma.$queryRaw`
    SELECT *
    FROM products
    WHERE active = 1
      AND quantity < min_quantity
    ORDER BY quantity ASC
    `;
  }*/

  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
    });
    
    return products.filter(
      p => p.quantity < p.minQuantity
    );
  }

  async getNormalStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    include: {
      category: true,
    },
  });

  return products.filter(
    p => p.quantity > p.minQuantity
  );
}

}

export default new StockService();
