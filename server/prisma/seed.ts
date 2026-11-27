import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai seeding akun dummy demo posyandu...');

  // 1. Bersihkan jika demo sudah ada sebelumnya
  const existingKader = await prisma.kader.findFirst({
    where: {
      OR: [
        { email: 'demo@gmail.com' },
        { username: 'demo' },
      ],
    },
    include: { posyandu: true },
  });

  if (existingKader) {
    console.log(`Menghapus posyandu dan akun demo lama (${existingKader.email})...`);
    await prisma.posyandu.delete({
      where: { id: existingKader.posyanduId },
    });
  }

  // 2. Buat Posyandu Demo
  const posyandu = await prisma.posyandu.create({
    data: {
      nama: 'Posyandu Melati Indah (Demo)',
      desa: 'Sukamaju',
      kecamatan: 'Cikarang Pusat',
      alamat: 'Jl. Melati Raya No. 12 RT 03/05',
    },
  });
  console.log(`✅ Posyandu dibuat: ${posyandu.nama} (${posyandu.id})`);

  // 3. Buat Akun Owner (demo)
  const hashedPassword = await bcrypt.hash('password123', 12);
  const kaderOwner = await prisma.kader.create({
    data: {
      id: uuidv4(),
      nama: 'Kader Demo SIKALANSIA',
      username: 'demo',
      email: 'demo@gmail.com',
      password: hashedPassword,
      posyanduId: posyandu.id,
      role: 'OWNER',
      isActive: true,
    },
  });
  console.log(`✅ Akun Owner dibuat: ${kaderOwner.nama} (${kaderOwner.email}) / username: demo`);

  // 3b. Buat Akun Kader Tambahan untuk pengujian tanda tangan & peran kader
  const kader1 = await prisma.kader.create({
    data: {
      id: uuidv4(),
      nama: 'Siti Rahmawati',
      username: 'siti',
      email: 'siti.kader@gmail.com',
      password: hashedPassword,
      posyanduId: posyandu.id,
      role: 'KADER',
      isActive: true,
    },
  });
  const kader2 = await prisma.kader.create({
    data: {
      id: uuidv4(),
      nama: 'Dewi Lestari',
      username: 'dewi',
      email: 'dewi.kader@gmail.com',
      password: hashedPassword,
      posyanduId: posyandu.id,
      role: 'KADER',
      isActive: true,
    },
  });
  console.log(`✅ Akun Kader tambahan dibuat: ${kader1.nama} & ${kader2.nama}`);

  // 4. Buat Periode Pelayanan dari Jan 2025 s/d September 2026
  const periodesData = [
    { bulan: 1, tahun: 2025, nama: 'Periode Pelayanan Januari 2025' },
    { bulan: 2, tahun: 2025, nama: 'Periode Pelayanan Februari 2025' },
    { bulan: 3, tahun: 2025, nama: 'Periode Pelayanan Maret 2025' },
    { bulan: 4, tahun: 2025, nama: 'Periode Pelayanan April 2025' },
    { bulan: 5, tahun: 2025, nama: 'Periode Pelayanan Mei 2025' },
    { bulan: 6, tahun: 2025, nama: 'Periode Pelayanan Juni 2025' },
    { bulan: 7, tahun: 2025, nama: 'Periode Pelayanan Juli 2025' },
    { bulan: 8, tahun: 2025, nama: 'Periode Pelayanan Agustus 2025' },
    { bulan: 9, tahun: 2025, nama: 'Periode Pelayanan September 2025' },
    { bulan: 10, tahun: 2025, nama: 'Periode Pelayanan Oktober 2025' },
    { bulan: 11, tahun: 2025, nama: 'Periode Pelayanan November 2025' },
    { bulan: 12, tahun: 2025, nama: 'Periode Pelayanan Desember 2025' },
    { bulan: 1, tahun: 2026, nama: 'Periode Pelayanan Januari 2026' },
    { bulan: 2, tahun: 2026, nama: 'Periode Pelayanan Februari 2026' },
    { bulan: 3, tahun: 2026, nama: 'Periode Pelayanan Maret 2026' },
    { bulan: 4, tahun: 2026, nama: 'Periode Pelayanan April 2026' },
    { bulan: 5, tahun: 2026, nama: 'Periode Pelayanan Mei 2026' },
    { bulan: 6, tahun: 2026, nama: 'Periode Pelayanan Juni 2026' },
    { bulan: 7, tahun: 2026, nama: 'Periode Pelayanan Juli 2026' },
    { bulan: 8, tahun: 2026, nama: 'Periode Pelayanan Agustus 2026' },
    { bulan: 9, tahun: 2026, nama: 'Periode Pelayanan September 2026' },
    { bulan: 10, tahun: 2026, nama: 'Periode Pelayanan Oktober 2026' },
    { bulan: 11, tahun: 2026, nama: 'Periode Pelayanan November 2026' },
  ];

  await prisma.periodePelayanan.createMany({
    data: periodesData.map((p) => ({
      posyanduId: posyandu.id,
      nama: p.nama,
      bulan: p.bulan,
      tahun: p.tahun,
      tanggal: new Date(Date.UTC(p.tahun, p.bulan - 1, 10)),
      status: (p.tahun === 2026 && p.bulan === 11) ? 'AKTIF' : 'SELESAI',
      catatan: `Layanan rutin posyandu ${p.nama}`,
    })),
  });
  console.log(`✅ ${periodesData.length} Periode Pelayanan berhasil dibuat (Januari 2025 - November 2026).`);

  // 5. Data 25 Lansia
  const lansiasRaw = [
    { nama: 'H. Abdul Somad', jk: 'L' as const, tglLahir: '1952-05-14', ht: true, dm: false, nik: '3216011405520001' },
    { nama: 'Hj. Aminah Syarif', jk: 'P' as const, tglLahir: '1955-08-20', ht: false, dm: true, nik: '3216012008550002' },
    { nama: 'Bambang Soeprapto', jk: 'L' as const, tglLahir: '1950-11-10', ht: true, dm: true, nik: '3216011011500003' },
    { nama: 'Dra. Endang Sulastri', jk: 'P' as const, tglLahir: '1958-03-25', ht: false, dm: false, nik: '3216012503580004' },
    { nama: 'Djoko Santoso', jk: 'L' as const, tglLahir: '1953-07-08', ht: true, dm: false, nik: '3216010807530005' },
    { nama: 'Farida Hanum', jk: 'P' as const, tglLahir: '1961-09-17', ht: false, dm: false, nik: '3216011709610006' },
    { nama: 'Gunawan Wibisono', jk: 'L' as const, tglLahir: '1954-01-30', ht: true, dm: true, nik: '3216013001540007' },
    { nama: 'Halimah Tusadiah', jk: 'P' as const, tglLahir: '1957-12-05', ht: true, dm: false, nik: '3216010512570008' },
    { nama: 'Ilyas Pratama', jk: 'L' as const, tglLahir: '1949-04-16', ht: true, dm: false, nik: '3216011604490009' },
    { nama: 'Jamilah Siregar', jk: 'P' as const, tglLahir: '1960-06-22', ht: false, dm: true, nik: '3216012206600010' },
    { nama: 'Kasim Wijaya', jk: 'L' as const, tglLahir: '1951-10-18', ht: true, dm: false, nik: '3216011810510011' },
    { nama: 'Laksmi Purwanti', jk: 'P' as const, tglLahir: '1962-02-14', ht: false, dm: false, nik: '3216011402620012' },
    { nama: 'Mansyur Hidayat', jk: 'L' as const, tglLahir: '1956-08-03', ht: true, dm: true, nik: '3216010308560013' },
    { nama: 'Nurlela Tanjung', jk: 'P' as const, tglLahir: '1959-11-28', ht: false, dm: false, nik: '3216012811590014' },
    { nama: 'Oentoeng Soebroto', jk: 'L' as const, tglLahir: '1948-03-15', ht: true, dm: false, nik: '3216011503480015' },
    { nama: 'Pudjiastuti Wardani', jk: 'P' as const, tglLahir: '1963-05-19', ht: false, dm: true, nik: '3216011905630016' },
    { nama: 'Rahmat Kartolo', jk: 'L' as const, tglLahir: '1953-12-09', ht: true, dm: false, nik: '3216010912530017' },
    { nama: 'Salmah Al-Habsyi', jk: 'P' as const, tglLahir: '1958-07-27', ht: false, dm: false, nik: '3216012707580018' },
    { nama: 'Taufiqurrahman', jk: 'L' as const, tglLahir: '1950-09-02', ht: true, dm: true, nik: '3216010209500019' },
    { nama: 'Umi Kalsum', jk: 'P' as const, tglLahir: '1961-04-12', ht: true, dm: false, nik: '3216011204610020' },
    { nama: 'Vicky Prasetyo Seno', jk: 'L' as const, tglLahir: '1955-06-20', ht: false, dm: false, nik: '3216012006550021' },
    { nama: 'Wartini Sastro', jk: 'P' as const, tglLahir: '1952-01-07', ht: true, dm: true, nik: '3216010701520022' },
    { nama: 'Yahya Sudrajat', jk: 'L' as const, tglLahir: '1947-10-11', ht: true, dm: false, nik: '3216011110470023' },
    { nama: 'Zulaikha Bahar', jk: 'P' as const, tglLahir: '1964-08-16', ht: false, dm: false, nik: '3216011608640024' },
    { nama: 'Zainal Abidin', jk: 'L' as const, tglLahir: '1954-03-04', ht: true, dm: false, nik: '3216010403540025' },
  ];

  console.log('👴 Membuat 25 data lansia dan riwayat pemeriksaan...');
  for (let idx = 0; idx < lansiasRaw.length; idx++) {
    const l = lansiasRaw[idx];
    const rt = String((idx % 5) + 1).padStart(3, '0');
    const rw = '005';

    const lansia = await prisma.lansia.create({
      data: {
        posyanduId: posyandu.id,
        nama: l.nama,
        nik: l.nik,
        noBpjs: `000${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        noHp: `0813${Math.floor(10000000 + Math.random() * 90000000)}`,
        rtRw: `${rt}/${rw}`,
        tanggalLahir: new Date(l.tglLahir),
        jenisKelamin: l.jk,
        alamat: `Jl. Melati No. ${idx + 1}, RT ${rt}/RW ${rw}`,
        riwayatHt: l.ht,
        riwayatDm: l.dm,
        tingkatKemandirian: idx % 10 === 0 ? 'B' : 'A',
      },
    });

    const pemeriksaanBatch = periodesData.map((p) => {
      const periksaDate = new Date(Date.UTC(p.tahun, p.bulan - 1, 15));

      // Variasi tensi darah sesuai riwayat HT
      const sistol = l.ht ? 140 + Math.floor(Math.random() * 25) : 115 + Math.floor(Math.random() * 15);
      const diastol = l.ht ? 90 + Math.floor(Math.random() * 12) : 75 + Math.floor(Math.random() * 10);

      // Gula darah sesuai DM
      const gds = l.dm ? 160 + Math.floor(Math.random() * 60) : 100 + Math.floor(Math.random() * 30);

      // Berat badan & tinggi badan lansia
      const bbLansia = l.jk === 'L' ? 58 + (idx % 6) : 50 + (idx % 5);
      const tbLansia = l.jk === 'L' ? 162 : 152;
      const lingkarPerut = l.jk === 'L' ? 82 + (idx % 8) : 78 + (idx % 8);
      const kolesterol = 170 + Math.floor(Math.random() * 45);
      const asamUrat = Number((5.0 + Math.random() * 2.5).toFixed(1));

      return {
        lansiaId: lansia.id,
        tanggalPeriksa: periksaDate,
        beratBadan: bbLansia,
        tinggiBadan: tbLansia,
        tekananDarahSistol: sistol,
        tekananDarahDiastol: diastol,
        gulaDarahSewaktu: gds,
        lingkarPerut,
        kolesterol,
        asamUrat,
        keluhan: l.ht ? 'Kadang pusing di tengkuk' : (l.dm ? 'Sering merasa haus' : 'Tidak ada keluhan'),
        tindakan: l.ht || l.dm ? 'Edukasi diet rendah garam/gula & anjuran kontrol rutin Puskesmas' : 'Pertahankan pola hidup sehat',
        petugas: 'Kader Demo SIKALANSIA',
      };
    });

    await prisma.pemeriksaanLansia.createMany({
      data: pemeriksaanBatch,
    });
  }
  console.log('✅ 25 Lansia beserta riwayat pemeriksaan bulanan berhasil dibuat.');

  // 6. Monitoring Aset Posyandu
  console.log('📦 Membuat data monitoring aset posyandu...');
  const asetsData = [
    {
      nama: 'Timbangan Badan Digital Camry',
      foto: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=60',
      stok: 2,
      kondisi: 'BAIK' as const,
      tanggalMasukBaru: new Date('2026-01-10'),
      tanggalMasukSebelumnya: new Date('2024-06-15'),
      catatan: 'Ditempatkan di Meja 2 (Penimbangan). Kondisi baterai baru diganti.',
    },
    {
      nama: 'Tensimeter Digital Omron HEM-7120',
      foto: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=60',
      stok: 2,
      kondisi: 'BAIK' as const,
      tanggalMasukBaru: new Date('2026-02-01'),
      tanggalMasukSebelumnya: new Date('2023-11-20'),
      catatan: 'Tensimeter utama Meja 3 (Pemeriksaan Tekanan Darah).',
    },
    {
      nama: 'Tensimeter Manual Aneroid ABN',
      foto: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&auto=format&fit=crop&q=60',
      stok: 1,
      kondisi: 'RUSAK_RINGAN' as const,
      tanggalMasukBaru: new Date('2025-05-12'),
      tanggalMasukSebelumnya: new Date('2022-08-10'),
      catatan: 'Pompa manset agak bocor halus, perlu servis balon pemompa.',
    },
    {
      nama: 'Meja Layanan Posyandu Lipat',
      foto: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&auto=format&fit=crop&q=60',
      stok: 4,
      kondisi: 'BAIK' as const,
      tanggalMasukBaru: new Date('2025-01-15'),
      tanggalMasukSebelumnya: new Date('2021-03-10'),
      catatan: '4 Meja utama sistem 5 langkah pelayanan posyandu lansia.',
    },
    {
      nama: 'Pita Pengukur Lingkar Perut (Metline)',
      foto: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
      stok: 3,
      kondisi: 'BAIK' as const,
      tanggalMasukBaru: new Date('2026-01-10'),
      tanggalMasukSebelumnya: new Date('2024-01-10'),
      catatan: 'Pita ukur fleksibel standar Kemenkes.',
    },
  ];

  for (const aset of asetsData) {
    await (prisma as any).aset.create({
      data: {
        posyanduId: posyandu.id,
        ...aset,
      },
    });
  }
  console.log(`✅ ${asetsData.length} Aset posyandu berhasil dibuat.`);

  // 7. Monitoring Stok Pemberian Perlakuan
  console.log('💊 Membuat data stok perlakuan (Vitamin & Alat Medis)...');
  const stokData = [
    {
      namaBarang: 'Vitamin B Kompleks (B1, B6, B12)',
      kategori: 'Vitamin',
      stokTersedia: 200,
      terpakai: 75,
      sisa: 125,
      satuan: 'tablet',
      catatan: 'Untuk suplemen syaraf & stamina lansia.',
    },
    {
      namaBarang: 'Vitamin C 500mg',
      kategori: 'Vitamin',
      stokTersedia: 250,
      terpakai: 110,
      sisa: 140,
      satuan: 'tablet',
      catatan: 'Diberikan rutin saat kunjungan musim pancaroba.',
    },
    {
      namaBarang: 'Stick Tes Gula Darah (GDS) EasyTouch',
      kategori: 'Stick Gula Darah',
      stokTersedia: 100,
      terpakai: 35,
      sisa: 65,
      satuan: 'strip',
      catatan: 'Expired date: Desember 2027.',
    },
    {
      namaBarang: 'Stick Tes Kolesterol EasyTouch',
      kategori: 'Kolesterol',
      stokTersedia: 60,
      terpakai: 22,
      sisa: 38,
      satuan: 'strip',
      catatan: 'Pemeriksaan khusus bagi lansia berisiko.',
    },
    {
      namaBarang: 'Stick Tes Asam Urat EasyTouch',
      kategori: 'Asam Urat',
      stokTersedia: 60,
      terpakai: 18,
      sisa: 42,
      satuan: 'strip',
      catatan: 'Expired date: Oktober 2027.',
    },
    {
      namaBarang: 'Jarum Lanset Steril 28G',
      kategori: 'Alat Perlakuan',
      stokTersedia: 300,
      terpakai: 75,
      sisa: 225,
      satuan: 'pcs',
      catatan: 'Jarum sekali pakai untuk pengambilan sampel darah kapiler.',
    },
    {
      namaBarang: 'Alcohol Swabs 70%',
      kategori: 'Alat Perlakuan',
      stokTersedia: 300,
      terpakai: 75,
      sisa: 225,
      satuan: 'pcs',
      catatan: 'Kapas alkohol antiseptik pembersih ujung jari.',
    },
  ];

  for (const s of stokData) {
    await (prisma as any).stokPerlakuan.create({
      data: {
        posyanduId: posyandu.id,
        ...s,
      },
    });
  }
  console.log(`✅ ${stokData.length} Item stok perlakuan berhasil dibuat.`);

  console.log('🎉 Selesai! Data demo siap digunakan.');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
