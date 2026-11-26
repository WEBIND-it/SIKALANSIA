import { Router } from 'express';
import {
  getStokPerlakuanList,
  getStokPerlakuanSummary,
  getStokPerlakuanById,
  createStokPerlakuan,
  updateStokPerlakuan,
  recordUsageStokPerlakuan,
  deleteStokPerlakuan,
} from './stok-perlakuan.controller';
import { authenticate, authorize } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createStokPerlakuanSchema,
  updateStokPerlakuanSchema,
  useStokPerlakuanSchema,
} from './stok-perlakuan.schema';

const router = Router({ mergeParams: true });

router.get('/', authenticate, getStokPerlakuanList);
router.get('/summary', authenticate, getStokPerlakuanSummary);
router.get('/:id', authenticate, getStokPerlakuanById);

// Catat penggunaan saat pelayanan posyandu (Kader & Operator dapat mencatat pemakaian)
router.post('/:id/pakai', authenticate, validate(useStokPerlakuanSchema), recordUsageStokPerlakuan);

// Pengelolaan master barang hanya oleh Operator (OWNER)
router.post('/', authenticate, authorize('OWNER'), validate(createStokPerlakuanSchema), createStokPerlakuan);
router.patch('/:id', authenticate, authorize('OWNER'), validate(updateStokPerlakuanSchema), updateStokPerlakuan);
router.put('/:id', authenticate, authorize('OWNER'), validate(updateStokPerlakuanSchema), updateStokPerlakuan);
router.delete('/:id', authenticate, authorize('OWNER'), deleteStokPerlakuan);

export default router;
