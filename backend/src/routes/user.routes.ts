// src/routes/user.routes.ts
import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware, requireAdmin);
router.get('/', userController.index.bind(userController));
router.get('/:id', userController.show.bind(userController));
router.post('/', userController.store.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.destroy.bind(userController));
export default router;
