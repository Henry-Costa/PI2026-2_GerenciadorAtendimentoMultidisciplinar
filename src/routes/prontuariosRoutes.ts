import { Router } from 'express';
import { getProntuarios, createProntuario } from '../controllers/prontuariosController';

const router = Router();

router.get('/', getProntuarios);
router.post('/', createProntuario);

export default router;