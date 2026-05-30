// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER']),
});

export class UserController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (err) { next(err); }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(Number(req.params.id));
      res.json(user);
    } catch (err) { next(err); }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const user = await userService.create(data);
      res.status(201).json(user);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = z.object({
        name: z.string().optional(),
        role: z.enum(['ADMIN', 'USER']).optional(),
        active: z.boolean().optional(),
      }).parse(req.body);
      const user = await userService.update(Number(req.params.id), data);
      res.json(user);
    } catch (err) { next(err); }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deactivate(Number(req.params.id), req.user!.userId);
      res.json({ message: 'Usuário desativado com sucesso.' });
    } catch (err) { next(err); }
  }
}

export default new UserController();
