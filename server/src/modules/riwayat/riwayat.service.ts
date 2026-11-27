import prisma from '../../shared/config/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface FilterRiwayat {
  tipe?: 'semua' | 'Lansia';
  search?: string;
  status?: 'semua' | 'success' | 'warning';
  bulan?: number;
  tahun?: number;
  tanggalTtd?: string;
  namaKades?: string;
  namaBidan?: string;
  namaKaur?: string;
}

export interface ItemRiwayat {
  id: string;
  pasienId?: string;
  nama: string;
  tipe: 'Lansia';
  tanggal: string;
  petugas: string;
  parameter: string;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  tanggalLahir?: string;
  nik?: string;
  rtRw?: string;
  jenisKelamin?: string;
  beratBadan?: number;
  tinggiBadan?: number;
  vitB1?: boolean;
  vitB6?: boolean;
  tekananDarahSistol?: number;
  tekananDarahDiastol?: number;
  gulaDarahSewaktu?: number;
  riwayatHt?: boolean;
  riwayatDm?: boolean;
  kolesterol?: number;
  asamUrat?: number;
  lingkarPerut?: number;
  keluhan?: string;
  tindakan?: string;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getUsiaText(tanggalLahir?: string, tanggalPeriksa?: string): string {
  if (!tanggalLahir || !tanggalPeriksa) return '-';
  const tLahir = new Date(tanggalLahir);
  const tPeriksa = new Date(tanggalPeriksa);
  let months = (tPeriksa.getFullYear() - tLahir.getFullYear()) * 12 + (tPeriksa.getMonth() - tLahir.getMonth());
  if (tPeriksa.getDate() < tLahir.getDate()) months--;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  return `${years} thn`;
}

export const riwayatService = {
  async getRiwayat(posyanduId: string, filter: FilterRiwayat): Promise<ItemRiwayat[]> {
    const { tipe = 'semua', search, status = 'semua', bulan, tahun } = filter;

    const results: ItemRiwayat[] = [];

    const meLansia = await prisma.pemeriksaanLansia.findMany({
      where: {
        lansia: {
          posyanduId,
          ...(search && { nama: { contains: search, mode: 'insensitive' } }),
        },
      },
      include: {
        lansia: {
          select: { id: true, nama: true, nik: true, tanggalLahir: true, jenisKelamin: true, rtRw: true, riwayatHt: true, riwayatDm: true },
        },
      },
      orderBy: [{ tanggalPeriksa: 'desc' }, { createdAt: 'desc' }],
    });

      const seenLansiaByMonth = new Set<string>();
      for (const item of meLansia) {
        if (!item.lansia) continue;

        // Pengecekan Filter Bulan & Tahun Presisi (Timezone UTC Safe)
        const itemDate = new Date(item.tanggalPeriksa);
        const itemBulan = itemDate.getUTCMonth() + 1; // 1 - 12
        const itemTahun = itemDate.getUTCFullYear();

        if (bulan && itemBulan !== bulan) continue;
        if (tahun && itemTahun !== tahun) continue;

        // Dalam 1 periode bulan, setiap pengunjung hanya memiliki 1 data terbaru
        const visitorKey = `${item.lansiaId}_${itemTahun}_${itemBulan}`;
        if (seenLansiaByMonth.has(visitorKey)) continue;
        seenLansiaByMonth.add(visitorKey);

        const isHipertensi = item.tekananDarahSistol >= 140 || item.tekananDarahDiastol >= 90;
        const isGdsTinggi = Number(item.gulaDarahSewaktu) >= 200;
        const isWarning = isHipertensi || isGdsTinggi;
        const statusType: 'success' | 'warning' = isWarning ? 'warning' : 'success';

        let statusDesc = 'Sehat & Normal';
        if (isHipertensi && isGdsTinggi) statusDesc = 'Hipertensi & GDS Tinggi';
        else if (isHipertensi) statusDesc = 'Hipertensi';
        else if (isGdsTinggi) statusDesc = 'GDS Tinggi';

        const paramStr = `BB: ${item.beratBadan}kg, TB: ${item.tinggiBadan}cm, TD: ${item.tekananDarahSistol}/${item.tekananDarahDiastol} mmHg, GDS: ${item.gulaDarahSewaktu}`;

        results.push({
          id: item.id,
          pasienId: item.lansiaId,
          nama: item.lansia.nama,
          nik: item.lansia.nik || undefined,
          rtRw: item.lansia.rtRw || undefined,
          riwayatHt: item.lansia.riwayatHt,
          riwayatDm: item.lansia.riwayatDm,
          tipe: 'Lansia',
          tanggal: item.tanggalPeriksa.toISOString().split('T')[0],
          petugas: item.petugas || 'Kader Posyandu',
          parameter: paramStr,
          status: statusDesc,
          statusType,
          tanggalLahir: item.lansia.tanggalLahir ? item.lansia.tanggalLahir.toISOString().split('T')[0] : undefined,
          jenisKelamin: item.lansia.jenisKelamin,
          beratBadan: Number(item.beratBadan),
          tinggiBadan: Number(item.tinggiBadan),
          tekananDarahSistol: item.tekananDarahSistol,
          tekananDarahDiastol: item.tekananDarahDiastol,
          gulaDarahSewaktu: Number(item.gulaDarahSewaktu),
          kolesterol: item.kolesterol ? Number(item.kolesterol) : undefined,
          asamUrat: item.asamUrat ? Number(item.asamUrat) : undefined,
          lingkarPerut: Number(item.lingkarPerut),
          keluhan: item.keluhan || undefined,
          tindakan: item.tindakan || undefined,
        });
      }

    // Urutkan abjad A-Z berdasarkan nama lansia di web maupun laporan (Task.md: Sorting Lansia)
    results.sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' }));

    if (status && status !== 'semua') {
      return results.filter((r) => r.statusType === status);
    }

    return results;
  },

  async generateExcelExport(posyanduId: string, filter: FilterRiwayat): Promise<ExcelJS.Workbook> {
    const posyandu = await prisma.posyandu.findUnique({ where: { id: posyanduId } });
    if (!posyandu) {
      throw new Error('Posyandu tidak ditemukan');
    }

    // Ambil data yang sudah terfilter secara tepat
    const data = await this.getRiwayat(posyanduId, filter);
    const kaders = await prisma.kader.findMany({ where: { posyanduId, isActive: true }, orderBy: { nama: 'asc' } });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia';
    workbook.created = new Date();

    const rawDesa = (posyandu.desa || 'WATULAWANG').trim();
    const cleanDesa = rawDesa.replace(/^DESA\s+/i, '').trim();

    const rawKec = (posyandu.kecamatan || 'PEJAGOAN').trim();
    const cleanKec = rawKec.replace(/^(PUSKESMAS|KECAMATAN)\s+/i, '').trim();

    const tahunVal = filter.tahun || new Date().getFullYear();
    const rawPosName = posyandu.nama.toUpperCase().replace(/^POSYANDU\s+/i, '').trim();
    const desaKecStr = `DESA ${cleanDesa.toUpperCase()} KECAMATAN ${cleanKec.toUpperCase()}`;
    const tahunStr = `TAHUN ${tahunVal}`;
    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Subtitle Filter untuk Excel Header
    const filterInfoArr = [];
    if (filter.bulan) filterInfoArr.push(`Bulan: ${NAMA_BULAN[filter.bulan - 1]}`);
    if (filter.tahun) filterInfoArr.push(`Tahun: ${filter.tahun}`);
    if (filter.status && filter.status !== 'semua') filterInfoArr.push(`Status: ${filter.status === 'warning' ? 'Perlu Perhatian' : 'Normal'}`);
    if (filter.search) filterInfoArr.push(`Pencarian: "${filter.search}"`);

    const subTitleStr = filterInfoArr.length > 0
      ? `Filter Aktif: ${filterInfoArr.join(' | ')}   •   Tanggal Cetak: ${todayFormatted}`
      : `Tanggal Cetak Laporan: ${todayFormatted}`;

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };

    const applyBordersToRange = (
      sheet: ExcelJS.Worksheet,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      border: Partial<ExcelJS.Borders>
    ) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          sheet.getCell(r, c).border = border;
        }
      }
    };

    const styleHeaderCell = (
      cell: ExcelJS.Cell,
      bgColorArgb: string,
      borderColorArgb: string,
      fontSize = 8.5
    ) => {
      cell.font = { name: 'Arial', size: fontSize, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColorArgb } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: borderColorArgb } },
        left: { style: 'thin', color: { argb: borderColorArgb } },
        bottom: { style: 'thin', color: { argb: borderColorArgb } },
        right: { style: 'thin', color: { argb: borderColorArgb } },
      };
    };

    // ─────────────────────────────────────────────────────────────
    // WORKSHEET LANSIA (PERSIS DENGAN FORMAT REGISTER PDF)
    // ─────────────────────────────────────────────────────────────
    const createLansiaWorksheet = (sheetName: string, items: ItemRiwayat[]) => {
      const sheet = workbook.addWorksheet(sheetName, {
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      });
      sheet.views = [{ showGridLines: true }];

      // Kop Surat Resmi (Persis PDF)
      sheet.mergeCells('A1:Q1');
      sheet.getCell('A1').value = `REGISTER POSYANDU LANSIA ${rawPosName}`;
      sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F172A' } };
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 22;

      sheet.mergeCells('A2:Q2');
      sheet.getCell('A2').value = desaKecStr;
      sheet.getCell('A2').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
      sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 18;

      sheet.mergeCells('A3:Q3');
      sheet.getCell('A3').value = tahunStr;
      sheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
      sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(3).height = 16;

      sheet.mergeCells('A4:Q4');
      sheet.getCell('A4').value = subTitleStr;
      sheet.getCell('A4').font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
      sheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(4).height = 16;

      sheet.getRow(5).height = 10;

      // Header Bertingkat (Baris 6 & 7) - Style Teal Emerald
      for (let r = 6; r <= 7; r++) {
        sheet.getRow(r).height = 20;
        for (let c = 1; c <= 17; c++) {
          styleHeaderCell(sheet.getCell(r, c), 'FF0F766E', 'FF0D9488', 8.5);
        }
      }

      // Baris 6 (Header Group Level 1)
      sheet.getCell('A6').value = 'NO';
      sheet.getCell('B6').value = 'IDENTITAS LANSIA';
      sheet.getCell('G6').value = 'RIWAYAT PENYAKIT';
      sheet.getCell('I6').value = 'PEMERIKSAAN FISIK & VITAL';
      sheet.getCell('L6').value = 'PEMERIKSAAN LAB & LINGKAR PERUT';
      sheet.getCell('P6').value = 'KELUHAN & TINDAKAN MEDIS';

      // Baris 7 (Header Sub-Kolom Level 2)
      sheet.getCell('B7').value = 'Nama Lansia';
      sheet.getCell('C7').value = 'Tgl Lahir';
      sheet.getCell('D7').value = 'NIK';
      sheet.getCell('E7').value = 'JK';
      sheet.getCell('F7').value = 'Usia';
      sheet.getCell('G7').value = 'Riw HT';
      sheet.getCell('H7').value = 'Riw DM';
      sheet.getCell('I7').value = 'BB (kg)';
      sheet.getCell('J7').value = 'TB (cm)';
      sheet.getCell('K7').value = 'TD (mmHg)';
      sheet.getCell('L7').value = 'GDS (mg/dL)';
      sheet.getCell('M7').value = 'Kolesterol';
      sheet.getCell('N7').value = 'Asam Urat';
      sheet.getCell('O7').value = 'L.Perut (cm)';
      sheet.getCell('P7').value = 'Keluhan';
      sheet.getCell('Q7').value = 'Tindakan Medis';

      // Merges
      sheet.mergeCells('A6:A7');
      sheet.mergeCells('B6:F6');
      sheet.mergeCells('G6:H6');
      sheet.mergeCells('I6:K6');
      sheet.mergeCells('L6:O6');
      sheet.mergeCells('P6:Q6');

      // Isi Data Lansia
      let currentRow = 8;
      if (items.length === 0) {
        sheet.mergeCells(`A${currentRow}:Q${currentRow}`);
        const emptyCell = sheet.getCell(`A${currentRow}`);
        emptyCell.value = 'Tidak ada data pemeriksaan lansia pada periode ini';
        emptyCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
        emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(currentRow).height = 24;
        applyBordersToRange(sheet, currentRow, 1, currentRow, 17, thinBorder);
        currentRow++;
      } else {
        items.forEach((item, idx) => {
          const usiaText = getUsiaText(item.tanggalLahir, item.tanggal);
          const tdText = item.tekananDarahSistol ? `${item.tekananDarahSistol}/${item.tekananDarahDiastol}` : '-';

          const rowData = [
            idx + 1,
            item.nama || '-',
            item.tanggalLahir ? item.tanggalLahir.substring(0, 10) : '-',
            item.nik || '-',
            item.jenisKelamin || '-',
            usiaText,
            item.riwayatHt ? 'Ya' : 'Tdk',
            item.riwayatDm ? 'Ya' : 'Tdk',
            item.beratBadan !== undefined ? item.beratBadan : '-',
            item.tinggiBadan !== undefined ? item.tinggiBadan : '-',
            tdText,
            item.gulaDarahSewaktu !== undefined ? item.gulaDarahSewaktu : '-',
            item.kolesterol !== undefined ? item.kolesterol : '-',
            item.asamUrat !== undefined ? item.asamUrat : '-',
            item.lingkarPerut !== undefined ? item.lingkarPerut : '-',
            item.keluhan || '-',
            item.tindakan || '-'
          ];

          const row = sheet.getRow(currentRow);
          row.values = rowData;
          row.height = 22;

          const isEven = idx % 2 === 0;
          const bgArgb = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

          for (let c = 1; c <= 17; c++) {
            const cell = sheet.getCell(currentRow, c);
            cell.font = { name: 'Arial', size: 8.5, bold: c === 2 || c === 11 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
            cell.border = thinBorder;

            if (c === 2 || c === 16 || c === 17) {
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            } else {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
          }

          currentRow++;
        });
      }

      // Lebar Kolom Lansia (17 Kolom)
      const lansiaColWidths = [
        6,   // 1: No
        24,  // 2: Nama Lansia
        13,  // 3: Tgl Lahir
        18,  // 4: NIK
        6,   // 5: JK
        10,  // 6: Usia
        10,  // 7: Riw HT
        10,  // 8: Riw DM
        9,   // 9: BB (kg)
        9,   // 10: TB (cm)
        14,  // 11: TD (mmHg)
        14,  // 12: GDS (mg/dL)
        12,  // 13: Kolesterol
        12,  // 14: Asam Urat
        12,  // 15: L.Perut (cm)
        24,  // 16: Keluhan
        26   // 17: Tindakan Medis
      ];

      lansiaColWidths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
      });

      // ─────────────────────────────────────────────────────────────
      // SUMMARY BOX LENGKAP LANSIA (PERSIS FORMAT PDF)
      // ─────────────────────────────────────────────────────────────
      const getAgeInfo = (item: ItemRiwayat) => {
        let years = 0;
        if (item.tanggalLahir) {
          const tL = new Date(item.tanggalLahir);
          const tP = new Date(item.tanggal);
          let m = (tP.getFullYear() - tL.getFullYear()) * 12 + (tP.getMonth() - tL.getMonth());
          if (tP.getDate() < tL.getDate()) m--;
          if (m < 0) m = 0;
          years = Math.floor(m / 12);
        }
        return { years };
      };

      const age45_59 = items.filter(i => getAgeInfo(i).years >= 45 && getAgeInfo(i).years <= 59).length;
      const age60_69 = items.filter(i => getAgeInfo(i).years >= 60 && getAgeInfo(i).years <= 69).length;
      const age70Plus = items.filter(i => getAgeInfo(i).years >= 70).length;

      const totalHt = items.filter(i => (i.tekananDarahSistol || 0) >= 140 || (i.tekananDarahDiastol || 0) >= 90).length;
      const totalTdNormal = items.filter(i => (i.tekananDarahSistol || 0) > 0 && (i.tekananDarahSistol || 0) < 140 && (i.tekananDarahDiastol || 0) < 90).length;

      const totalDm = items.filter(i => (i.gulaDarahSewaktu || 0) >= 200).length;
      const totalGdsNormal = items.filter(i => (i.gulaDarahSewaktu || 0) > 0 && (i.gulaDarahSewaktu || 0) < 200).length;

      const totalKolest = items.filter(i => (i.kolesterol || 0) >= 200).length;
      const totalKolestNormal = items.filter(i => (i.kolesterol || 0) > 0 && (i.kolesterol || 0) < 200).length;

      const totalAsamUrat = items.filter(i => (i.asamUrat || 0) >= 7).length;
      const totalAsamUratNormal = items.filter(i => (i.asamUrat || 0) > 0 && (i.asamUrat || 0) < 7).length;

      const lansiaPria = items.filter(i => i.jenisKelamin === 'L').length;
      const lansiaWanita = items.filter(i => i.jenisKelamin === 'P').length;

      const sRow = currentRow + 1;

      // Background Box Summary (Putih Bersih & Profesional)
      for (let r = sRow; r <= sRow + 5; r++) {
        sheet.getRow(r).height = 18;
        for (let c = 1; c <= 17; c++) {
          const cell = sheet.getCell(r, c);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      }

      // Title Summary
      sheet.mergeCells(`A${sRow}:Q${sRow}`);
      const sumTitleCell = sheet.getCell(`A${sRow}`);
      sumTitleCell.value = 'REKAPITULASI PELAYANAN KESEHATAN LANSIA';
      sumTitleCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      sumTitleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      sheet.getRow(sRow).height = 22;

      // Group Subtitles
      sheet.mergeCells(`B${sRow + 1}:G${sRow + 1}`);
      const g1 = sheet.getCell(`B${sRow + 1}`);
      g1.value = 'Distribusi Sasaran Usia Lansia:';
      g1.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };

      sheet.mergeCells(`I${sRow + 1}:Q${sRow + 1}`);
      const g2 = sheet.getCell(`I${sRow + 1}`);
      g2.value = 'Hasil Skrining Fisik & Laboratorium:';
      g2.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };

      // Row 1 Values
      sheet.mergeCells(`B${sRow + 2}:D${sRow + 2}`);
      sheet.getCell(`B${sRow + 2}`).value = '• Pra-Lansia (45 - 59 Tahun)';
      sheet.mergeCells(`E${sRow + 2}:G${sRow + 2}`);
      sheet.getCell(`E${sRow + 2}`).value = `:  ${age45_59} Orang`;

      sheet.mergeCells(`I${sRow + 2}:L${sRow + 2}`);
      sheet.getCell(`I${sRow + 2}`).value = '• Tekanan Darah (TD)';
      sheet.mergeCells(`M${sRow + 2}:Q${sRow + 2}`);
      sheet.getCell(`M${sRow + 2}`).value = `:  ${totalTdNormal} Normal | ${totalHt} Hipertensi (>= 140/90)`;

      // Row 2 Values
      sheet.mergeCells(`B${sRow + 3}:D${sRow + 3}`);
      sheet.getCell(`B${sRow + 3}`).value = '• Lansia (60 - 69 Tahun)';
      sheet.mergeCells(`E${sRow + 3}:G${sRow + 3}`);
      sheet.getCell(`E${sRow + 3}`).value = `:  ${age60_69} Orang`;

      sheet.mergeCells(`I${sRow + 3}:L${sRow + 3}`);
      sheet.getCell(`I${sRow + 3}`).value = '• Gula Darah Sewaktu (GDS)';
      sheet.mergeCells(`M${sRow + 3}:Q${sRow + 3}`);
      sheet.getCell(`M${sRow + 3}`).value = `:  ${totalGdsNormal} Normal | ${totalDm} Tinggi (>= 200 mg/dL)`;

      // Row 3 Values
      sheet.mergeCells(`B${sRow + 4}:D${sRow + 4}`);
      sheet.getCell(`B${sRow + 4}`).value = '• Lansia Risti (>= 70 Tahun)';
      sheet.mergeCells(`E${sRow + 4}:G${sRow + 4}`);
      sheet.getCell(`E${sRow + 4}`).value = `:  ${age70Plus} Orang`;

      sheet.mergeCells(`I${sRow + 4}:L${sRow + 4}`);
      sheet.getCell(`I${sRow + 4}`).value = '• Kolesterol Total';
      sheet.mergeCells(`M${sRow + 4}:Q${sRow + 4}`);
      sheet.getCell(`M${sRow + 4}`).value = `:  ${totalKolestNormal} Normal (< 200) | ${totalKolest} Tinggi (>= 200 mg/dL)`;

      // Row 4 Values
      sheet.mergeCells(`B${sRow + 5}:D${sRow + 5}`);
      sheet.getCell(`B${sRow + 5}`).value = '• Total Kunjungan Lansia';
      sheet.mergeCells(`E${sRow + 5}:G${sRow + 5}`);
      sheet.getCell(`E${sRow + 5}`).value = `:  ${items.length} Orang (L: ${lansiaPria} / P: ${lansiaWanita})`;

      sheet.mergeCells(`I${sRow + 5}:L${sRow + 5}`);
      sheet.getCell(`I${sRow + 5}`).value = '• Asam Urat';
      sheet.mergeCells(`M${sRow + 5}:Q${sRow + 5}`);
      sheet.getCell(`M${sRow + 5}`).value = `:  ${totalAsamUratNormal} Normal (< 7) | ${totalAsamUrat} Tinggi (>= 7 mg/dL)`;

      for (let r = sRow + 2; r <= sRow + 5; r++) {
        for (let c = 1; c <= 17; c++) {
          const cell = sheet.getCell(r, c);
          if (cell.value) {
            cell.font = { name: 'Arial', size: 8.5, color: { argb: 'FF0F172A' } };
          }
        }
      }

      // Border luar Summary Box
      const summaryBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
      applyBordersToRange(sheet, sRow, 1, sRow + 5, 17, summaryBorder);

      // ─────────────────────────────────────────────────────────────
      // SIGNATURE BLOCK (PERSIS FORMAT PDF DENGAN KADER & KADES/BIDAN/KAUR)
      // ─────────────────────────────────────────────────────────────
      const sigRow = sRow + 7;
      const tglTtdFormatted = filter.tanggalTtd
        ? new Date(filter.tanggalTtd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : todayFormatted;

      // Kiri: Kader Posyandu
      sheet.mergeCells(`B${sigRow}:F${sigRow}`);
      sheet.getCell(`B${sigRow}`).value = 'Kader Posyandu Lansia:';
      sheet.getCell(`B${sigRow}`).font = { name: 'Arial', size: 9, bold: true };

      if (kaders.length === 0) {
        sheet.mergeCells(`B${sigRow + 2}:F${sigRow + 2}`);
        sheet.getCell(`B${sigRow + 2}`).value = '1. ( ............................................ )';
        sheet.getCell(`B${sigRow + 2}`).font = { name: 'Arial', size: 8.5 };
      } else {
        kaders.slice(0, 5).forEach((k, idx) => {
          const kRow = sigRow + 1 + idx;
          sheet.getCell(`B${kRow}`).value = `${idx + 1}. ${k.nama}`;
          sheet.getCell(`B${kRow}`).font = { name: 'Arial', size: 8.5 };
          sheet.getCell(`D${kRow}`).value = '( ......................... )';
          sheet.getCell(`D${kRow}`).font = { name: 'Arial', size: 8.5 };
        });
      }

      // Kanan: Kades, Bidan, Kaur
      sheet.mergeCells(`L${sigRow}:Q${sigRow}`);
      const sigDate = sheet.getCell(`L${sigRow}`);
      sigDate.value = `${posyandu.desa || 'Desa'}, ${tglTtdFormatted}`;
      sigDate.font = { name: 'Arial', size: 9 };
      sigDate.alignment = { horizontal: 'center' };

      sheet.mergeCells(`L${sigRow + 1}:Q${sigRow + 1}`);
      const sigMengetahui = sheet.getCell(`L${sigRow + 1}`);
      sigMengetahui.value = 'Mengetahui,';
      sigMengetahui.font = { name: 'Arial', size: 9 };
      sigMengetahui.alignment = { horizontal: 'center' };

      // Jabatan
      sheet.mergeCells(`L${sigRow + 2}:M${sigRow + 2}`);
      sheet.getCell(`L${sigRow + 2}`).value = 'Kepala Desa';
      sheet.getCell(`L${sigRow + 2}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`L${sigRow + 2}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`N${sigRow + 2}:O${sigRow + 2}`);
      sheet.getCell(`N${sigRow + 2}`).value = 'Bidan Desa';
      sheet.getCell(`N${sigRow + 2}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`N${sigRow + 2}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`P${sigRow + 2}:Q${sigRow + 2}`);
      sheet.getCell(`P${sigRow + 2}`).value = 'Kaur Kesra';
      sheet.getCell(`P${sigRow + 2}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`P${sigRow + 2}`).alignment = { horizontal: 'center' };

      // Nama ttd
      const kadesName = filter.namaKades?.trim() || '( ........................ )';
      const bidanName = filter.namaBidan?.trim() || '( ........................ )';
      const kaurName = filter.namaKaur?.trim() || '( ........................ )';

      sheet.mergeCells(`L${sigRow + 6}:M${sigRow + 6}`);
      sheet.getCell(`L${sigRow + 6}`).value = kadesName;
      sheet.getCell(`L${sigRow + 6}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`L${sigRow + 6}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`N${sigRow + 6}:O${sigRow + 6}`);
      sheet.getCell(`N${sigRow + 6}`).value = bidanName;
      sheet.getCell(`N${sigRow + 6}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`N${sigRow + 6}`).alignment = { horizontal: 'center' };

      sheet.mergeCells(`P${sigRow + 6}:Q${sigRow + 6}`);
      sheet.getCell(`P${sigRow + 6}`).value = kaurName;
      sheet.getCell(`P${sigRow + 6}`).font = { name: 'Arial', size: 8.5, bold: true };
      sheet.getCell(`P${sigRow + 6}`).alignment = { horizontal: 'center' };
    };

    createLansiaWorksheet('Data Lansia', data);

    return workbook;
  },

  async generatePdfExport(posyanduId: string, filter: FilterRiwayat): Promise<any> {
    const posyandu = await prisma.posyandu.findUnique({ where: { id: posyanduId } });
    if (!posyandu) {
      throw new Error('Posyandu tidak ditemukan');
    }

    // Ambil data yang sudah terfilter secara tepat
    const data = await this.getRiwayat(posyanduId, filter);

    // Document setup: LANDSCAPE A4 (Width: 841.89, Height: 595.28)
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 30,
      bufferPages: true
    });

    const startX = 30;
    const pageWidth = doc.page.width;
    const printableWidth = pageWidth - startX * 2; // ~781.89 pt
    const endX = startX + printableWidth;

    const isLansiaOnly = true;

    const rawDesa = (posyandu.desa || 'WATULAWANG').trim();
    const cleanDesa = rawDesa.replace(/^DESA\s+/i, '').trim();
    const desaStr = `DESA ${cleanDesa.toUpperCase()}`;

    const rawKec = (posyandu.kecamatan || 'PEJAGOAN').trim();
    const cleanKec = rawKec.replace(/^(PUSKESMAS|KECAMATAN)\s+/i, '').trim();
    const kecStr = `PUSKESMAS KECAMATAN ${cleanKec.toUpperCase()}`;

    const tahunVal = filter.tahun || new Date().getFullYear();

    const tipeJudul = 'REGISTER & REKAPITULASI CATATAN KUNJUNGAN LANSIA';

    // ─────────────────────────────────────────────────────────────
    // HEADER KOP SURAT RESMI POSYANDU (Sesuai Standar Register)
    // ─────────────────────────────────────────────────────────────
    const rawPosName = posyandu.nama.toUpperCase().replace(/^POSYANDU\s+/i, '').trim();
    const judulRegister = `REGISTER POSYANDU LANSIA ${rawPosName}`;

    const desaKecStr = `DESA ${cleanDesa.toUpperCase()} KECAMATAN ${cleanKec.toUpperCase()}`;
    const tahunStr = `TAHUN ${tahunVal}`;

    doc.fontSize(13.5).font('Helvetica-Bold').fillColor('#0f172a').text(judulRegister, { align: 'center' });
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(desaKecStr, { align: 'center' });
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#334155').text(tahunStr, { align: 'center' });
    doc.moveDown(0.3);

    // Kop Separator Line (Garis Ganda Penutup Kop Surat)
    const lineY = doc.y;
    doc.lineWidth(1.5).moveTo(startX, lineY).lineTo(endX, lineY).strokeColor('#0f766e').stroke();
    doc.lineWidth(0.5).moveTo(startX, lineY + 2.5).lineTo(endX, lineY + 2.5).strokeColor('#0f766e').stroke();

    doc.y = lineY + 7;

    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const tanggalTtdFormatted = filter.tanggalTtd
      ? new Date(filter.tanggalTtd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : todayFormatted;

    const filterInfoArr = [];
    if (filter.bulan) filterInfoArr.push(`Bulan: ${NAMA_BULAN[filter.bulan - 1]}`);
    if (filter.tahun) filterInfoArr.push(`Tahun: ${filter.tahun}`);
    if (filter.status && filter.status !== 'semua') filterInfoArr.push(`Status: ${filter.status === 'warning' ? 'Perlu Perhatian' : 'Normal'}`);
    if (filter.search) filterInfoArr.push(`Pencarian: "${filter.search}"`);

    const subTitleStr = filterInfoArr.length > 0 ? `Filter Aktif: ${filterInfoArr.join(' | ')}` : '';
    if (subTitleStr) {
      doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#64748b').text(subTitleStr, startX, doc.y, { align: 'left' });
      doc.moveDown(0.4);
    }

    const renderLansiaTable = (items: ItemRiwayat[]) => {
      // Definition of column X coordinates and widths (Total = 781.89 pt)
      const cNo = startX;              // 30  (w: 16)
      const cNama = startX + 16;       // 46  (w: 84)
      const cTglLahir = startX + 100;  // 130 (w: 54)
      const cNik = startX + 154;       // 184 (w: 76)
      const cJK = startX + 230;        // 260 (w: 16)
      const cUsia = startX + 246;      // 276 (w: 28)

      const cRiwHt = startX + 274;     // 304 (w: 24)
      const cRiwDm = startX + 298;     // 328 (w: 24)

      const cBB = startX + 322;        // 352 (w: 26)
      const cTB = startX + 348;        // 378 (w: 26)
      const cTD = startX + 374;        // 404 (w: 46)

      const cGds = startX + 420;       // 450 (w: 38)
      const cKolest = startX + 458;    // 488 (w: 40)
      const cAsamUrat = startX + 498;  // 528 (w: 40)
      const cLPerut = startX + 538;    // 568 (w: 36)

      const cKeluhan = startX + 574;   // 604 (w: 88)
      const cTindakan = startX + 662;  // 692 (w: 119.89)

      const lansiaCols = [
        cNama, cTglLahir, cNik, cJK, cUsia,
        cRiwHt, cRiwDm,
        cBB, cTB, cTD,
        cGds, cKolest, cAsamUrat, cLPerut,
        cKeluhan, cTindakan
      ];

      const drawTableHeader = (y: number) => {
        // Multi-level Header: Height = 30pt (Row 1: 12pt, Row 2: 18pt) - Style Teal Emerald
        const headerHeight = 30;
        doc.rect(startX, y, printableWidth, headerHeight).fillAndStroke('#0f766e', '#0d9488');
        doc.fillColor('#ffffff').fontSize(6).font('Helvetica-Bold');

        // Vertical divider lines for main sections (full height 30pt)
        const fullHeightCols = [cNama, cRiwHt, cBB, cGds, cKeluhan];
        fullHeightCols.forEach(x => {
          doc.moveTo(x, y).lineTo(x, y + headerHeight).strokeColor('#0d9488').lineWidth(0.5).stroke();
        });

        // Vertical divider lines for Row 2 sub-headers (from y+12 to y+30)
        [
          cTglLahir, cNik, cJK, cUsia,
          cRiwDm,
          cTB, cTD,
          cKolest, cAsamUrat, cLPerut,
          cTindakan
        ].forEach(x => {
          doc.moveTo(x, y + 12).lineTo(x, y + headerHeight).strokeColor('#0d9488').lineWidth(0.5).stroke();
        });

        // Horizontal line separating Row 1 group header and Row 2
        doc.moveTo(cNama, y + 12).lineTo(endX, y + 12).strokeColor('#0d9488').lineWidth(0.5).stroke();

        // Row 1 Grouping Titles
        doc.text('NO', cNo, y + 11, { width: 16, align: 'center' });
        doc.text('IDENTITAS LANSIA', cNama, y + 3, { width: 258, align: 'center' });
        doc.text('RIWAYAT PENYAKIT', cRiwHt, y + 3, { width: 48, align: 'center' });
        doc.text('PEMERIKSAAN FISIK & VITAL', cBB, y + 3, { width: 98, align: 'center' });
        doc.text('PEMERIKSAAN LAB & LINGKAR PERUT', cGds, y + 3, { width: 154, align: 'center' });
        doc.text('KELUHAN & TINDAKAN MEDIS', cKeluhan, y + 3, { width: 207.89, align: 'center' });

        // Row 2 Sub-headers
        doc.fontSize(5.5);
        doc.text('Nama Lansia', cNama + 2, y + 16, { width: 80, align: 'left' });
        doc.text('Tgl Lahir', cTglLahir, y + 16, { width: 54, align: 'center' });
        doc.text('NIK', cNik, y + 16, { width: 76, align: 'center' });
        doc.text('JK', cJK, y + 16, { width: 16, align: 'center' });
        doc.text('Usia', cUsia, y + 16, { width: 28, align: 'center' });

        doc.text('Riw HT', cRiwHt, y + 16, { width: 24, align: 'center' });
        doc.text('Riw DM', cRiwDm, y + 16, { width: 24, align: 'center' });

        doc.text('BB(kg)', cBB, y + 16, { width: 26, align: 'center' });
        doc.text('TB(cm)', cTB, y + 16, { width: 26, align: 'center' });
        doc.text('TD(mmHg)', cTD, y + 16, { width: 46, align: 'center' });

        doc.text('GDS', cGds, y + 16, { width: 38, align: 'center' });
        doc.text('Kolest', cKolest, y + 16, { width: 40, align: 'center' });
        doc.text('As.Urat', cAsamUrat, y + 16, { width: 40, align: 'center' });
        doc.text('L.Perut', cLPerut, y + 16, { width: 36, align: 'center' });

        doc.text('Keluhan', cKeluhan + 2, y + 16, { width: 84, align: 'left' });
        doc.text('Tindakan Medis', cTindakan + 2, y + 16, { width: 115, align: 'left' });

        doc.fillColor('#000000');
      };

      let yPos = doc.y;
      drawTableHeader(yPos);
      yPos += 30;

      const rowHeight = 20;

      if (items.length === 0) {
        doc.rect(startX, yPos, printableWidth, 24).fillAndStroke('#ffffff', '#cbd5e1');
        doc.fontSize(7).font('Helvetica-Oblique').fillColor('#64748b').text('Tidak ada data pemeriksaan lansia pada periode ini', startX, yPos + 8, { width: printableWidth, align: 'center' });
        doc.fillColor('#000000');
        yPos += 24;
      } else {
        items.forEach((item, idx) => {
          if (yPos + rowHeight > doc.page.height - 50) {
            doc.addPage();
            yPos = 30;
            drawTableHeader(yPos);
            yPos += 30;
          }

          const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc.rect(startX, yPos, printableWidth, rowHeight).fillAndStroke(bg, '#cbd5e1');

          lansiaCols.forEach(x => {
            doc.moveTo(x, yPos).lineTo(x, yPos + rowHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
          });

          doc.font('Helvetica').fontSize(5.5);

          const usiaText = getUsiaText(item.tanggalLahir, item.tanggal);
          const tdText = item.tekananDarahSistol ? `${item.tekananDarahSistol}/${item.tekananDarahDiastol}` : '-';

          doc.fillColor('#0f172a');

          doc.text(String(idx + 1), cNo, yPos + 6, { width: 16, align: 'center', lineBreak: false });
          doc.font('Helvetica-Bold').text((item.nama || '-').substring(0, 22), cNama + 2, yPos + 6, { width: 80, lineBreak: false });

          // Tgl Lahir & NIK dipisahkan
          doc.font('Helvetica').fontSize(5.5);
          const tglStr = item.tanggalLahir ? item.tanggalLahir.substring(0, 10) : '-';
          const nikStr = item.nik || '-';
          doc.text(tglStr, cTglLahir, yPos + 6, { width: 54, align: 'center', lineBreak: false });
          doc.text(nikStr, cNik, yPos + 6, { width: 76, align: 'center', lineBreak: false });

          doc.text(item.jenisKelamin || '-', cJK, yPos + 6, { width: 16, align: 'center', lineBreak: false });
          doc.font('Helvetica-Bold').text(usiaText, cUsia, yPos + 6, { width: 28, align: 'center', lineBreak: false });
          doc.font('Helvetica');

          // Highlight Riwayat HT & DM (teks kuning tanpa background)
          const highlightYellow = '#CA8A04';
          if (item.riwayatHt) {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text('Ya', cRiwHt, yPos + 6, { width: 24, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#64748b').text('Tdk', cRiwHt, yPos + 6, { width: 24, align: 'center', lineBreak: false });
          }

          if (item.riwayatDm) {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text('Ya', cRiwDm, yPos + 6, { width: 24, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#64748b').text('Tdk', cRiwDm, yPos + 6, { width: 24, align: 'center', lineBreak: false });
          }

          // Pengukuran Fisik (BB, TB, TD)
          doc.fillColor('#0f172a');
          doc.text(item.beratBadan !== undefined ? String(item.beratBadan) : '-', cBB, yPos + 6, { width: 26, align: 'center', lineBreak: false });
          doc.text(item.tinggiBadan !== undefined ? String(item.tinggiBadan) : '-', cTB, yPos + 6, { width: 26, align: 'center', lineBreak: false });

          // TD Highlight jika Hipertensi (Sistol >= 140 atau Diastol >= 90)
          const isHipertensi = (item.tekananDarahSistol || 0) >= 140 || (item.tekananDarahDiastol || 0) >= 90;
          if (isHipertensi && tdText !== '-') {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text(tdText, cTD, yPos + 6, { width: 46, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#0f172a').font('Helvetica-Bold').text(tdText, cTD, yPos + 6, { width: 46, align: 'center', lineBreak: false });
          }
          doc.font('Helvetica');

          // Laboratorium & Lingkar Perut (teks kuning untuk nilai tinggi)
          const gdsNum = item.gulaDarahSewaktu !== undefined ? Number(item.gulaDarahSewaktu) : 0;
          const isGdsTinggi = gdsNum >= 200;
          const gdsStr = item.gulaDarahSewaktu !== undefined ? String(item.gulaDarahSewaktu) : '-';

          if (isGdsTinggi && gdsStr !== '-') {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text(gdsStr, cGds, yPos + 6, { width: 38, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#0f172a').text(gdsStr, cGds, yPos + 6, { width: 38, align: 'center', lineBreak: false });
          }

          const kolestNum = item.kolesterol !== undefined ? Number(item.kolesterol) : 0;
          const isKolestTinggi = kolestNum >= 200;
          const kolestStr = item.kolesterol !== undefined ? String(item.kolesterol) : '-';

          if (isKolestTinggi && kolestStr !== '-') {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text(kolestStr, cKolest, yPos + 6, { width: 40, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#0f172a').text(kolestStr, cKolest, yPos + 6, { width: 40, align: 'center', lineBreak: false });
          }

          const asamUratNum = item.asamUrat !== undefined ? Number(item.asamUrat) : 0;
          const isAsamUratTinggi = asamUratNum >= 7;
          const asamUratStr = item.asamUrat !== undefined ? String(item.asamUrat) : '-';

          if (isAsamUratTinggi && asamUratStr !== '-') {
            doc.fillColor(highlightYellow).font('Helvetica-Bold').text(asamUratStr, cAsamUrat, yPos + 6, { width: 40, align: 'center', lineBreak: false });
          } else {
            doc.fillColor('#0f172a').text(asamUratStr, cAsamUrat, yPos + 6, { width: 40, align: 'center', lineBreak: false });
          }

          const lpStr = item.lingkarPerut !== undefined ? String(item.lingkarPerut) : '-';
          doc.fillColor('#0f172a').text(lpStr, cLPerut, yPos + 6, { width: 36, align: 'center', lineBreak: false });

          // Keluhan & Tindakan Medis - Terpisah, Efisien, & Bounded tanpa overflow
          const keluhan = item.keluhan?.trim() || '-';
          const tindakan = item.tindakan?.trim() || '-';

          if (keluhan === '-') {
            doc.text('-', cKeluhan, yPos + 6, { width: 88, align: 'center' });
          } else {
            doc.fontSize(5.5).text(keluhan, cKeluhan + 2, yPos + 3.5, { width: 84, height: 14, ellipsis: true });
          }

          if (tindakan === '-') {
            doc.text('-', cTindakan, yPos + 6, { width: 119.89, align: 'center' });
          } else {
            doc.fontSize(5.5).text(tindakan, cTindakan + 2, yPos + 3.5, { width: 115, height: 14, ellipsis: true });
          }

          doc.fillColor('#000000');
          yPos += rowHeight;
        });
      }

      doc.y = yPos;
    };

    // ─────────────────────────────────────────────────────────────
    // SUMMARY BOX LENGKAP KELOMPOK UMUR & REKAPITULASI PEMERIKSAAN
    // ─────────────────────────────────────────────────────────────
    const renderSummaryBox = (allItems: ItemRiwayat[]) => {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      const yPos = doc.y + 10;

      const getAgeInfo = (item: ItemRiwayat) => {
        let years = 0;
        let months = 0;
        if (item.tanggalLahir) {
          const tL = new Date(item.tanggalLahir);
          const tP = new Date(item.tanggal);
          months = (tP.getFullYear() - tL.getFullYear()) * 12 + (tP.getMonth() - tL.getMonth());
          if (tP.getDate() < tL.getDate()) months--;
          if (months < 0) months = 0;
          years = Math.floor(months / 12);
        }
        return { months, years };
      };

      const lansiaItems = allItems.filter(i => i.tipe === 'Lansia');

      const age45_59 = lansiaItems.filter(i => getAgeInfo(i).years >= 45 && getAgeInfo(i).years <= 59).length;
      const age60_69 = lansiaItems.filter(i => getAgeInfo(i).years >= 60 && getAgeInfo(i).years <= 69).length;
      const age70Plus = lansiaItems.filter(i => getAgeInfo(i).years >= 70).length;

      const lansiaPria = lansiaItems.filter(i => (i.jenisKelamin || '').toUpperCase().startsWith('L')).length;
      const lansiaWanita = lansiaItems.filter(i => (i.jenisKelamin || '').toUpperCase().startsWith('P')).length;

      const totalHt = lansiaItems.filter(i => (i.tekananDarahSistol || 0) >= 140 || (i.tekananDarahDiastol || 0) >= 90).length;
      const totalTdNormal = lansiaItems.filter(i => (i.tekananDarahSistol || 0) > 0 && (i.tekananDarahSistol || 0) < 140 && (i.tekananDarahDiastol || 0) < 90).length;

      const totalDm = lansiaItems.filter(i => (i.gulaDarahSewaktu || 0) >= 200).length;
      const totalGdsNormal = lansiaItems.filter(i => (i.gulaDarahSewaktu || 0) > 0 && (i.gulaDarahSewaktu || 0) < 200).length;

      const totalKolest = lansiaItems.filter(i => (i.kolesterol || 0) >= 200).length;
      const totalKolestNormal = lansiaItems.filter(i => (i.kolesterol || 0) > 0 && (i.kolesterol || 0) < 200).length;

      const totalAsamUrat = lansiaItems.filter(i => (i.asamUrat || 0) >= 7).length;
      const totalAsamUratNormal = lansiaItems.filter(i => (i.asamUrat || 0) > 0 && (i.asamUrat || 0) < 7).length;

      const boxHeight = 84;
      // Background Putih Bersih & Border Formal Slate (Standar Laporan Profesional)
      doc.rect(startX, yPos, printableWidth, boxHeight).fillAndStroke('#ffffff', '#94a3b8');

      // Garis pemisah tipis bawah judul
      doc.moveTo(startX, yPos + 18).lineTo(startX + printableWidth, yPos + 18).strokeColor('#e2e8f0').lineWidth(0.75).stroke();

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
      const boxTitle = 'REKAPITULASI PELAYANAN KESEHATAN LANSIA';
      doc.text(boxTitle, startX + 10, yPos + 5.5);

      doc.fontSize(7.5).font('Helvetica').fillColor('#0f172a');

      // Kolom 1: Rentang Umur Lansia & Demografi
      const col1LabelX = startX + 12;
      const col1ColonX = startX + 175;

      doc.font('Helvetica-Bold').fillColor('#334155').text('Distribusi Sasaran Usia Lansia:', col1LabelX, yPos + 22);
      doc.font('Helvetica').fillColor('#0f172a');

      doc.text('• Pra-Lansia (45 - 59 Tahun)', col1LabelX, yPos + 34);
      doc.text(`:  ${age45_59} Orang`, col1ColonX, yPos + 34);

      doc.text('• Lansia (60 - 69 Tahun)', col1LabelX, yPos + 46);
      doc.text(`:  ${age60_69} Orang`, col1ColonX, yPos + 46);

      doc.text('• Lansia Risti (>= 70 Tahun)', col1LabelX, yPos + 58);
      doc.text(`:  ${age70Plus} Orang`, col1ColonX, yPos + 58);

      doc.text('• Total Kunjungan Lansia', col1LabelX, yPos + 70);
      doc.text(`:  ${lansiaItems.length} Orang (L: ${lansiaPria} / P: ${lansiaWanita})`, col1ColonX, yPos + 70);

      // Kolom 2: Hasil Skrining Fisik & Laboratorium
      const col2LabelX = startX + 350;
      const col2ColonX = startX + 480;

      doc.font('Helvetica-Bold').fillColor('#334155').text('Hasil Skrining Fisik & Pemeriksaan Lab:', col2LabelX, yPos + 22);
      doc.font('Helvetica').fillColor('#0f172a');

      doc.text('• Tekanan Darah (TD)', col2LabelX, yPos + 34);
      doc.text(`:  ${totalTdNormal} Normal  |  ${totalHt} Hipertensi (>= 140/90 mmHg)`, col2ColonX, yPos + 34);

      doc.text('• Gula Darah Sewaktu (GDS)', col2LabelX, yPos + 46);
      doc.text(`:  ${totalGdsNormal} Normal  |  ${totalDm} Tinggi (>= 200 mg/dL)`, col2ColonX, yPos + 46);

      doc.text('• Kolesterol Total', col2LabelX, yPos + 58);
      doc.text(`:  ${totalKolestNormal} Normal (< 200)  |  ${totalKolest} Tinggi (>= 200 mg/dL)`, col2ColonX, yPos + 58);

      doc.text('• Asam Urat', col2LabelX, yPos + 70);
      doc.text(`:  ${totalAsamUratNormal} Normal (< 7)  |  ${totalAsamUrat} Tinggi (>= 7 mg/dL)`, col2ColonX, yPos + 70);

      doc.fillColor('#000000');
      doc.y = yPos + boxHeight + 10;
    };

    // Eksekusi Render Data Lansia
    renderLansiaTable(data);
    renderSummaryBox(data);

    // Ambil semua kader posyandu yang aktif untuk tanda tangan sebelah kiri
    const kaders = await prisma.kader.findMany({
      where: { posyanduId, isActive: true },
      orderBy: { nama: 'asc' },
    });

    // Signature Block (Task.md: Kader di kiri, Kades/Bidan/Kaur di kanan, tanggal tanda tangan bisa diedit)
    const requiredSigHeight = Math.max(90, 30 + Math.min(kaders.length, 6) * 16);
    let finalY = doc.y + 10;
    if (finalY + requiredSigHeight > doc.page.height - 35) {
      doc.addPage();
      finalY = 35;
    }

    // ─────────────────────────────────────────────────────────────
    // TANDA TANGAN SEMUA KADER TERDAFTAR (SEBELAH KIRI)
    // ─────────────────────────────────────────────────────────────
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Kader Posyandu Lansia:', startX, finalY, { width: 340, lineBreak: false });

    let kaderY = finalY + 14;
    if (kaders.length === 0) {
      doc.fontSize(8).font('Helvetica').fillColor('#64748b');
      doc.text('1. ( ............................................ )', startX + 5, kaderY, { width: 300, lineBreak: false });
    } else {
      kaders.slice(0, 6).forEach((kader, kIdx) => {
        doc.fontSize(7.5).font('Helvetica').fillColor('#1e293b');
        doc.text(`${kIdx + 1}. ${kader.nama}`, startX + 5, kaderY, { width: 170, lineBreak: false });
        doc.text('( ....................................... )', startX + 180, kaderY, { width: 140, lineBreak: false });
        kaderY += 15;
      });
    }

    // ─────────────────────────────────────────────────────────────
    // TANDA TANGAN KEPALA DESA, BIDAN, KAUR (SEBELAH KANAN)
    // ─────────────────────────────────────────────────────────────
    const rightX = endX - 380;
    doc.fontSize(8.5).font('Helvetica').fillColor('#0f172a');
    doc.text(`${posyandu.desa || 'Desa'}, ${tanggalTtdFormatted}`, rightX, finalY, { align: 'center', width: 380, lineBreak: false });
    doc.text('Mengetahui,', rightX, finalY + 11, { align: 'center', width: 380, lineBreak: false });

    const colW = 120;
    const colGap = 8;
    const col1X = rightX;
    const col2X = rightX + colW + colGap;
    const col3X = rightX + (colW + colGap) * 2;

    const roleY = finalY + 24;
    doc.font('Helvetica-Bold').fontSize(7.5);
    doc.text('Kepala Desa', col1X, roleY, { width: colW, align: 'center', lineBreak: false });
    doc.text('Bidan Desa', col2X, roleY, { width: colW, align: 'center', lineBreak: false });
    doc.text('Kaur Kesra', col3X, roleY, { width: colW, align: 'center', lineBreak: false });

    const nameY = finalY + 68;
    const kadesName = filter.namaKades?.trim() || '( ................................. )';
    const bidanName = filter.namaBidan?.trim() || '( ................................. )';
    const kaurName = filter.namaKaur?.trim() || '( ................................. )';

    doc.font('Helvetica-Bold').fontSize(7.5);
    doc.text(kadesName, col1X, nameY, { width: colW, align: 'center', lineBreak: false });
    doc.text(bidanName, col2X, nameY, { width: colW, align: 'center', lineBreak: false });
    doc.text(kaurName, col3X, nameY, { width: colW, align: 'center', lineBreak: false });

    // Page Numbers & Print Date Footer (Task.md: Tanggal print dokumen ditaruh di footer terakhir)
    const pages = doc.bufferedPageRange().count;
    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#64748b').text(
        `Dicetak pada: ${todayFormatted}  •  Halaman ${i + 1} dari ${pages} — Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia (SIKALANSIA)`,
        startX,
        doc.page.height - 18,
        { align: 'center', width: printableWidth, lineBreak: false }
      );
    }

    return doc;
  },
};

