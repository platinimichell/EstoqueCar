// src/controllers/order.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import orderService from '../services/order.service';

const createSchema = z.object({
  clientId: z.number().int().positive(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export class OrderController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.findAll({
        status: req.query.status as string,
        clientId: req.query.clientId ? Number(req.query.clientId) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(`${req.query.endDate}T23:59:59.999`) : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      res.json(result);
    } catch (err) { next(err); }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.findById(Number(req.params.id));
      res.json(order);
    } catch (err) { next(err); }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const order = await orderService.create({ ...data, userId: req.user!.userId });
      res.status(201).json(order);
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const order = await orderService.updateStatus(Number(req.params.id), status, req.user!.userId);
      res.json(order);
    } catch (err) { next(err); }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      await orderService.cancel(Number(req.params.id));
      res.json({ message: 'Pedido cancelado com sucesso.' });
    } catch (err) { next(err); }
  }
}

export default new OrderController();
