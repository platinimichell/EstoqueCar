// src/routes/client.routes.ts
import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', clientController.index.bind(clientController));
router.get('/:id', clientController.show.bind(clientController));
router.post('/', requireAdmin, clientController.store.bind(clientController));
router.put('/:id', requireAdmin, clientController.update.bind(clientController));
router.delete('/:id', requireAdmin, clientController.destroy.bind(clientController));
export default router;
