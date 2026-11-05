import { Router } from 'express';
import { getDocumentos, createDocumento } from '../controllers/documentosController';

const router = Router();

router.get('/', getDocumentos);
router.post('/', createDocumento);

export default router;