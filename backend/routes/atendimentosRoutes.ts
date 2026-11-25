import { Router } from 'express';
import {
    getAtendimentos,
    createAtendimento,
    updateAtendimento,
    deleteAtendimento
} from '../controllers/atendimentosController';

const router = Router();

router.get('/', getAtendimentos);
router.post('/', createAtendimento);
router.patch('/:id', updateAtendimento);
router.delete('/:id', deleteAtendimento);

export default router;