import { Router } from 'express';
import { ExportController } from './export.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

// Uses /exports base route mounted from admin.routes.ts
router.post('/', verifyToken, ExportController.requestExport);
router.get('/history', verifyToken, ExportController.getHistory);
router.get('/:id/download', verifyToken, ExportController.downloadExport);
router.post('/:id/cancel', verifyToken, ExportController.cancelExport);

export default router;

