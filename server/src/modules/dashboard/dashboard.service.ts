import prisma from '../../shared/config/prisma';
import cacheService from '../../shared/services/cache.service';

export const dashboardService = {
  /**
   * Mengambil semua metrik ringkasan untuk satu posyandu lansia.
   */
  async getSummary(posyanduId: string) {
    return cacheService.getOrSet(`dashboard:summary:${posyanduId}`, async () => {
      const [
        totalLansia,
        pemeriksaanLansiaTerbaru,
        lansiaHtDm,
      ] = await Promise.all([
        prisma.lansia.count({ where: { posyanduId } }),
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

      return {
        totalLansia,
        lansiaHtDm: { totalHt, totalDm, totalHtDm },
        pemeriksaanTerbaru: {
          lansia: pemeriksaanLansiaTerbaru,
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
   * Agregasi distribusi kehadiran per RT/RW untuk lansia
   */
  async getDistribusiKehadiran(posyanduId: string, _kategori?: string) {
    return cacheService.getOrSet(`dashboard:kehadiran:${posyanduId}`, async () => {
      const lansias = await prisma.lansia.findMany({
        where: { posyanduId },
        select: { id: true, rtRw: true },
      });

      const activePeriode = await prisma.periodePelayanan.findFirst({
        where: { posyanduId, status: 'AKTIF' },
        orderBy: { tanggal: 'desc' },
      });

      const now = new Date();
      const targetMonth = activePeriode ? activePeriode.bulan : (now.getMonth() + 1);
      const targetYear = activePeriode ? activePeriode.tahun : now.getFullYear();

      // Fetch pemeriksaan Lansia pada periode aktif
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
   * Agregasi Aktivitas Kunjungan khusus Lansia
   */
  async getAktivitasKunjungan(posyanduId: string) {
    return cacheService.getOrSet(`dashboard:aktivitas:${posyanduId}`, async () => {
      const lansias = await prisma.lansia.findMany({
        where: { posyanduId },
        include: {
          pemeriksaans: {
            orderBy: { tanggalPeriksa: 'desc' },
            take: 1,
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

      const activePeriode = await prisma.periodePelayanan.findFirst({
        where: { posyanduId, status: 'AKTIF' },
        orderBy: { tanggal: 'desc' },
      });

      const now = new Date();
      const targetMonth = activePeriode ? activePeriode.bulan : (now.getMonth() + 1);
      const targetYear = activePeriode ? activePeriode.tahun : now.getFullYear();

      lansias.forEach((l) => {
        const birthDate = new Date(l.tanggalLahir);
        const ageYears = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const latestExam = l.pemeriksaans[0];
        const detailInfo = `Usia ${ageYears} Thn • ${l.rtRw || 'RT/RW -'}`;

        const examDate = latestExam ? new Date(latestExam.tanggalPeriksa) : null;
        const isExamInCurrentPeriod = examDate && 
          (examDate.getMonth() + 1) === targetMonth && 
          examDate.getFullYear() === targetYear;

        if (latestExam && isExamInCurrentPeriod) {
          lansiaSelesaiList.push({
            id: l.id,
            nama: l.nama,
            tipe: 'Lansia',
            jenisKelamin: l.jenisKelamin,
            detailInfo,
            statusPeriksa: 'Selesai Periksa',
            tanggalPeriksa: latestExam.tanggalPeriksa.toISOString().split('T')[0],
            detailPemeriksaan: `TD: ${latestExam.tekananDarahSistol}/${latestExam.tekananDarahDiastol} mmHg, GDS: ${latestExam.gulaDarahSewaktu || '-'}`,
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
            detailPemeriksaan: 'Belum ada data pemeriksaan',
          });
        }
      });

      const lansiaSelesaiCount = lansiaSelesaiList.length;
      const belumMengisiCount = belumMengisiList.length;
      const totalSasaran = lansiaSelesaiCount + belumMengisiCount;
      const persentaseSelesai = totalSasaran > 0 ? Math.round((lansiaSelesaiCount / totalSasaran) * 100) : 0;

      return {
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
