"use client";

import React from "react";
import { Activity, Eye, HeartPulse, Stethoscope, Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { AktivitasKunjunganData, DashboardSummary } from "@/lib/api";

export interface DashboardChartsProps {
  isAktivitasLoading: boolean;
  aktivitasData: AktivitasKunjunganData | null;
  summary?: DashboardSummary | null;
  onOpenDetailAktivitas: (tab?: "lansia" | "belum_lansia") => void;
}

export default function DashboardCharts({
  isAktivitasLoading,
  aktivitasData,
  summary,
  onOpenDetailAktivitas,
}: DashboardChartsProps) {
  const lansiaSelesai = aktivitasData?.lansiaSelesaiCount ?? 0;
  const belumLansiaCount = (aktivitasData?.belumMengisiList ?? []).filter((i) => i.tipe === "Lansia").length;
  const lansiaTotal = lansiaSelesai + belumLansiaCount;
  const persenLansia = lansiaTotal > 0 ? Math.round((lansiaSelesai / lansiaTotal) * 100) : 0;

  // Data faktor risiko lansia dari summary
  const htCount = summary?.lansiaHtDm?.totalHt ?? 0;
  const dmCount = summary?.lansiaHtDm?.totalDm ?? 0;
  const htDmCount = summary?.lansiaHtDm?.totalHtDm ?? 0;
  const totalLansia = summary?.totalLansia ?? (lansiaTotal || 1);
  const normalEstimasi = Math.max(0, totalLansia - (htCount + dmCount - htDmCount));

  const chartData = [
    { name: "Hipertensi", total: htCount, fill: "#ef4444" },
    { name: "Diabetes", total: dmCount, fill: "#f59e0b" },
    { name: "HT + DM", total: htDmCount, fill: "#8b5cf6" },
    { name: "Normal / Tanpa Riwayat", total: normalEstimasi, fill: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Grafik Profil Risiko Kesehatan Lansia */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Distribusi Faktor Risiko Kesehatan Lansia
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat penyakit tidak menular (Hipertensi &amp; Diabetes Mellitus) seluruh lansia terdaftar.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span> HT
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span> DM
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2"></span> Normal
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} Lansia`, "Jumlah"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Total Lansia Terdata: <strong>{totalLansia} Jiwa</strong></span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            Skrining berkala penting untuk mencegah komplikasi kardiovaskular.
          </span>
        </div>
      </div>

      {/* 2. Cakupan Pemeriksaan Lansia Periode Ini */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cakupan Skrining Lansia Periode Ini
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Realisasi kunjungan &amp; pemeriksaan lansia</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenDetailAktivitas()}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Lihat Rincian Nama Lansia"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {isAktivitasLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">Memuat data capaian...</div>
          ) : (
            <div className="space-y-5">
              {/* Progress Card */}
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/40">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Capaian Kehadiran
                  </span>
                  <span className="font-bold text-teal-700 dark:text-teal-400 text-sm tabular-nums">
                    {persenLansia}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, persenLansia)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-right">
                  {lansiaSelesai} dari {lansiaTotal} Lansia telah diperiksa
                </p>
              </div>

              {/* Breakdown Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onOpenDetailAktivitas("lansia")}
                  className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/50 rounded-xl text-left hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 block mb-0.5">
                    Sudah Diperiksa
                  </span>
                  <span className="text-xl font-bold text-emerald-950 dark:text-emerald-200">
                    {lansiaSelesai}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    Lihat daftar &rarr;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDetailAktivitas("belum_lansia")}
                  className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-150 dark:border-amber-900/50 rounded-xl text-left hover:bg-amber-100/50 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 block mb-0.5">
                    Belum Hadir
                  </span>
                  <span className="text-xl font-bold text-amber-950 dark:text-amber-200">
                    {belumLansiaCount}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">
                    Perlu dihubungi &rarr;
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">Posyandu Lansia</span>
          <button
            type="button"
            onClick={() => onOpenDetailAktivitas()}
            className="font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            Rincian Pemeriksaan &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}