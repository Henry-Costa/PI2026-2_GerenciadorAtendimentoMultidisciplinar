import { Router } from 'express';
import { getAtendimentos, createAtendimento } from '../controllers/atendimentosController';

const router = Router();

router.get('/', getAtendimentos);
router.post('/', createAtendimento);

export default router;