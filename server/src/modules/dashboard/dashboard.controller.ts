import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const bulan = req.query.bulan ? Number(req.query.bulan) : undefined;
    const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;

    if (req.user?.posyanduId !== posyanduId) {
      res.status(403).json({ success: false, message: 'Akses ditolak ke posyandu ini' });
      return;
    }

    const data = await dashboardService.getSummary(posyanduId, bulan, tahun);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getTrenGizi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const period = (req.query.period as 'bulanan' | 'tahunan') || 'bulanan';

    if (req.user?.posyanduId !== posyanduId) {
      res.status(403).json({ success: false, message: 'Akses ditolak ke posyandu ini' });
      return;
    }

    const data = await dashboardService.getTrenGizi(posyanduId, period);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getDistribusiKehadiran = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const kategori = (req.query.kategori || req.query.tipe) as string | undefined;
    const bulan = req.query.bulan ? Number(req.query.bulan) : undefined;
    const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;

    if (req.user?.posyanduId !== posyanduId) {
      res.status(403).json({ success: false, message: 'Akses ditolak ke posyandu ini' });
      return;
    }

    const data = await dashboardService.getDistribusiKehadiran(posyanduId, kategori, bulan, tahun);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAktivitasKunjungan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posyanduId = req.params.posyanduId as string;
    const bulan = req.query.bulan ? Number(req.query.bulan) : undefined;
    const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;

    if (req.user?.posyanduId !== posyanduId) {
      res.status(403).json({ success: false, message: 'Akses ditolak ke posyandu ini' });
      return;
    }

    const data = await dashboardService.getAktivitasKunjungan(posyanduId, bulan, tahun);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
