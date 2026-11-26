-- =============================================================================
-- SISTEM INFORMASI POSYANDU LANSIA (SIKALANSIA) - DATABASE SCHEMA
-- Dialect: PostgreSQL (Compatible with Supabase, Neon, Railway, RDS, etc.)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS "public";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('OWNER', 'KADER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Kemandirian" AS ENUM ('A', 'B', 'C');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StatusPeriode" AS ENUM ('AKTIF', 'SELESAI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KondisiAset" AS ENUM ('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 1. TABEL: POSYANDU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "posyandu" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posyandu_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 2. TABEL: KADER (USER / PETUGAS / OWNER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "kader" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KADER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kader_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 3. TABEL: LANSIA (DATA PASIEN / WARGA LANSIA)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lansia" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "no_bpjs" TEXT,
    "no_hp" TEXT,
    "rt_rw" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "alamat" TEXT NOT NULL,
    "riwayat_ht" BOOLEAN NOT NULL DEFAULT false,
    "riwayat_dm" BOOLEAN NOT NULL DEFAULT false,
    "tingkat_kemandirian" "Kemandirian" NOT NULL,
    "gangguan_mental_emosional" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lansia_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 4. TABEL: PEMERIKSAAN LANSIA (REKAM MEDIS / SCREENING PERIODIK)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "pemeriksaan_lansia" (
    "id" TEXT NOT NULL,
    "lansia_id" TEXT NOT NULL,
    "tanggal_periksa" DATE NOT NULL,
    "berat_badan" DECIMAL(5,2) NOT NULL,
    "tinggi_badan" DECIMAL(5,2) NOT NULL,
    "tekanan_darah_sistol" INTEGER NOT NULL,
    "tekanan_darah_diastol" INTEGER NOT NULL,
    "gula_darah_sewaktu" DECIMAL(6,2) NOT NULL,
    "lingkar_perut" DECIMAL(5,2) NOT NULL,
    "kolesterol" DECIMAL(6,2),
    "asam_urat" DECIMAL(5,2),
    "keluhan" TEXT,
    "tindakan" TEXT,
    "petugas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemeriksaan_lansia_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 5. TABEL: NOTIFICATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "notification" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 6. TABEL: AUDIT LOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT,
    "kader_id" TEXT,
    "kader_nama" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 7. TABEL: PERIODE PELAYANAN
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "periode_pelayanan" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusPeriode" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periode_pelayanan_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 8. TABEL: ASET (MONITORING ASET POSYANDU)
-- -----------------------------------------------------------------------------
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

    CONSTRAINT "aset_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- 9. TABEL: STOK PERLAKUAN (MONITORING STOK OBAT, VITAMIN & ALAT MEDIS)
-- -----------------------------------------------------------------------------
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

    CONSTRAINT "stok_perlakuan_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- INDEXES & CONSTRAINTS
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "kader_username_key" ON "kader"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "kader_email_key" ON "kader"("email");

-- Foreign key lookup indexes (Performance Optimization)
CREATE INDEX IF NOT EXISTS "kader_posyandu_id_idx" ON "kader"("posyandu_id");
CREATE INDEX IF NOT EXISTS "lansia_posyandu_id_idx" ON "lansia"("posyandu_id");
CREATE INDEX IF NOT EXISTS "pemeriksaan_lansia_lansia_id_idx" ON "pemeriksaan_lansia"("lansia_id");
CREATE INDEX IF NOT EXISTS "pemeriksaan_lansia_tanggal_periksa_idx" ON "pemeriksaan_lansia"("tanggal_periksa");
CREATE INDEX IF NOT EXISTS "notification_posyandu_id_idx" ON "notification"("posyandu_id");
CREATE INDEX IF NOT EXISTS "audit_log_posyandu_id_idx" ON "audit_log"("posyandu_id");
CREATE INDEX IF NOT EXISTS "periode_pelayanan_posyandu_id_idx" ON "periode_pelayanan"("posyandu_id");
CREATE INDEX IF NOT EXISTS "aset_posyandu_id_idx" ON "aset"("posyandu_id");
CREATE INDEX IF NOT EXISTS "stok_perlakuan_posyandu_id_idx" ON "stok_perlakuan"("posyandu_id");

-- -----------------------------------------------------------------------------
-- FOREIGN KEYS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    ALTER TABLE "kader"
        ADD CONSTRAINT "kader_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "lansia"
        ADD CONSTRAINT "lansia_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "pemeriksaan_lansia"
        ADD CONSTRAINT "pemeriksaan_lansia_lansia_id_fkey"
        FOREIGN KEY ("lansia_id") REFERENCES "lansia"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notification"
        ADD CONSTRAINT "notification_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "audit_log"
        ADD CONSTRAINT "audit_log_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "periode_pelayanan"
        ADD CONSTRAINT "periode_pelayanan_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "aset"
        ADD CONSTRAINT "aset_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "stok_perlakuan"
        ADD CONSTRAINT "stok_perlakuan_posyandu_id_fkey"
        FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
