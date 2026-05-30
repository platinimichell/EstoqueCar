// src/controllers/stock.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import stockService from '../services/stock.service';

const entrySchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export class StockController {
  async entry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = entrySchema.parse(req.body);
      const result = await stockService.registerEntry({ ...data, userId: req.user!.userId });
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async movements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stockService.getMovements({
        productId: req.query.productId ? Number(req.query.productId) : undefined,
        type: req.query.type as 'ENTRY' | 'EXIT' | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 30,
      });
       

      res.json(result);

    } catch (err) { next(err); }
  }

  async lowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await stockService.getLowStockProducts();
      res.json(products);
    } catch (err) { next(err); }
  }
}

export default new StockController();
