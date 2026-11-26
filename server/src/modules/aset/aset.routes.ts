import { Router } from 'express';
import {
  getAsetList,
  getAsetSummary,
  getAsetById,
  createAset,
  updateAset,
  deleteAset,
} from './aset.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createAsetSchema, updateAsetSchema } from './aset.schema';

const router = Router({ mergeParams: true });

router.get('/', authenticate, getAsetList);
router.get('/summary', authenticate, getAsetSummary);
router.get('/:id', authenticate, getAsetById);

// Modifikasi aset hanya oleh Operator (OWNER)
router.post('/', authenticate, authorize('OWNER'), validate(createAsetSchema), createAset);
router.patch('/:id', authenticate, authorize('OWNER'), validate(updateAsetSchema), updateAset);
router.put('/:id', authenticate, authorize('OWNER'), validate(updateAsetSchema), updateAset);
router.delete('/:id', authenticate, authorize('OWNER'), deleteAset);

export default router;
