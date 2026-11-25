import { Router } from 'express';
import { getResumoDashboard } from '../controllers/dashboardController';

const router = Router();

router.get('/', getResumoDashboard);

export default router;