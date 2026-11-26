import { Request, Response, NextFunction } from 'express';
import { stokPerlakuanService } from './stok-perlakuan.service';

export const getStokPerlakuanList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const search = req.query.search as string | undefined;
    const kategori = req.query.kategori as string | undefined;

    const data = await stokPerlakuanService.findAllByPosyandu(posyanduId, search, kategori);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getStokPerlakuanSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const data = await stokPerlakuanService.getSummary(posyanduId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getStokPerlakuanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    const data = await stokPerlakuanService.findById(posyanduId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createStokPerlakuan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const data = await stokPerlakuanService.create(posyanduId, req.body);
    res.status(201).json({ success: true, message: 'Item stok perlakuan berhasil ditambahkan', data });
  } catch (err) {
    next(err);
  }
};

export const updateStokPerlakuan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    const data = await stokPerlakuanService.update(posyanduId, id, req.body);
    res.json({ success: true, message: 'Data stok perlakuan berhasil diperbarui', data });
  } catch (err) {
    next(err);
  }
};

export const recordUsageStokPerlakuan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    const { jumlah, catatan } = req.body;
    const data = await stokPerlakuanService.recordUsage(posyanduId, id, Number(jumlah), catatan);
    res.json({ success: true, message: 'Penggunaan stok berhasil dicatat', data });
  } catch (err) {
    next(err);
  }
};

export const deleteStokPerlakuan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    await stokPerlakuanService.delete(posyanduId, id);
    res.json({ success: true, message: 'Item stok perlakuan berhasil dihapus' });
  } catch (err) {
    next(err);
  }
};
