import { Router } from 'express';
import {
    getResponsaveis,
    getResponsavelById,
    createResponsavel,
    updateResponsavel,
    deleteResponsavel
} from '../controllers/responsaveisController';

const router = Router();

router.get('/', getResponsaveis);
router.get('/:id', getResponsavelById);
router.post('/', createResponsavel);
router.put('/:id', updateResponsavel);
router.delete('/:id', deleteResponsavel);

export default router;