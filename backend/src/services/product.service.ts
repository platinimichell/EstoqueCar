// src/services/product.service.ts
// Serviço de produtos/peças: CRUD completo com upload de imagem

import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import azureBlobUtil from '../utils/azure-blob.util';

export interface CreateProductData {
  code: string;
  name: string;
  description?: string;
  categoryId: number;
  minQuantity?: number;
  unitPrice: number;
  supplier?: string;
  imageBuffer?: Buffer;
  imageContentType?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  categoryId?: number;
  minQuantity?: number;
  unitPrice?: number;
  supplier?: string;
  imageBuffer?: Buffer;
  imageContentType?: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  lowStock?: boolean;
  normalStock?: boolean;
  active?: boolean;
  page?: number;
  limit?: number;
}

export class ProductService {
  async findAll(filters: ProductFilters) {
    const { search, categoryId, lowStock,normalStock, active = true, page = 1, limit = 20 } = filters;

    const where: any = { active };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    /*
    if (lowStock) {
      where.quantity = { lte: prisma.product.fields.minQuantity };
    }*/

      /*
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]); */

    let products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    if (lowStock) {
      products = products.filter(
        p => p.quantity <= p.minQuantity
      );
    }

    if (normalStock) {
      products = products.filter(
        p => p.quantity > p.minQuantity
      );
    }

    const total = products.length;

    const paginatedProducts = products.slice(
      (page - 1) * limit,
      page * limit
    );
    /*
    return {
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };*/

    return {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) throw new AppError('Produto não encontrado.', 404);
    return product;
  }

  async create(data: CreateProductData) {
    // Verifica duplicidade de código
    const exists = await prisma.product.findUnique({ where: { code: data.code } });
    if (exists) throw new AppError(`Já existe um produto com o código "${data.code}".`, 409);

    let imageUrl: string | undefined;

    if (data.imageBuffer && data.imageContentType) {
      imageUrl = await azureBlobUtil.upload(
        data.imageBuffer,
        `${data.code}-${Date.now()}`,
        data.imageContentType
      );
    }

    return prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        minQuantity: data.minQuantity ?? 5,
        unitPrice: data.unitPrice,
        supplier: data.supplier,
        imageUrl,
      },
      include: { category: true },
    });
  }

  async update(id: number, data: UpdateProductData) {
    await this.findById(id); // Garante que existe

    let imageUrl: string | undefined;

    if (data.imageBuffer && data.imageContentType) {
      imageUrl = await azureBlobUtil.upload(
        data.imageBuffer,
        `product-${id}-${Date.now()}`,
        data.imageContentType
      );
    }

    const { imageBuffer, imageContentType, ...updateData } = data;

    return prisma.product.update({
      where: { id },
      data: { ...updateData, ...(imageUrl ? { imageUrl } : {}) },
      include: { category: true },
    });
  }

  async deactivate(id: number) {
    await this.findById(id);
    return prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }

  async getLowStockProducts() {
    // Busca produtos onde a quantidade atual é menor ou igual ao mínimo definido
    return prisma.$queryRaw<any[]>`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.quantity <= p.min_quantity AND p.active = 1
      ORDER BY (p.quantity - p.min_quantity) ASC
    `;
  }
}

export default new ProductService();
