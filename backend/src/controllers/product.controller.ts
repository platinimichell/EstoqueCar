// src/controllers/product.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import productService from '../services/product.service';

const createSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  description: z.string().optional(),
  categoryId: z.coerce.number().int().positive(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  unitPrice: z.coerce.number().positive(),
  supplier: z.string().optional(),
});

export class ProductController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      /*
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        lowStock: req.query.lowStock === 'true',
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      */
     const filters = {
      search: req.query.search as string,
      categoryId: req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined,
      lowStock: req.query.lowStock === 'true',
      normalStock: req.query.normalStock === 'true',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };


      const result = await productService.findAll(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findById(Number(req.params.id));
      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const file = req.file;

      const product = await productService.create({
        ...data,
        imageBuffer: file?.buffer,
        imageContentType: file?.mimetype,
      });

      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.partial().parse(req.body);
      const file = req.file;

      const product = await productService.update(Number(req.params.id), {
        ...data,
        imageBuffer: file?.buffer,
        imageContentType: file?.mimetype,
      });

      res.json(product);
    } catch (err) {
      next(err);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deactivate(Number(req.params.id));
      res.json({ message: 'Produto desativado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}

export default new ProductController();
