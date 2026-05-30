// src/routes/report.routes.ts
import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/stock', reportController.stock.bind(reportController));
router.get('/movements', reportController.movements.bind(reportController));
router.get('/orders', reportController.orders.bind(reportController));
export default router;
