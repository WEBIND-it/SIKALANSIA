import prisma from '../../shared/config/prisma';
import cacheService from '../../shared/services/cache.service';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const dashboardService = {
  /**
   * Mengambil semua metrik ringkasan untuk satu posyandu lansia sesuai periode/bulan.
   */
  async getSummary(posyanduId: string, bulan?: number, tahun?: number) {
    const cacheKey = `dashboard:summary:${posyanduId}:${bulan || 'act'}:${tahun || 'act'}`;
    return cacheService.getOrSet(cacheKey, async () => {
      // Dapatkan active periode jika bulan/tahun tidak dispesifikasikan
      let targetMonth = bulan;
      let targetYear = tahun;

      if (!targetMonth || !targetYear) {
        const activePeriode = await prisma.periodePelayanan.findFirst({
          where: { posyanduId, status: 'AKTIF' },
          orderBy: { tanggal: 'desc' },
        });

        const now = new Date();
        targetMonth = targetMonth || (activePeriode ? activePeriode.bulan : now.getMonth() + 1);
        targetYear = targetYear || (activePeriode ? activePeriode.tahun : now.getFullYear());
      }

      const namaBulan = NAMA_BULAN[targetMonth - 1] || `Bulan ${targetMonth}`;
      const periodeLabel = `${namaBulan} ${targetYear}`;

      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

      const [
        totalLansia,
        pemeriksaanBulanIni,
        pemeriksaanTerbaru,
        lansiaHtDm,
      ] = await Promise.all([
        prisma.lansia.count({ where: { posyanduId } }),
        prisma.pemeriksaanLansia.findMany({
          where: {
            lansia: { posyanduId },
            tanggalPeriksa: { gte: startDate, lte: endDate },
          },
          include: { lansia: { select: { nama: true, tanggalLahir: true } } },
          orderBy: { tanggalPeriksa: 'desc' },
        }),
        prisma.pemeriksaanLansia.findMany({
          where: { lansia: { posyanduId } },
          orderBy: { tanggalPeriksa: 'desc' },
          take: 10,
          include: { lansia: { select: { nama: true, tanggalLahir: true } } },
        }),
        prisma.lansia.findMany({
          where: { posyanduId },
          select: { riwayatHt: true, riwayatDm: true },
        }),
      ]);

      const totalHt = lansiaHtDm.filter((l) => l.riwayatHt).length;
      const totalDm = lansiaHtDm.filter((l) => l.riwayatDm).length;
      const totalHtDm = lansiaHtDm.filter((l) => l.riwayatHt && l.riwayatDm).length;

      // Unik lansia yang hadir di bulan/periode ini
      const uniqueLansiaHadir = new Set(pemeriksaanBulanIni.map((p) => p.lansiaId)).size;
      const persentaseKehadiran = totalLansia > 0 ? Math.round((uniqueLansiaHadir / totalLansia) * 100) : 0;

      // Hitung kasus abnormal di periode ini
      const kasusHtPeriode = pemeriksaanBulanIni.filter((p) => p.tekananDarahSistol >= 140 || p.tekananDarahDiastol >= 90).length;
      const kasusDmPeriode = pemeriksaanBulanIni.filter((p) => Number(p.gulaDarahSewaktu) >= 200).length;

      return {
        totalLansia,
        periode: {
          bulan: targetMonth,
          tahun: targetYear,
          namaBulan,
          periodeLabel,
        },
        kehadiranPeriode: {
          totalHadir: uniqueLansiaHadir,
          totalPemeriksaan: pemeriksaanBulanIni.length,
          persentase: persentaseKehadiran,
        },
        kondisiPeriode: {
          kasusHt: kasusHtPeriode,
          kasusDm: kasusDmPeriode,
        },
        lansiaHtDm: { totalHt, totalDm, totalHtDm },
        pemeriksaanTerbaru: {
          lansia: pemeriksaanTerbaru,
        },
      };
    }, 180);
  },

  /**
   * Tren gizi dikembalikan kosong karena sistem khusus lansia.
   */
  async getTrenGizi(_posyanduId: string, _period: 'bulanan' | 'tahunan' = 'bulanan') {
    return [];
  },

  /**
   * Agregasi distribusi kehadiran per RT/RW untuk lansia sesuai periode
   */
  async getDistribusiKehadiran(posyanduId: string, _kategori?: string, bulan?: number, tahun?: number) {
    const cacheKey = `dashboard:kehadiran:${posyanduId}:${bulan || 'act'}:${tahun || 'act'}`;
    return cacheService.getOrSet(cacheKey, async () => {
      const lansias = await prisma.lansia.findMany({
        where: { posyanduId },
        select: { id: true, rtRw: true },
      });

      let targetMonth = bulan;
      let targetYear = tahun;

      if (!targetMonth || !targetYear) {
        const activePeriode = await prisma.periodePelayanan.findFirst({
          where: { posyanduId, status: 'AKTIF' },
          orderBy: { tanggal: 'desc' },
        });

        const now = new Date();
        targetMonth = targetMonth || (activePeriode ? activePeriode.bulan : now.getMonth() + 1);
        targetYear = targetYear || (activePeriode ? activePeriode.tahun : now.getFullYear());
      }

      // Fetch pemeriksaan Lansia pada periode target
      const lansiaExams = await prisma.pemeriksaanLansia.findMany({
        where: { lansia: { posyanduId } },
        orderBy: { tanggalPeriksa: 'desc' },
        distinct: ['lansiaId'],
        select: {
          lansiaId: true,
          tanggalPeriksa: true,
          lansia: { select: { rtRw: true } },
        },
      });

      const getLansiaRtRw = (rtRw?: string | null) => {
        return rtRw ? rtRw.trim() : 'RT ?/RW ?';
      };

      // Inisialisasi map RT/RW
      const rtRwMap = new Map<string, {
        total: number;
        hadir: number;
        lansiaTotal: number;
        lansiaHadir: number;
      }>();

      const getOrCreate = (rtRw: string) => {
        if (!rtRwMap.has(rtRw)) {
          rtRwMap.set(rtRw, {
            total: 0,
            hadir: 0,
            lansiaTotal: 0,
            lansiaHadir: 0,
          });
        }
        return rtRwMap.get(rtRw)!;
      };

      lansias.forEach((l) => {
        const rtRw = getLansiaRtRw(l.rtRw);
        const row = getOrCreate(rtRw);
        row.lansiaTotal += 1;
        row.total += 1;
      });

      lansiaExams.forEach((exam) => {
        const examDate = new Date(exam.tanggalPeriksa);
        if ((examDate.getMonth() + 1) === targetMonth && examDate.getFullYear() === targetYear) {
          const rtRw = getLansiaRtRw(exam.lansia.rtRw);
          const row = getOrCreate(rtRw);
          row.lansiaHadir += 1;
          row.hadir += 1;
        }
      });

      return Array.from(rtRwMap.entries())
        .map(([rtRw, data]) => {
          const lansiaPersen = data.lansiaTotal > 0 ? Math.round((data.lansiaHadir / data.lansiaTotal) * 100) : 0;
          const totalPersen = data.total > 0 ? Math.round((data.hadir / data.total) * 100) : 0;

          return {
            rtRw,
            total: data.total || 1,
            hadir: data.hadir,
            persentase: totalPersen,
            lansia: {
              total: data.lansiaTotal,
              hadir: data.lansiaHadir,
              persentase: lansiaPersen,
            },
          };
        })
        .sort((a, b) => b.persentase - a.persentase);
    }, 300);
  },

  /**
   * Agregasi Aktivitas Kunjungan khusus Lansia sesuai periode
   */
  async getAktivitasKunjungan(posyanduId: string, bulan?: number, tahun?: number) {
    const cacheKey = `dashboard:aktivitas:${posyanduId}:${bulan || 'act'}:${tahun || 'act'}`;
    return cacheService.getOrSet(cacheKey, async () => {
      let targetMonth = bulan;
      let targetYear = tahun;

      if (!targetMonth || !targetYear) {
        const activePeriode = await prisma.periodePelayanan.findFirst({
          where: { posyanduId, status: 'AKTIF' },
          orderBy: { tanggal: 'desc' },
        });

        const now = new Date();
        targetMonth = targetMonth || (activePeriode ? activePeriode.bulan : now.getMonth() + 1);
        targetYear = targetYear || (activePeriode ? activePeriode.tahun : now.getFullYear());
      }

      const lansias = await prisma.lansia.findMany({
        where: { posyanduId },
        include: {
          pemeriksaans: {
            orderBy: { tanggalPeriksa: 'desc' },
          },
        },
      });

      const lansiaSelesaiList: Array<{
        id: string;
        nama: string;
        tipe: 'Lansia';
        jenisKelamin?: string;
        detailInfo: string;
        statusPeriksa: 'Selesai Periksa' | 'Belum Mengisi Data';
        tanggalPeriksa?: string | null;
        detailPemeriksaan?: string | null;
      }> = [];

      const belumMengisiList: Array<{
        id: string;
        nama: string;
        tipe: 'Lansia';
        jenisKelamin?: string;
        detailInfo: string;
        statusPeriksa: 'Selesai Periksa' | 'Belum Mengisi Data';
        tanggalPeriksa?: string | null;
        detailPemeriksaan?: string | null;
      }> = [];

      const now = new Date();

      lansias.forEach((l) => {
        const birthDate = new Date(l.tanggalLahir);
        const ageYears = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const detailInfo = `Usia ${ageYears} Thn • ${l.rtRw || 'RT/RW -'}`;

        // Cari pemeriksaan pada targetMonth dan targetYear
        const examInPeriod = l.pemeriksaans.find((exam) => {
          const d = new Date(exam.tanggalPeriksa);
          return (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
        });

        if (examInPeriod) {
          lansiaSelesaiList.push({
            id: l.id,
            nama: l.nama,
            tipe: 'Lansia',
            jenisKelamin: l.jenisKelamin,
            detailInfo,
            statusPeriksa: 'Selesai Periksa',
            tanggalPeriksa: examInPeriod.tanggalPeriksa.toISOString().split('T')[0],
            detailPemeriksaan: `TD: ${examInPeriod.tekananDarahSistol}/${examInPeriod.tekananDarahDiastol} mmHg, GDS: ${examInPeriod.gulaDarahSewaktu || '-'}`,
          });
        } else {
          belumMengisiList.push({
            id: l.id,
            nama: l.nama,
            tipe: 'Lansia',
            jenisKelamin: l.jenisKelamin,
            detailInfo,
            statusPeriksa: 'Belum Mengisi Data',
            tanggalPeriksa: null,
            detailPemeriksaan: 'Belum ada data pemeriksaan periode ini',
          });
        }
      });

      const lansiaSelesaiCount = lansiaSelesaiList.length;
      const belumMengisiCount = belumMengisiList.length;
      const totalSasaran = lansiaSelesaiCount + belumMengisiCount;
      const persentaseSelesai = totalSasaran > 0 ? Math.round((lansiaSelesaiCount / totalSasaran) * 100) : 0;

      return {
        targetMonth,
        targetYear,
        namaBulan: NAMA_BULAN[targetMonth - 1],
        lansiaSelesaiCount,
        belumMengisiCount,
        totalSasaran,
        persentaseSelesai,
        lansiaSelesaiList,
        belumMengisiList,
      };
    }, 180);
  },

  /**
   * Menghapus semua cache dashboard untuk posyandu tertentu saat data pemeriksaan/pasien diperbarui.
   */
  async invalidateDashboardCache(posyanduId: string) {
    await cacheService.delByPattern(`dashboard:*:${posyanduId}*`);
  },
};
