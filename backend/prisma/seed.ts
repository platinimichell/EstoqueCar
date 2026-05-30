// prisma/seed.ts
// Popula o banco com dados iniciais para desenvolvimento e testes

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Usuário administrador padrão
  const adminHash = await bcrypt.hash('Mudar123@', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@estoquecar.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@estoquecar.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      firstLogin: true,
    },
  });

  // Usuário operacional
  const userHash = await bcrypt.hash('Mudar123@', 12);
  await prisma.user.upsert({
    where: { email: 'operador@estoquecar.com' },
    update: {},
    create: {
      name: 'Operador Teste',
      email: 'operador@estoquecar.com',
      passwordHash: userHash,
      role: 'USER',
      firstLogin: true,
    },
  });

  // Categorias
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Filtros' }, update: {}, create: { name: 'Filtros', description: 'Filtros de ar, óleo e combustível' } }),
    prisma.category.upsert({ where: { name: 'Freios' }, update: {}, create: { name: 'Freios', description: 'Pastilhas, discos e lonas de freio' } }),
    prisma.category.upsert({ where: { name: 'Suspensão' }, update: {}, create: { name: 'Suspensão', description: 'Amortecedores, molas e buchas' } }),
    prisma.category.upsert({ where: { name: 'Motor' }, update: {}, create: { name: 'Motor', description: 'Velas, correias e componentes de motor' } }),
    prisma.category.upsert({ where: { name: 'Elétrica' }, update: {}, create: { name: 'Elétrica', description: 'Baterias, alternadores e componentes elétricos' } }),
    prisma.category.upsert({ where: { name: 'Transmissão' }, update: {}, create: { name: 'Transmissão', description: 'Embreagem e componentes de transmissão' } }),
  ]);

  const [filtros, freios, suspensao, motor] = categories;

  // Produtos de exemplo
  const products = [
    { code: 'FIL-001', name: 'Filtro de Óleo Universal', categoryId: filtros.id, quantity: 25, minQuantity: 5, unitPrice: 18.90, supplier: 'Mann Filter' },
    { code: 'FIL-002', name: 'Filtro de Ar Esportivo', categoryId: filtros.id, quantity: 12, minQuantity: 5, unitPrice: 45.00, supplier: 'K&N' },
    { code: 'FRE-001', name: 'Pastilha de Freio Dianteira', categoryId: freios.id, quantity: 3, minQuantity: 5, unitPrice: 78.50, supplier: 'Bosch' },
    { code: 'FRE-002', name: 'Disco de Freio Ventilado', categoryId: freios.id, quantity: 8, minQuantity: 4, unitPrice: 145.00, supplier: 'Brembo' },
    { code: 'SUS-001', name: 'Amortecedor Dianteiro', categoryId: suspensao.id, quantity: 2, minQuantity: 4, unitPrice: 320.00, supplier: 'Monroe' },
    { code: 'MOT-001', name: 'Vela de Ignição NGK', categoryId: motor.id, quantity: 40, minQuantity: 10, unitPrice: 22.00, supplier: 'NGK' },
    { code: 'MOT-002', name: 'Correia Dentada', categoryId: motor.id, quantity: 6, minQuantity: 3, unitPrice: 95.00, supplier: 'Gates' },
    { code: 'FIL-003', name: 'Filtro de Combustível', categoryId: filtros.id, quantity: 15, minQuantity: 5, unitPrice: 28.90, supplier: 'WIX' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // Cliente de exemplo
  await prisma.client.upsert({
    where: { documentNumber: '12345678000195' },
    update: {},
    create: {
      name: 'Auto Peças Genovaldo Ltda',
      documentType: 'CNPJ',
      documentNumber: '12345678000195',
      isClient: true,
      isSupplier: false,
      phone: '(11) 99999-0001',
      email: 'genovaldo@autopecas.com',
      city: 'Embu das Artes',
      state: 'SP',
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log('\nCredenciais de acesso:');
  console.log('   Administrador: admin@estoquecar.com / Mudar123@');
  console.log('   Operador:      operador@estoquecar.com / Mudar123@');
  console.log('\nA senha deve ser alterada no primeiro login.\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
