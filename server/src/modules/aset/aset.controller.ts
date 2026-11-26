import { Request, Response, NextFunction } from 'express';
import { asetService } from './aset.service';

export const getAsetList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const search = req.query.search as string | undefined;
    const kondisi = req.query.kondisi as string | undefined;

    const data = await asetService.findAllByPosyandu(posyanduId, search, kondisi);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAsetSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const data = await asetService.getSummary(posyanduId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAsetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    const data = await asetService.findById(posyanduId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createAset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const data = await asetService.create(posyanduId, req.body);
    res.status(201).json({ success: true, message: 'Aset berhasil ditambahkan', data });
  } catch (err) {
    next(err);
  }
};

export const updateAset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    const data = await asetService.update(posyanduId, id, req.body);
    res.json({ success: true, message: 'Data aset berhasil diperbarui', data });
  } catch (err) {
    next(err);
  }
};

export const deleteAset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const id = req.params.id as string;
    await asetService.delete(posyanduId, id);
    res.json({ success: true, message: 'Aset berhasil dihapus' });
  } catch (err) {
    next(err);
  }
};
