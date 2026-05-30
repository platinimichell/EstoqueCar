// src/controllers/client.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import clientService from '../services/client.service';

const createSchema = z.object({
  name: z.string().min(2).max(150),
  documentType: z.enum(['CPF', 'CNPJ']),
  documentNumber: z.string().min(11).max(18),
  isClient: z.boolean().optional().default(true),
  isSupplier: z.boolean().optional().default(false),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

export class ClientController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const clients = await clientService.findAll({
        search: req.query.search as string,
        isSupplier: req.query.isSupplier === 'true' ? true : req.query.isSupplier === 'false' ? false : undefined,
        isClient: req.query.isClient === 'true' ? true : req.query.isClient === 'false' ? false : undefined,
      });
      res.json(clients);
    } catch (err) { next(err); }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientService.findById(Number(req.params.id));
      res.json(client);
    } catch (err) { next(err); }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const client = await clientService.create(data);
      res.status(201).json(client);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.partial().parse(req.body);
      const client = await clientService.update(Number(req.params.id), data);
      res.json(client);
    } catch (err) { next(err); }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      await clientService.deactivate(Number(req.params.id));
      res.json({ message: 'Cliente/Fornecedor desativado com sucesso.' });
    } catch (err) { next(err); }
  }
}

export default new ClientController();
