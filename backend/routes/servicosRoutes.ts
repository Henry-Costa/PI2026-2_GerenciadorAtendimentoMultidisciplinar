import { Router } from 'express';
import { getServicos, createServico } from '../controllers/servicosController';

const router = Router();

router.get('/', getServicos);
router.post('/', createServico);

export default router;