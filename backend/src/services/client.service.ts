// src/services/client.service.ts
// Serviço de clientes e fornecedores (um cadastro pode ser os dois)

import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export interface CreateClientData {
  name: string;
  documentType: 'CPF' | 'CNPJ';
  documentNumber: string;
  isClient?: boolean;
  isSupplier?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export class ClientService {
  async findAll(filters: { search?: string; isSupplier?: boolean; isClient?: boolean }) {
    const { search, isSupplier, isClient } = filters;
    const where: any = { active: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }
    if (isSupplier !== undefined) where.isSupplier = isSupplier;
    if (isClient !== undefined) where.isClient = isClient;

    return prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new AppError('Cliente/Fornecedor não encontrado.', 404);
    return client;
  }

  async create(data: CreateClientData) {
    // Remove formatação do documento para armazenar apenas dígitos
    const cleanDoc = data.documentNumber.replace(/\D/g, '');

    const exists = await prisma.client.findUnique({ where: { documentNumber: cleanDoc } });
    if (exists) {
      throw new AppError(
        `Já existe um cadastro com o ${data.documentType} "${data.documentNumber}".`,
        409
      );
    }

    if (!data.isClient && !data.isSupplier) {
      throw new AppError('O cadastro deve ser marcado como cliente e/ou fornecedor.', 400);
    }

    return prisma.client.create({
      data: { ...data, documentNumber: cleanDoc },
    });
  }

  async update(id: number, data: Partial<CreateClientData>) {
    await this.findById(id);
    const { documentNumber, ...updateData } = data;
    return prisma.client.update({ where: { id }, data: updateData });
  }

  async deactivate(id: number) {
    await this.findById(id);
    return prisma.client.update({ where: { id }, data: { active: false } });
  }
}

export default new ClientService();
