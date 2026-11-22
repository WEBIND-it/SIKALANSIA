import { ItemRiwayat } from "@/lib/api";
import { RekapanLansia, LansiaPerluPerhatian } from "../types";

export function formatPeriodeText(filterMonth?: string, filterYear?: string): string {
  if (filterMonth) {
    const monthName = new Date(2000, parseInt(filterMonth) - 1).toLocaleString("id-ID", { month: "long" });
    return `${monthName} ${filterYear || new Date().getFullYear()}`;
  }
  if (filterYear) {
    return `Tahun ${filterYear}`;
  }
  return "Semua Periode";
}

export function filterLogsByDateRange(logs: ItemRiwayat[], fromDate?: string, toDate?: string): ItemRiwayat[] {
  let result = logs;
  if (fromDate) {
    result = result.filter((l) => l.tanggal >= fromDate);
  }
  if (toDate) {
    result = result.filter((l) => l.tanggal <= toDate);
  }
  return result;
}

export function calculateRekapanLansia(
  lansiaLogs: ItemRiwayat[],
  totalTerdaftar: number,
  periodeText: string
): RekapanLansia {
  if (lansiaLogs.length === 0) {
    return {
      periode: periodeText,
      totalPemeriksaan: 0,
      totalOrang: 0,
      totalTerdaftar,
      cakupanPersen: 0,
      tidakHadir: totalTerdaftar,
      perluFollowUp: 0,
      kasusHipertensi: 0,
      kasusDiabetes: 0,
      kasusMetabolik: 0,
      riwayat: { hipertensi: 0, diabetes: 0, keduanya: 0, tanpaRiwayat: 0 },
      statusTd: { normal: 0, prehipertensi: 0, hipertensi1: 0, hipertensi2: 0 },
      statusImt: { kurang: 0, normal: 0, berlebih: 0, obesitas: 0 },
      statusLingkarPerut: { normal: 0, berisiko: 0 },
      statusGds: { dalamTarget: 0, perluPantau: 0, tinggi: 0 },
      statusKolesterol: { normal: 0, tinggi: 0, diperiksa: 0 },
      statusAsamUrat: { normal: 0, tinggi: 0, diperiksa: 0 },
      rataRataBb: 0,
      rataRataTb: 0,
      rataRataSistol: 0,
      rataRataDiastol: 0,
      rataRataGds: 0,
      rataRataKolesterol: 0,
      rataRataAsamUrat: 0,
      rataRataLingkarPerut: 0,
      keluhanList: [],
      tindakanList: [],
      totalMendapatTindakan: 0,
      lansiaPerluPerhatianList: [],
    };
  }

  const totalPemeriksaan = lansiaLogs.length;
  const totalOrang = new Set(lansiaLogs.map((l) => l.pasienId || l.nik || l.nama)).size;
  const finalTerdaftar = totalTerdaftar > 0 ? totalTerdaftar : totalOrang;
  const cakupanPersen = finalTerdaftar > 0
    ? Number(((totalOrang / finalTerdaftar) * 100).toFixed(1))
    : 100;
  const tidakHadir = Math.max(0, finalTerdaftar - totalOrang);

  let riwayatHtCount = 0;
  let riwayatDmCount = 0;
  let riwayatKeduanyaCount = 0;
  let tanpaRiwayatCount = 0;

  const statusTd = { normal: 0, prehipertensi: 0, hipertensi1: 0, hipertensi2: 0 };
  let sumSistol = 0;
  let countSistol = 0;
  let sumDiastol = 0;
  let countDiastol = 0;

  const statusImt = { kurang: 0, normal: 0, berlebih: 0, obesitas: 0 };
  const statusLingkarPerut = { normal: 0, berisiko: 0 };
  let sumBb = 0;
  let countBb = 0;
  let sumTb = 0;
  let countTb = 0;
  let sumLp = 0;
  let countLp = 0;

  const statusGds = { dalamTarget: 0, perluPantau: 0, tinggi: 0 };
  let sumGds = 0;
  let countGds = 0;

  const statusKolesterol = { normal: 0, tinggi: 0, diperiksa: 0 };
  let sumKol = 0;

  const statusAsamUrat = { normal: 0, tinggi: 0, diperiksa: 0 };
  let sumAu = 0;

  const keluhanCounts: Record<string, number> = {};
  const tindakanCounts: Record<string, number> = {};
  let totalMendapatTindakan = 0;

  const attentionMap = new Map<string, LansiaPerluPerhatian>();

  lansiaLogs.forEach((log) => {
    const hasHt = log.riwayatHt === true;
    const hasDm = log.riwayatDm === true;
    if (hasHt && hasDm) riwayatKeduanyaCount++;
    else if (hasHt) riwayatHtCount++;
    else if (hasDm) riwayatDmCount++;
    else tanpaRiwayatCount++;

    const sistol = log.tekananDarahSistol || 0;
    const diastol = log.tekananDarahDiastol || 0;
    if (sistol > 0 || diastol > 0) {
      if (sistol > 0) { sumSistol += sistol; countSistol++; }
      if (diastol > 0) { sumDiastol += diastol; countDiastol++; }

      if (sistol >= 160 || diastol >= 100) statusTd.hipertensi2++;
      else if (sistol >= 140 || diastol >= 90) statusTd.hipertensi1++;
      else if (sistol >= 120 || diastol >= 80) statusTd.prehipertensi++;
      else statusTd.normal++;
    }

    const bb = log.beratBadan || 0;
    const tb = log.tinggiBadan || 0;
    if (bb > 0) { sumBb += bb; countBb++; }
    if (tb > 0) { sumTb += tb; countTb++; }
    if (bb > 0 && tb > 0) {
      const imt = bb / ((tb / 100) ** 2);
      if (imt < 18.5) statusImt.kurang++;
      else if (imt < 23.0) statusImt.normal++;
      else if (imt < 25.0) statusImt.berlebih++;
      else statusImt.obesitas++;
    }

    const lp = log.lingkarPerut || 0;
    const jk = (log.jenisKelamin || "").toUpperCase().startsWith("P") ? "P" : "L";
    if (lp > 0) {
      sumLp += lp;
      countLp++;
      const limit = jk === "P" ? 80 : 90;
      if (lp > limit) statusLingkarPerut.berisiko++;
      else statusLingkarPerut.normal++;
    }

    const gds = log.gulaDarahSewaktu || 0;
    if (gds > 0) {
      sumGds += gds;
      countGds++;
      if (gds < 140) statusGds.dalamTarget++;
      else if (gds < 200) statusGds.perluPantau++;
      else statusGds.tinggi++;
    }

    if (log.kolesterol !== undefined && log.kolesterol !== null && Number(log.kolesterol) > 0) {
      const kol = Number(log.kolesterol);
      statusKolesterol.diperiksa++;
      sumKol += kol;
      if (kol >= 200) statusKolesterol.tinggi++;
      else statusKolesterol.normal++;
    }

    if (log.asamUrat !== undefined && log.asamUrat !== null && Number(log.asamUrat) > 0) {
      const au = Number(log.asamUrat);
      statusAsamUrat.diperiksa++;
      sumAu += au;
      const limitAu = jk === "P" ? 6.0 : 7.0;
      if (au > limitAu) statusAsamUrat.tinggi++;
      else statusAsamUrat.normal++;
    }

    if (log.keluhan && log.keluhan.trim()) {
      const kel = log.keluhan.trim();
      keluhanCounts[kel] = (keluhanCounts[kel] || 0) + 1;
    }

    if (log.tindakan && log.tindakan.trim()) {
      const tin = log.tindakan.trim();
      tindakanCounts[tin] = (tindakanCounts[tin] || 0) + 1;
      totalMendapatTindakan++;
    }

    // Identifikasi temuan klinis / follow-up
    const temuan: string[] = [];
    if (sistol >= 160 || diastol >= 100) temuan.push(`Hipertensi Derajat 2 (${sistol}/${diastol} mmHg)`);
    else if (sistol >= 140 || diastol >= 90) temuan.push(`Hipertensi Derajat 1 (${sistol}/${diastol} mmHg)`);

    if (gds >= 200) temuan.push(`Gula Darah Sangat Tinggi (${gds} mg/dL)`);
    else if (gds >= 140) temuan.push(`Gula Darah Pre-diabetes/Waspada (${gds} mg/dL)`);

    if (log.kolesterol && Number(log.kolesterol) >= 200) {
      temuan.push(`Kolesterol Tinggi (${log.kolesterol} mg/dL)`);
    }

    if (log.asamUrat) {
      const au = Number(log.asamUrat);
      const limitAu = jk === "P" ? 6.0 : 7.0;
      if (au > limitAu) temuan.push(`Asam Urat Tinggi (${au} mg/dL)`);
    }

    const lpLimit = jk === "P" ? 80 : 90;
    if (lp > lpLimit) temuan.push(`Obesitas Sentral (Lingkar Perut ${lp} cm)`);

    if (temuan.length > 0) {
      const key = log.pasienId || log.nik || log.nama;
      let saran = "Konseling gaya hidup sehat dan kontrol rutin.";
      if (sistol >= 160 || diastol >= 100 || gds >= 200) {
        saran = "Rujuk ke Puskesmas untuk pemeriksaan dokter & terapi obat.";
      } else if (temuan.some((t) => t.includes("Hipertensi") || t.includes("Gula"))) {
        saran = "Edukasi diet rendah garam/gula, jadwalkan kontrol ulang 2 minggu.";
      }

      let usiaText = "-";
      if (log.tanggalLahir) {
        const lahir = new Date(log.tanggalLahir);
        const ref = log.tanggal ? new Date(log.tanggal) : new Date();
        const diff = ref.getFullYear() - lahir.getFullYear();
        usiaText = `${diff} Thn`;
      }

      attentionMap.set(key, {
        id: log.id,
        pasienId: log.pasienId,
        nama: log.nama,
        nik: log.nik,
        usia: usiaText,
        jenisKelamin: jk === "P" ? "Perempuan" : "Laki-laki",
        temuan,
        keluhan: log.keluhan || "-",
        tanggal: log.tanggal,
        petugas: log.petugas || "Kader",
        saran,
      });
    }
  });

  const keluhanList = Object.entries(keluhanCounts)
    .map(([nama, count]) => ({
      nama,
      count,
      persen: totalPemeriksaan > 0 ? Number(((count / totalPemeriksaan) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const tindakanList = Object.entries(tindakanCounts)
    .map(([nama, count]) => ({
      nama,
      count,
      persen: totalPemeriksaan > 0 ? Number(((count / totalPemeriksaan) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    periode: periodeText,
    totalPemeriksaan,
    totalOrang,
    totalTerdaftar: finalTerdaftar,
    cakupanPersen,
    tidakHadir,
    perluFollowUp: attentionMap.size,
    kasusHipertensi: statusTd.hipertensi1 + statusTd.hipertensi2,
    kasusDiabetes: statusGds.tinggi,
    kasusMetabolik: statusKolesterol.tinggi + statusAsamUrat.tinggi,
    riwayat: {
      hipertensi: riwayatHtCount,
      diabetes: riwayatDmCount,
      keduanya: riwayatKeduanyaCount,
      tanpaRiwayat: tanpaRiwayatCount,
    },
    statusTd,
    statusImt,
    statusLingkarPerut,
    statusGds,
    statusKolesterol,
    statusAsamUrat,
    rataRataBb: countBb > 0 ? Number((sumBb / countBb).toFixed(1)) : 0,
    rataRataTb: countTb > 0 ? Number((sumTb / countTb).toFixed(1)) : 0,
    rataRataSistol: countSistol > 0 ? Math.round(sumSistol / countSistol) : 0,
    rataRataDiastol: countDiastol > 0 ? Math.round(sumDiastol / countDiastol) : 0,
    rataRataGds: countGds > 0 ? Math.round(sumGds / countGds) : 0,
    rataRataKolesterol: statusKolesterol.diperiksa > 0 ? Math.round(sumKol / statusKolesterol.diperiksa) : 0,
    rataRataAsamUrat: statusAsamUrat.diperiksa > 0 ? Number((sumAu / statusAsamUrat.diperiksa).toFixed(1)) : 0,
    rataRataLingkarPerut: countLp > 0 ? Number((sumLp / countLp).toFixed(1)) : 0,
    keluhanList,
    tindakanList,
    totalMendapatTindakan,
    lansiaPerluPerhatianList: Array.from(attentionMap.values()),
  };
}