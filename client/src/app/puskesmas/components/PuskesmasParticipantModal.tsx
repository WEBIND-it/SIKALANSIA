"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  HeartPulse,
  Droplet,
  Activity,
  FileText,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { PublicPemeriksaanItem } from "@/lib/api";
import LansiaIcon from "@/components/LansiaIcon";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface PuskesmasParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: PublicPemeriksaanItem | null;
  allItems: PublicPemeriksaanItem[];
}

export default function PuskesmasParticipantModal({
  isOpen,
  onClose,
  selectedItem,
  allItems,
}: PuskesmasParticipantModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !selectedItem) return null;

  // Temukan seluruh histori riwayat peserta ini
  const participantHistory = allItems
    .filter(
      (item) =>
        (item.nik && item.nik === selectedItem.nik) ||
        item.namaWarga === selectedItem.namaWarga
    )
    .sort((a, b) => new Date(a.tanggalPeriksa).getTime() - new Date(b.tanggalPeriksa).getTime());

  const chartData = participantHistory.map((item) => {
    const sistolNum = item.sistol || (item.tekananDarah ? Number(item.tekananDarah.split("/")[0]) : undefined);
    const diastolNum = item.diastol || (item.tekananDarah ? Number(item.tekananDarah.split("/")[1]) : undefined);
    return {
      tanggal: item.tanggalPeriksa,
      sistol: sistolNum,
      diastol: diastolNum,
      gds: item.gds,
      bb: item.beratBadan,
    };
  });

  const sistolVal = selectedItem.sistol || (selectedItem.tekananDarah ? Number(selectedItem.tekananDarah.split("/")[0]) : 0);
  const diastolVal = selectedItem.diastol || (selectedItem.tekananDarah ? Number(selectedItem.tekananDarah.split("/")[1]) : 0);
  const isHipertensi = sistolVal >= 140 || diastolVal >= 90;
  const isGdsTinggi = (selectedItem.gds || 0) >= 200;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <LansiaIcon className="w-5 h-5" gender={selectedItem.jenisKelamin} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">{selectedItem.namaWarga}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Lansia
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                NIK: {selectedItem.nik || "-"} • Posyandu: {selectedItem.posyanduNama} ({selectedItem.desa || "-"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Clinical Alert Banner */}
          {(isHipertensi || isGdsTinggi) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Perhatian Klinis — Membutuhkan Pemantauan</h4>
                <p className="text-xs mt-0.5 text-red-800 font-medium">
                  {isHipertensi && `Tekanan darah (${sistolVal}/${diastolVal} mmHg) masuk kategori Hipertensi. `}
                  {isGdsTinggi && `Gula darah (${selectedItem.gds} mg/dL) berada di atas batas normal. `}
                  Disarankan koordinasi dengan Bidan Desa / Poli Lansia Puskesmas untuk evaluasi pengobatan.
                </p>
              </div>
            </div>
          )}

          {/* Profil & Parameter Medis Terkini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Tekanan Darah</span>
              <p className="text-base font-black text-gray-900 mt-0.5">
                {selectedItem.tekananDarah || (sistolVal ? `${sistolVal}/${diastolVal}` : "-")} <span className="text-[10px] font-normal text-gray-500">mmHg</span>
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isHipertensi ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                {isHipertensi ? "Hipertensi" : "Normal"}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Gula Darah (GDS)</span>
              <p className="text-base font-black text-gray-900 mt-0.5">
                {selectedItem.gds || "-"} <span className="text-[10px] font-normal text-gray-500">mg/dL</span>
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isGdsTinggi ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                {isGdsTinggi ? "Tinggi" : "Dalam Batas"}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Berat &amp; Tinggi</span>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {selectedItem.beratBadan ? `${selectedItem.beratBadan} kg` : "-"} / {selectedItem.tinggiBadan ? `${selectedItem.tinggiBadan} cm` : "-"}
              </p>
              <span className="text-[10px] text-gray-500 font-semibold">
                LP: {selectedItem.lingkarPerut ? `${selectedItem.lingkarPerut} cm` : "-"}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Lab Tambahan</span>
              <p className="text-xs font-bold text-gray-900 mt-1">
                Kol: {selectedItem.kolesterol || "-"} | Urat: {selectedItem.asamUrat || "-"}
              </p>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                {selectedItem.riwayatHt ? "Riwayat HT" : ""} {selectedItem.riwayatDm ? "• Riwayat DM" : ""}
              </span>
            </div>
          </div>

          {/* Grafik Riwayat Perkembangan */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Tren Tekanan Darah &amp; Gula Darah ({participantHistory.length} Pemeriksaan)
              </h4>
            </div>

            <div className="h-56 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "11px" }} />
                    <Legend />
                    <Line type="monotone" dataKey="sistol" name="Sistol (mmHg)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="diastol" name="Diastol (mmHg)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="gds" name="GDS (mg/dL)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  Belum ada data grafik perkembangan.
                </div>
              )}
            </div>
          </div>

          {/* Tabel Catatan Kunjungan */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Histori Kunjungan Lengkap</h4>
            <div className="border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3">Posyandu</th>
                    <th className="py-2 px-3">Hasil Tensi</th>
                    <th className="py-2 px-3">GDS</th>
                    <th className="py-2 px-3">Keluhan &amp; Tindakan</th>
                    <th className="py-2 px-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {participantHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-bold text-gray-900">{item.tanggalPeriksa}</td>
                      <td className="py-2 px-3">{item.posyanduNama}</td>
                      <td className="py-2 px-3 font-semibold text-gray-900">{item.tekananDarah || (item.sistol ? `${item.sistol}/${item.diastol}` : "-")}</td>
                      <td className="py-2 px-3">{item.gds || "-"}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {item.keluhan ? `Keluhan: ${item.keluhan}` : ""} {item.tindakan ? `• Tindakan: ${item.tindakan}` : "-"}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{item.petugas || "Kader"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}