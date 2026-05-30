// src/routes/stock.routes.ts
import { Router } from 'express';
import stockController from '../controllers/stock.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/movements', stockController.movements.bind(stockController));
router.get('/low', stockController.lowStock.bind(stockController));
router.post('/entry', requireAdmin, stockController.entry.bind(stockController));
export default router;
