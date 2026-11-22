"use client";

import React from "react";
import { ArrowRight, AlertTriangle, CheckCircle2, Activity, HeartPulse } from "lucide-react";
import { DashboardSummary } from "@/lib/api";
import LansiaIcon from "@/components/LansiaIcon";

export interface DashboardKpiGridProps {
  onNavigate: (menu: string, patientId?: string) => void;
  summary: DashboardSummary | null;
  isSummaryLoading: boolean;
  isRiwayatLoading: boolean;
  perluFollowUpLansia: number;
}

export default function DashboardKpiGrid({
  onNavigate,
  summary,
  isSummaryLoading,
  isRiwayatLoading,
  perluFollowUpLansia,
}: DashboardKpiGridProps) {
  const totalHt = summary?.lansiaHtDm?.totalHt ?? 0;
  const totalDm = summary?.lansiaHtDm?.totalDm ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Lansia Terdaftar */}
      <div
        onClick={() => onNavigate("Lansia")}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-40 transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Total Lansia Terdaftar
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {isSummaryLoading ? "…" : `${summary?.totalLansia ?? 0}`}
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
              Sasaran pelayanan posyandu lansia
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
            <LansiaIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 transition-colors">
          <span>Kelola data lansia</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Card 2: Lansia Berisiko PTM */}
      <div
        onClick={() => onNavigate("Lansia")}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-40 transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Lansia Butuh Perhatian
              </span>
              {perluFollowUpLansia > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  Follow-Up
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Terkontrol
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {isRiwayatLoading ? "…" : `${perluFollowUpLansia} Jiwa`}
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5 truncate max-w-[200px]">
              {perluFollowUpLansia > 0 ? "Hipertensi tk. 2 atau GDS tinggi" : "Kondisi tanda vital stabil"}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              perluFollowUpLansia > 0
                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900"
            }`}
          >
            {perluFollowUpLansia > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          <span>{perluFollowUpLansia > 0 ? "Buka temuan klinis lansia" : "Lihat skrining lansia"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Card 3: Lansia dengan Hipertensi */}
      <div
        onClick={() => onNavigate("Lansia")}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-40 transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Riwayat Hipertensi (HT)
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {isSummaryLoading ? "…" : `${totalHt} Jiwa`}
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
              Pemantauan tekanan darah berkala
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
            <HeartPulse className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-rose-700 dark:text-rose-400 group-hover:text-rose-800 transition-colors">
          <span>Daftar penderita HT</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Card 4: Lansia dengan Diabetes Melitus */}
      <div
        onClick={() => onNavigate("Lansia")}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-40 transition-all hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Riwayat Diabetes (DM)
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {isSummaryLoading ? "…" : `${totalDm} Jiwa`}
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
              Pemantauan kadar gula darah
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-purple-700 dark:text-purple-400 group-hover:text-purple-800 transition-colors">
          <span>Daftar penderita DM</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
