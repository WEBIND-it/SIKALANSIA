-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'KADER');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "Kemandirian" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "StatusPeriode" AS ENUM ('AKTIF', 'SELESAI');

-- CreateTable
CREATE TABLE "posyandu" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posyandu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kader" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lansia" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lansia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemeriksaan_lansia" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemeriksaan_lansia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
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

-- CreateTable
CREATE TABLE "periode_pelayanan" (
    "id" TEXT NOT NULL,
    "posyandu_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusPeriode" NOT NULL DEFAULT 'AKTIF',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periode_pelayanan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kader_username_key" ON "kader"("username");

-- CreateIndex
CREATE UNIQUE INDEX "kader_email_key" ON "kader"("email");

-- CreateIndex
CREATE INDEX "lansia_posyandu_id_idx" ON "lansia"("posyandu_id");

-- CreateIndex
CREATE INDEX "pemeriksaan_lansia_lansia_id_idx" ON "pemeriksaan_lansia"("lansia_id");

-- CreateIndex
CREATE INDEX "pemeriksaan_lansia_tanggal_periksa_idx" ON "pemeriksaan_lansia"("tanggal_periksa");

-- CreateIndex
CREATE INDEX "notification_posyandu_id_idx" ON "notification"("posyandu_id");

-- CreateIndex
CREATE INDEX "audit_log_posyandu_id_idx" ON "audit_log"("posyandu_id");

-- CreateIndex
CREATE INDEX "periode_pelayanan_posyandu_id_idx" ON "periode_pelayanan"("posyandu_id");

-- AddForeignKey
ALTER TABLE "kader" ADD CONSTRAINT "kader_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lansia" ADD CONSTRAINT "lansia_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemeriksaan_lansia" ADD CONSTRAINT "pemeriksaan_lansia_lansia_id_fkey" FOREIGN KEY ("lansia_id") REFERENCES "lansia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periode_pelayanan" ADD CONSTRAINT "periode_pelayanan_posyandu_id_fkey" FOREIGN KEY ("posyandu_id") REFERENCES "posyandu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
