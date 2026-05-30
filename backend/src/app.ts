// src/app.ts
// EstoqueCar — Entry point da aplicação Express

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Rotas
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import clientRoutes from './routes/client.routes';
import stockRoutes from './routes/stock.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';

// Middleware de erro
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares Globais ──────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do front-end (quando em produção)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend')));
}

// ─── Rotas da API ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// SPA fallback (produção)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  });
}

// ─── Middleware de Erro (deve ser o último) ────────────────────────────────────

app.use(errorHandler);

// ─── Inicialização ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\nEstoqueCar API rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
