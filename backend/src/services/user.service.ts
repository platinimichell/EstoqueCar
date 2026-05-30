// src/services/user.service.ts
// Serviço de gerenciamento de usuários (apenas ADMIN)

import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'Mudar123@';

export class UserService {
  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true, name: true, email: true,
        role: true, active: true, firstLogin: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true,
        role: true, active: true, firstLogin: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    return user;
  }

  async create(data: { name: string; email: string; role: 'ADMIN' | 'USER' }) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError('Já existe um usuário com este e-mail.', 409);

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash,
        firstLogin: true,
      },
      select: {
        id: true, name: true, email: true,
        role: true, active: true, firstLogin: true,
        createdAt: true,
      },
    });

    return { ...user, defaultPassword: DEFAULT_PASSWORD };
  }

  async update(id: number, data: { name?: string; role?: 'ADMIN' | 'USER'; active?: boolean }) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true,
        role: true, active: true, createdAt: true,
      },
    });
  }

  async deactivate(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new AppError('Você não pode desativar sua própria conta.', 400);
    }
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }
}

export default new UserService();
