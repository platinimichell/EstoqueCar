// src/routes/product.routes.ts

import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', productController.index.bind(productController));
router.get('/:id', productController.show.bind(productController));
router.post('/', requireAdmin, upload.single('image'), productController.store.bind(productController));
router.put('/:id', requireAdmin, upload.single('image'), productController.update.bind(productController));
router.delete('/:id', requireAdmin, productController.destroy.bind(productController));

export default router;
