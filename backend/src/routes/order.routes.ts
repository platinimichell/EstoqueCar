// src/routes/order.routes.ts

import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', orderController.index.bind(orderController));
router.get('/:id', orderController.show.bind(orderController));
router.post('/', requireAdmin, orderController.store.bind(orderController));
router.put('/:id/status', orderController.updateStatus.bind(orderController)); // USER pode dar baixa
router.delete('/:id', requireAdmin, orderController.destroy.bind(orderController));

export default router;
