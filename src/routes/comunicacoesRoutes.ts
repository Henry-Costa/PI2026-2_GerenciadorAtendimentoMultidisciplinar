import { Router } from 'express';
import { getComunicacoes, createComunicacao } from '../controllers/comunicacoesController';

const router = Router();

router.get('/', getComunicacoes);
router.post('/', createComunicacao);

export default router;