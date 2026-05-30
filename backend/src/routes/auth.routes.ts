// src/routes/auth.routes.ts

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.put('/change-password', authMiddleware, authController.changePassword.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export default router;
