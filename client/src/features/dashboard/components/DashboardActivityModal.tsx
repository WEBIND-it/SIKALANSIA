"use client";

import React from "react";
import { Search, X, Eye, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import LansiaIcon from "@/components/LansiaIcon";
import { AktivitasKunjunganData } from "@/lib/api";

export interface DashboardActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  aktivitasTab: "lansia" | "belum_lansia";
  setAktivitasTab: (tab: "lansia" | "belum_lansia") => void;
  aktivitasData: AktivitasKunjunganData | null;
  aktivitasSearch: string;
  setAktivitasSearch: (val: string) => void;
  onNavigate: (menu: string, patientId?: string) => void;
  onQuickInputForPatient: (patient: {
    id: string;
    nama: string;
    tipe: "Lansia";
    detailInfo: string;
  }) => void;
  formatTanggalIndonesia: (dateStr: string) => string;
}

export default function DashboardActivityModal({
  isOpen,
  onClose,
  aktivitasTab,
  setAktivitasTab,
  aktivitasData,
  aktivitasSearch,
  setAktivitasSearch,
  onNavigate,
  onQuickInputForPatient,
  formatTanggalIndonesia,
}: DashboardActivityModalProps) {
  const lansiaSelesai = aktivitasData?.lansiaSelesaiList ?? [];
  const belumLansia = (aktivitasData?.belumMengisiList ?? []).filter((i) => i.tipe === "Lansia");

  const activeList = aktivitasTab === "lansia" ? lansiaSelesai : belumLansia;
  const filteredList = activeList.filter(
    (item) =>
      item.nama.toLowerCase().includes(aktivitasSearch.toLowerCase()) ||
      item.detailInfo.toLowerCase().includes(aktivitasSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Aktivitas Pemeriksaan Lansia"
    >
      <div className="space-y-4 max-w-xl">
        {/* Header Stats Selector Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAktivitasTab("lansia")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              aktivitasTab === "lansia"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-gray-50/60 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1 truncate">
              <LansiaIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Lansia Selesai Periksa</span>
            </div>
            <div className="text-xl font-black text-saas-dark">
              {aktivitasData?.lansiaSelesaiCount ?? lansiaSelesai.length}{" "}
              <span className="text-xs font-normal text-saas-muted">Lansia</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAktivitasTab("belum_lansia")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              aktivitasTab === "belum_lansia"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-gray-50/60 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1 truncate">
              <LansiaIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Lansia Belum Periksa</span>
            </div>
            <div className="text-xl font-black text-saas-dark">
              {belumLansia.length}{" "}
              <span className="text-xs font-normal text-saas-muted">Lansia</span>
            </div>
          </button>
        </div>

        {/* Search filter in modal */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama lansia atau RT/RW..."
            value={aktivitasSearch}
            onChange={(e) => setAktivitasSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-saas-primary text-gray-900"
          />
          {aktivitasSearch && (
            <button
              type="button"
              onClick={() => setAktivitasSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* List display */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white border border-gray-150 rounded-xl shadow-xs flex items-center justify-between hover:border-emerald-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate("Lansia", item.id);
                    }}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer bg-blue-50 border-blue-100 text-blue-600"
                    title="Lihat Profil Lansia"
                  >
                    <LansiaIcon className="w-5 h-5" gender={item.jenisKelamin} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate("Lansia", item.id);
                        }}
                        className="font-bold text-xs text-saas-dark hover:text-saas-primary hover:underline text-left cursor-pointer"
                      >
                        {item.nama}
                      </button>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          aktivitasTab === "lansia"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {aktivitasTab === "lansia" ? "Sudah Diperiksa" : "Belum Periksa"}
                      </span>
                    </div>
                    <p className="text-[11px] text-saas-muted">{item.detailInfo}</p>
                    {item.detailPemeriksaan && (
                      <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        {item.detailPemeriksaan}
                      </p>
                    )}
                    {item.tanggalPeriksa && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatTanggalIndonesia(item.tanggalPeriksa)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {aktivitasTab === "belum_lansia" && (
                    <button
                      type="button"
                      onClick={() =>
                        onQuickInputForPatient({
                          id: item.id,
                          nama: item.nama,
                          tipe: "Lansia",
                          detailInfo: item.detailInfo,
                        })
                      }
                      className="px-2.5 py-1.5 text-xs font-bold text-saas-primary hover:text-white hover:bg-saas-primary border border-saas-primary/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Input Cepat</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate("Lansia", item.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-saas-primary hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    title="Buka Profil"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-saas-muted font-medium">
              Tidak ada data lansia yang sesuai kriteria pencarian.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}