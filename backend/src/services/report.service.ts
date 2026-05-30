// src/services/report.service.ts
// Geração de relatórios: estoque, movimentações, pedidos — exporta PDF e XLS

import prisma from '../config/prisma';
import pdfUtil from '../utils/pdf.util';
import excelUtil from '../utils/excel.util';

export type ReportFormat = 'pdf' | 'excel' | 'json';

export class ReportService {
  /**
   * Relatório de estoque atual.
   */
  async getStockReport(format: ReportFormat = 'json') {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    const data = products.map((p) => ({
      code: p.code,
      name: p.name,
      category: p.category.name,
      quantity: p.quantity,
      minQuantity: p.minQuantity,
      unitPrice: Number(p.unitPrice),
      totalValue: Number(p.unitPrice) * p.quantity,
      status: p.quantity <= p.minQuantity ? 'CRÍTICO' : 'OK',
    }));

    const totalValue = data.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStockCount = data.filter((p) => p.status === 'CRÍTICO').length;
    
    const reportData = { data, summary: { totalProducts: data.length, totalValue, lowStockCount } };

    if (format === 'pdf') return pdfUtil.generateStockReport(reportData);
    if (format === 'excel') return excelUtil.generateStockReport(reportData);
    return reportData; 
  }

  /**
   * Relatório de movimentações por período.
   */
  async getMovementsReport(startDate: Date, endDate: Date, format: ReportFormat = 'json') {
    const movements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        product: { select: { name: true, code: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = movements.map((m) => ({
      date: m.createdAt,
      type: m.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA',
      productCode: m.product.code,
      productName: m.product.name,
      quantity: m.quantity,
      user: m.user.name,
      notes: m.notes || '',
    }));

    if (format === 'pdf') return pdfUtil.generateMovementsReport({ data, startDate, endDate });
    if (format === 'excel') return excelUtil.generateMovementsReport({ data, startDate, endDate });
    /*return { data, period: { startDate, endDate } };*/
    return {
      data: data,
      period: {
        startDate,
        endDate
      }
    };
  }

  /**
   * Relatório de pedidos por período.
   */
  async getOrdersReport(startDate: Date, endDate: Date, format: ReportFormat = 'json') {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        client: { select: { name: true } },
        user: { select: { name: true } },
        orderItems: { include: { product: { select: { name: true, code: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt,
      client: o.client.name,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      itemsCount: o.orderItems.length,
      createdBy: o.user.name,
    }));

    const totalRevenue = data
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    if (format === 'pdf') return pdfUtil.generateOrdersReport({ data, startDate, endDate, totalRevenue });
    if (format === 'excel') return excelUtil.generateOrdersReport({ data, startDate, endDate, totalRevenue });
    return { data, summary: { totalOrders: data.length, totalRevenue }, period: { startDate, endDate } };
    
  }
}

export default new ReportService();
