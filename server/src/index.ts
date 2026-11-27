import 'dotenv/config';
import app from './app';
import prisma from './shared/config/prisma';
import { initEmailWorker } from './jobs/emailWorker';
import { closeRedis } from './shared/config/redis';

const PORT = process.env.PORT || 5001;

async function ensureAssetAndStokTables() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "KondisiAset" AS ENUM ('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "aset" (
      "id" TEXT NOT NULL,
      "posyandu_id" TEXT NOT NULL,
      "nama" TEXT NOT NULL,
      "foto" TEXT,
      "stok" INTEGER NOT NULL DEFAULT 1,
      "kondisi" "KondisiAset" NOT NULL DEFAULT 'BAIK',
      "tanggal_masuk_baru" DATE,
      "tanggal_masuk_sebelumnya" DATE,
      "catatan" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "aset_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "aset_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "stok_perlakuan" (
      "id" TEXT NOT NULL,
      "posyandu_id" TEXT NOT NULL,
      "nama_barang" TEXT NOT NULL,
      "stok_tersedia" INTEGER NOT NULL DEFAULT 0,
      "terpakai" INTEGER NOT NULL DEFAULT 0,
      "sisa" INTEGER NOT NULL DEFAULT 0,
      "satuan" TEXT NOT NULL DEFAULT 'pcs',
      "kategori" TEXT,
      "catatan" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "stok_perlakuan_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "stok_perlakuan_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
}

async function main() {
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  });

  try {
    await prisma.$connect();
    console.log('✅ Database terhubung');
    await ensureAssetAndStokTables();
    console.log('✅ Tabel aset & stok_perlakuan siap');
    initEmailWorker();
  } catch (error) {
    console.error('⚠️ Warning: Gagal menghubungkan ke database saat startup:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM diterima, menutup server...');
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT diterima, menutup server...');
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});

main();
