import { Router } from 'express';
import { getEquipe, createMembroEquipe } from '../controllers/equipeController';

const router = Router();

router.get('/', getEquipe);
router.post('/', createMembroEquipe);

export default router;