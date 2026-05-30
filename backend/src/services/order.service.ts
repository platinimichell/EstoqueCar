// src/services/order.service.ts
// Serviço de pedidos: criação, atualização de status e baixa no estoque

import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import stockService from './stock.service';

export interface OrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderData {
  clientId: number;
  userId: number;
  items: OrderItemInput[];
  notes?: string;
}

export class OrderService {
  /**
   * Gera número de pedido sequencial com prefixo.
   * Ex: ORD-2024-0001
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.order.count({
      where: { orderNumber: { startsWith: `ORD-${year}` } },
    });
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(filters: { status?: string; clientId?: number; startDate?: Date; endDate?: Date; page?: number; limit?: number }) {
    const { status, clientId, startDate, endDate, page = 1, limit = 20 } = filters;
    const where: any = {};
    
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) { where.createdAt.lte = endDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, documentNumber: true } },
          user: { select: { id: true, name: true } },
          orderItems: {
            include: { product: { select: { id: true, name: true, code: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        user: { select: { id: true, name: true } },
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) throw new AppError('Pedido não encontrado.', 404);
    return order;
  }

  async create(data: CreateOrderData) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('O pedido deve conter ao menos um item.', 400);
    }

    // Busca os produtos para calcular o total
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      throw new AppError('Um ou mais produtos não foram encontrados ou estão inativos.', 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const subtotal = Number(product.unitPrice) * item.quantity;
      totalAmount += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        subtotal,
      };
    });

    const orderNumber = await this.generateOrderNumber();

    return prisma.order.create({
      data: {
        orderNumber,
        clientId: data.clientId,
        userId: data.userId,
        notes: data.notes,
        totalAmount,
        orderItems: { create: orderItemsData },
      },
      include: {
        client: true,
        orderItems: { include: { product: true } },
      },
    });
  }

  /**
   * Atualiza o status do pedido.
   * Ao mudar para COMPLETED, realiza a baixa no estoque (transação).
   */
  async updateStatus(id: number, newStatus: string, userId: number) {
    const order = await this.findById(id);

    const validTransitions: Record<string, string[]> = {
      PENDING: ['SEPARATED', 'CANCELLED'],
      SEPARATED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new AppError(
        `Não é possível mudar o status de "${order.status}" para "${newStatus}".`,
        400
      );
    }

    // Se está sendo completado, baixa o estoque em transação
    if (newStatus === 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await stockService.registerExitForOrder(
            item.productId,
            item.quantity,
            order.id,
            userId,
            tx
          );
        }

        await tx.order.update({
          where: { id },
          data: { status: newStatus as any },
        });
      });

      return this.findById(id);
    }

    return prisma.order.update({
      where: { id },
      data: { status: newStatus as any },
      include: { client: true, orderItems: { include: { product: true } } },
    });
  }

  async cancel(id: number) {
    const order = await this.findById(id);

    if (order.status === 'COMPLETED') {
      throw new AppError('Pedidos já baixados não podem ser cancelados.', 400);
    }

    return prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

export default new OrderService();
