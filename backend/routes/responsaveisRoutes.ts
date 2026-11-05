import { Router } from 'express';
import { getResponsaveis, createResponsavel } from '../controllers/responsaveisController';

const router = Router();

router.get('/', getResponsaveis);
router.post('/', createResponsavel);

export default router;