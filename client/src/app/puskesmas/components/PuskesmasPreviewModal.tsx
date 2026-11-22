"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  X,
  CheckCircle2,
  Printer,
  Download,
  Loader2,
} from "lucide-react";
import { PublicPemeriksaanItem } from "@/lib/api";
import { RekapanLansia } from "@/features/laporan/types";

export interface PuskesmasPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodeText: string;
  selectedPosyanduName: string;
  rekapanLansia: RekapanLansia;
  filteredLansiaLogs: PublicPemeriksaanItem[];
  exportingExcel: boolean;
  onExportExcel: () => void;
  onPrintPdf: () => void;
}

export default function PuskesmasPreviewModal({
  isOpen,
  onClose,
  periodeText,
  selectedPosyanduName,
  rekapanLansia,
  filteredLansiaLogs,
  exportingExcel,
  onExportExcel,
  onPrintPdf,
}: PuskesmasPreviewModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{ margin: 0 }}
      className="posyandu-preview-backdrop fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] !m-0 !mt-0 flex items-center justify-center bg-black/60 p-2 sm:p-5 animate-in fade-in duration-200 print:!static print:!inset-auto print:!w-full print:!h-auto print:!bg-transparent print:!p-0 print:!m-0 print:!block print:!overflow-visible"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="posyandu-preview-dialog bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative print:!static print:!w-full print:!max-w-none print:!h-auto print:!max-h-none print:!shadow-none print:!border-none print:!rounded-none print:!p-0 print:!m-0 print:!block print:!overflow-visible"
      >
        {/* Modal Header */}
        <div className="posyandu-preview-header print:hidden px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Pratinjau Laporan Posyandu Lansia
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Lansia
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Periode: <span className="font-semibold text-gray-700">{periodeText}</span> • Format Standar Register A4 Landscape
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrintPdf}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Printable Register Format */}
        <div className="posyandu-preview-content flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 print:!bg-white print:!p-0 print:!overflow-visible">
          <div className="max-w-[1000px] mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-xs border border-gray-200/80 space-y-6 print:!border-none print:!shadow-none print:!p-0 print:!max-w-none">
            {/* Kop Laporan Puskesmas */}
            <div className="border-b-2 border-gray-900 pb-4 text-center space-y-1">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-900">
                Pemerintah Daerah Kabupaten / Kota
              </h2>
              <h1 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-gray-900">
                Puskesmas Pembina — Posyandu Lansia
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Register Pelayanan &amp; Skrining Kesehatan Lanjut Usia
              </p>
              <div className="pt-2 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-gray-700">
                <span>Posyandu: <strong>{selectedPosyanduName}</strong></span>
                <span>•</span>
                <span>Periode: <strong>{periodeText}</strong></span>
              </div>
            </div>

            {/* Ringkasan Indikator KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Periksa</span>
                <strong className="text-base text-gray-900">{rekapanLansia.totalPemeriksaan}</strong>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Jumlah Lansia</span>
                <strong className="text-base text-gray-900">{rekapanLansia.totalOrang} Orang</strong>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Tensi Terkontrol</span>
                <strong className="text-base text-emerald-700">{rekapanLansia.statusTd.normal}</strong>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                <span className="text-[10px] text-rose-800 uppercase font-bold block">Hipertensi</span>
                <strong className="text-base text-rose-700">{rekapanLansia.kasusHipertensi}</strong>
              </div>
            </div>

            {/* Tabel Data Register Lansia */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse print:text-[8.5px]">
                <thead className="bg-gray-100 border-b border-gray-300 font-bold text-gray-800">
                  <tr>
                    <th className="border border-gray-300 px-1.5 py-1 text-center w-8">No</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Nama Lansia</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Posyandu</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center">Tgl Periksa</th>
                    <th className="border border-gray-300 px-1 py-1 text-center w-6">JK</th>
                    <th className="border border-gray-300 px-1 py-1 text-center">Usia</th>
                    <th className="border border-gray-300 px-1 py-1 text-center">HT</th>
                    <th className="border border-gray-300 px-1 py-1 text-center">DM</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center">TD (mmHg)</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center">GDS</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center">Kolesterol</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center">Asam Urat</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-left">Keluhan</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Tindakan Medis</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Status</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLansiaLogs.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-6 text-center text-gray-500 font-medium">
                        Tidak ada data untuk dicetak pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredLansiaLogs.map((log, idx) => (
                      <tr key={log.id} className="border-b border-gray-200">
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 px-2 py-1 font-bold text-gray-900">{log.namaWarga}</td>
                        <td className="border border-gray-300 px-2 py-1">{log.posyanduNama}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{log.tanggalPeriksa}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{log.jenisKelamin}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{log.usiaInfo || "-"}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{log.riwayatHt ? "Ya" : "Tdk"}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">{log.riwayatDm ? "Ya" : "Tdk"}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center font-semibold">
                          {log.tekananDarah || (log.sistol ? `${log.sistol}/${log.diastol}` : "-")}
                        </td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center font-semibold">{log.gds || "-"}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{log.kolesterol || "-"}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{log.asamUrat || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1">{log.keluhan || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1">{log.tindakan || log.tindakanCatatan || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1">{log.statusRingkasan || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1">{log.petugas || "Kader"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Dokumen */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>Dokumen digenerate otomatis oleh Sistem Informasi Posyandu Lansia.</span>
              </div>
              <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="posyandu-preview-footer print:hidden px-5 py-3 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Dokumen register siap dicetak atau disimpan format PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={onPrintPdf}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              disabled={exportingExcel}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{exportingExcel ? "Mengunduh..." : "Unduh Excel"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}