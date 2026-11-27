# Database Schema & Setup Guide

Direktori ini berisi skema database untuk **Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia Lansia (SIKALANSIA)** berbasis PostgreSQL.

---

## 📁 Berkas

- [schema.sql](file:///Users/wahyutricahya/Web%20Development/sistem-input-lansia/database/schema.sql) : Skema DDL murni PostgreSQL (Tabel, Enum, Index, Foreign Keys) siap dieksekusi di Supabase SQL Editor, Neon, Railway, psql, pgAdmin, dll.
- [schema.prisma](file:///Users/wahyutricahya/Web%20Development/sistem-input-lansia/database/schema.prisma) : Salinan Prisma Schema resmi yang digunakan backend.

---

## 🚀 Langkah Migrasi ke Database Baru

### 1. Masukkan Konfigurasi Environment (`.env`)
Di berkas `server/.env`, isi URL koneksi database baru:
```env
# Contoh untuk Supabase / Neon / PostgreSQL:
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
```
> *Catatan:* `DIRECT_URL` digunakan untuk migrasi schema langsung (Direct Connection), sedangkan `DATABASE_URL` dapat menggunakan connection pooler (seperti Supabase Transaction Pooler port 6543).

---

### 2. Terapkan Skema ke Database Baru

Anda dapat memilih salah satu dari 2 cara di bawah ini:

#### Cara A: Menggunakan Prisma CLI (Rekomendasi)
Jalankan perintah push skema dari terminal:
```bash
npm run prisma:push
```
Atau masuk ke direktori server:
```bash
cd server
npx prisma db push
```

#### Cara B: Menggunakan SQL Query Langsung
Buka berkas [database/schema.sql](file:///Users/wahyutricahya/Web%20Development/sistem-input-lansia/database/schema.sql), lalu salin seluruh kodenya dan jalankan di **SQL Editor** database Anda (misalnya Supabase SQL Editor atau Query Tool pgAdmin).

---

### 3. Generate Prisma Client
Setelah skema diterapkan:
```bash
npm run prisma:generate
```

---

### 4. (Opsional) Inisialisasi Data Demo / Akun Owner Default
Untuk mengisi data awal demo (posyandu demo, akun owner, data lansia, dan riwayat pemeriksaan):
```bash
npm run prisma:seed
```
*Akun demo default:*
- **Username / Email**: `demo` / `demo@gmail.com`
- **Password**: `password123`
- **Role**: `OWNER`
