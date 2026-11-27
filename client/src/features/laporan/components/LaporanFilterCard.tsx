"use client";

import React, { useState } from "react";
import { RotateCcw, Loader2, Eye, Download, ChevronDown, ChevronUp, PenTool } from "lucide-react";

export interface LaporanFilterCardProps {
  filterCategory?: "Lansia";
  setFilterCategory?: (c: "Lansia") => void;
  posyandus?: Array<{ id: string; nama: string; desa: string }>;
  selectedPosyandu?: string;
  setSelectedPosyandu?: (p: string) => void;
  filterMonth: string;
  setFilterMonth: (m: string) => void;
  filterYear: string;
  setFilterYear: (y: string) => void;
  filterFromDate: string;
  setFilterFromDate: (d: string) => void;
  filterToDate: string;
  setFilterToDate: (d: string) => void;
  yearOptions: number[];
  onResetCurrentPeriod: () => void;
  onResetAllPeriods: () => void;
  isLoading: boolean;
  hasData: boolean;
  onOpenPreview: () => void;
  onExportExcel: () => void;
  isExportingExcel: boolean;
  isExportingPdf?: boolean;
  tanggalTtd?: string;
  setTanggalTtd?: (v: string) => void;
  namaKades?: string;
  setNamaKades?: (v: string) => void;
  namaBidan?: string;
  setNamaBidan?: (v: string) => void;
  namaKaur?: string;
  setNamaKaur?: (v: string) => void;
}

export default function LaporanFilterCard({
  posyandus,
  selectedPosyandu,
  setSelectedPosyandu,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filterFromDate,
  setFilterFromDate,
  filterToDate,
  setFilterToDate,
  yearOptions,
  onResetCurrentPeriod,
  onResetAllPeriods,
  isLoading,
  hasData,
  onOpenPreview,
  onExportExcel,
  isExportingExcel,
  isExportingPdf = false,
  tanggalTtd = "",
  setTanggalTtd,
  namaKades = "",
  setNamaKades,
  namaBidan = "",
  setNamaBidan,
  namaKaur = "",
  setNamaKaur,
}: LaporanFilterCardProps) {
  const [showTtdConfig, setShowTtdConfig] = useState(false);
  const hasPosyanduFilter = Array.isArray(posyandus) && posyandus.length > 0 && setSelectedPosyandu;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
      {/* Baris 1: Pilihan Posyandu, Bulan, Tahun, dan Rentang Tanggal */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasPosyanduFilter ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3.5`}>
        {/* [Opsional] 1. Pilihan Posyandu */}
        {hasPosyanduFilter && (
          <div>
            <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">
              1. Posyandu
            </label>
            <select
              value={selectedPosyandu || "semua"}
              onChange={(e) => setSelectedPosyandu(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            >
              <option value="semua" className="text-gray-900">
                Semua Posyandu ({posyandus.length})
              </option>
              {posyandus.map((p) => (
                <option key={p.id} value={p.id} className="text-gray-900">
                  {p.nama} ({p.desa})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Periode Bulan */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">
            {hasPosyanduFilter ? "2. Bulan" : "1. Bulan"}
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            <option value="" className="text-gray-900">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")} className="text-gray-900">
                {new Date(2000, i).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        {/* Periode Tahun */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">
            {hasPosyanduFilter ? "3. Tahun" : "2. Tahun"}
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            <option value="" className="text-gray-900">Semua Tahun</option>
            {yearOptions.map((year) => (
              <option key={year} value={year.toString()} className="text-gray-900">
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Dari Tanggal */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">
            Dari Tanggal (Opsional)
          </label>
          <input
            type="date"
            value={filterFromDate}
            onChange={(e) => setFilterFromDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          />
        </div>

        {/* Sampai Tanggal */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">
            Sampai Tanggal (Opsional)
          </label>
          <input
            type="date"
            value={filterToDate}
            onChange={(e) => setFilterToDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          />
        </div>
      </div>

      {/* Baris 2: Tombol Reset Filter & Tombol Unduh Laporan */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Tombol Reset ke Periode Ini */}
          <button
            type="button"
            onClick={onResetCurrentPeriod}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200/80 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Set filter kembali ke periode ini"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Periode Ini
          </button>

          {/* Tombol Tampilkan Semua Periode */}
          <button
            type="button"
            onClick={onResetAllPeriods}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Tampilkan semua data tanpa filter bulan dan tahun"
          >
            Semua Periode
          </button>

          {/* Toggle Konfigurasi Tanda Tangan */}
          {setTanggalTtd && (
            <button
              type="button"
              onClick={() => setShowTtdConfig((prev) => !prev)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200/80 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Atur tanggal tanda tangan & nama pejabat laporan"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Format Tanda Tangan</span>
              {showTtdConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {isLoading && (
            <span className="text-xs text-teal-600 font-semibold flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memperbarui data...
            </span>
          )}
        </div>

        {/* Tombol Aksi Laporan */}
        <div className="flex items-center gap-2">
          {/* Tombol Pratinjau Dokumen */}
          <button
            type="button"
            onClick={onOpenPreview}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
            title="Pratinjau dokumen PDF sebelum diunduh atau dicetak"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Laporan</span>
          </button>

          {/* Tombol Unduh PDF */}
          <button
            type="button"
            onClick={onOpenPreview}
            disabled={isExportingPdf}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
            title="Pratinjau & Unduh format PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>

          {/* Tombol Unduh Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExportingExcel || !hasData}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
            title="Unduh format spreadsheet Excel (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExportingExcel ? "Mengunduh Excel..." : "Unduh Excel"}</span>
          </button>
        </div>
      </div>

      {/* Bagian Konfigurasi Tanda Tangan & Pejabat Desa */}
      {showTtdConfig && setTanggalTtd && (
        <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <div>
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-700" />
                Pengaturan Tanda Tangan &amp; Pejabat Pengesah Dokumen
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Format: Sisi Kiri = Semua kader posyandu terdaftar • Sisi Kanan = Kepala Desa, Bidan Desa, Kaur Kesra.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTtdConfig(false)}
              className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Tanggal Tanda Tangan (Opsional)
              </label>
              <input
                type="date"
                value={tanggalTtd}
                onChange={(e) => setTanggalTtd(e.target.value)}
                title="Kosongkan untuk menampilkan garis titik-titik tanggal pada laporan"
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Nama Kepala Desa
              </label>
              <input
                type="text"
                value={namaKades}
                onChange={(e) => setNamaKades && setNamaKades(e.target.value)}
                placeholder="Contoh: H. Ahmad Supriyadi"
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Nama Bidan Desa
              </label>
              <input
                type="text"
                value={namaBidan}
                onChange={(e) => setNamaBidan && setNamaBidan(e.target.value)}
                placeholder="Contoh: Bd. Siti Nurhaliza, S.Tr.Keb"
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Nama Kaur Kesra
              </label>
              <input
                type="text"
                value={namaKaur}
                onChange={(e) => setNamaKaur && setNamaKaur(e.target.value)}
                placeholder="Contoh: Bambang Wijaya"
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}