"use client";

import React from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import Modal from "@/components/Modal";
import LansiaIcon from "@/components/LansiaIcon";
import { ItemRiwayat } from "@/lib/api";
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

export interface RiwayatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDetailLog: ItemRiwayat | null;
  participantHistory: any[];
  latestRecord: any;
  onNavigate?: (module: string, itemId?: string) => void;
}

export default function RiwayatDetailModal({
  isOpen,
  onClose,
  selectedDetailLog,
  participantHistory,
  latestRecord,
  onNavigate,
}: RiwayatDetailModalProps) {
  if (!selectedDetailLog) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Grafik Perkembangan & Riwayat: ${selectedDetailLog.nama || ""}`}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Identity Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md bg-blue-600 shadow-blue-500/20">
              <LansiaIcon className="w-6 h-6" gender={selectedDetailLog.jenisKelamin} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-saas-dark">
                  {selectedDetailLog.nama}
                </h3>
                {onNavigate && selectedDetailLog.pasienId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate("Lansia", selectedDetailLog.pasienId);
                    }}
                    className="text-xs font-bold text-saas-primary hover:underline cursor-pointer"
                    title={`Lihat Profil Lengkap ${selectedDetailLog.nama}`}
                  >
                    (Lihat Profil &rarr;)
                  </button>
                )}
              </div>
              <p className="text-xs text-saas-muted font-semibold mt-0.5">
                Kategori: <strong className="text-saas-dark">Lansia</strong>{" "}
                | Total Periksa:{" "}
                <strong className="text-saas-primary">{participantHistory.length}x</strong>
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white border border-gray-200 text-saas-dark font-extrabold text-xs rounded-md shadow-2xs self-start sm:self-auto">
            Status: {latestRecord?.status || selectedDetailLog.status}
          </span>
        </div>

        {/* Ringkasan Parameter Klinis */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-saas-muted">
            Ringkasan Parameter Klinis Terakhir
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tekanan Darah Box */}
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-saas-muted uppercase">
                Tekanan Darah (TD)
              </span>
              <p className="text-base font-extrabold text-saas-dark">
                {latestRecord?.tekananDarahSistol || 0}/
                {latestRecord?.tekananDarahDiastol || 0}{" "}
                <span className="text-xs font-normal">mmHg</span>
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  (latestRecord?.tekananDarahSistol || 0) >= 140
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {(latestRecord?.tekananDarahSistol || 0) >= 140
                  ? "Hipertensi"
                  : "Normal"}
              </span>
            </div>

            {/* Gula Darah Box */}
            <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-saas-muted uppercase">
                Gula Darah (GDS)
              </span>
              <p className="text-base font-extrabold text-saas-dark">
                {latestRecord?.gulaDarahSewaktu || 0}{" "}
                <span className="text-xs font-normal">mg/dL</span>
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  (latestRecord?.gulaDarahSewaktu || 0) >= 200
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {(latestRecord?.gulaDarahSewaktu || 0) >= 200
                  ? "GDS Tinggi"
                  : "Normal"}
              </span>
            </div>

            {/* Kolesterol & Asam Urat Box */}
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">
                Kolesterol / Asam Urat
              </span>
              <p className="text-xs font-extrabold text-indigo-950">
                Kol: {latestRecord?.kolesterol || "-"} | Urat:{" "}
                {latestRecord?.asamUrat || "-"}
              </p>
              <p className="text-[10px] font-bold text-indigo-700">
                LP: {latestRecord?.lingkarPerut || "-"} cm
              </p>
            </div>
          </div>
        </div>

        {/* GRAFIK PERKEMBANGAN (LINE CHART) */}
        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-saas-dark flex items-center gap-1.5">
              <LineChartIcon className="w-4 h-4 text-saas-primary" />
              Grafik Perkembangan Tekanan Darah &amp; GDS
            </h4>
            <span className="text-[10px] font-bold text-saas-muted bg-white px-2 py-0.5 rounded-md border border-gray-200">
              {participantHistory.length} Titik Data
            </span>
          </div>

          <div className="h-64 w-full">
            {participantHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={participantHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tekananDarahSistol"
                    name="TD Sistol (mmHg)"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tekananDarahDiastol"
                    name="TD Diastol (mmHg)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gulaDarahSewaktu"
                    name="GDS (mg/dL)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-saas-muted">
                Belum ada riwayat grafik untuk peserta ini.
              </div>
            )}
          </div>
        </div>

        {/* TABEL HISTORI PERIKSA INDIVIDUAL */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-saas-muted">
            Riwayat Histori Pemeriksaan Lengkap ({participantHistory.length})
          </h4>
          <div className="overflow-x-auto border border-gray-150 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 font-bold text-saas-dark">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Parameter Ukur</th>
                  <th className="py-2.5 px-3">Kondisi / Status</th>
                  <th className="py-2.5 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {participantHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-3 font-bold text-saas-dark">{item.tanggal}</td>
                    <td className="py-2.5 px-3 font-medium text-saas-dark">
                      {item.parameter}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] ${
                          item.statusType === "warning"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-saas-muted font-semibold">
                      {item.petugas || "Kader Posyandu"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-saas-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-teal-600 transition-colors cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </Modal>
  );
}