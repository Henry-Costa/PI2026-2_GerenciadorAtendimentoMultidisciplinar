import { Router } from 'express';
import { getAlunos, createAluno } from '../controllers/alunosController';

const router = Router();

router.get('/', getAlunos);
router.post('/', createAluno);

export default router;