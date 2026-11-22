"use client";

import * as XLSX from "xlsx";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Globe,
  Building2,
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  Loader2,
  LogOut,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import PageHelmet from "@/components/PageHelmet";
import { useAuth } from "@/contexts/AuthContext";
import { publicPuskesmasApi, PublicPemeriksaanItem, PublicPosyanduInfo, ItemRiwayat } from "@/lib/api";
import { SearchIndex } from "@/lib/searchIndex";
import LaporanFilterCard from "@/features/laporan/components/LaporanFilterCard";
import LansiaLaporanView from "@/features/laporan/components/LansiaLaporanView";
import PuskesmasParticipantModal from "./components/PuskesmasParticipantModal";
import PuskesmasPreviewModal from "./components/PuskesmasPreviewModal";
import { LaporanSkeleton } from "@/components/Skeleton";
import {
  calculateRekapanLansia,
  formatPeriodeText,
} from "@/features/laporan/utils/laporanCalculators";

function toItemRiwayat(item: PublicPemeriksaanItem): ItemRiwayat {
  let sistol = item.sistol;
  let diastol = item.diastol;
  if ((!sistol || !diastol) && item.tekananDarah && item.tekananDarah.includes("/")) {
    const parts = item.tekananDarah.split("/");
    sistol = sistol || parseInt(parts[0], 10) || undefined;
    diastol = diastol || parseInt(parts[1], 10) || undefined;
  }

  const maskedNik = item.nik && item.nik.length >= 8
    ? `${item.nik.slice(0, 6)}******${item.nik.slice(-4)}`
    : item.nik;

  return {
    id: item.id,
    pasienId: item.nik || item.namaWarga,
    nama: item.namaWarga,
    tipe: "Lansia",
    tanggal: item.tanggalPeriksa,
    petugas: item.posyanduNama,
    parameter: `${item.tekananDarah || (sistol ? `${sistol}/${diastol} mmHg` : "-")}`,
    status: item.statusRingkasan,
    statusType: item.isPerluRujukan ? "warning" : "success",
    nik: maskedNik,
    jenisKelamin: item.jenisKelamin,
    beratBadan: item.beratBadan,
    tinggiBadan: item.tinggiBadan,
    tekananDarahSistol: sistol,
    tekananDarahDiastol: diastol,
    gulaDarahSewaktu: item.gds,
    kolesterol: item.kolesterol,
    asamUrat: item.asamUrat,
    lingkarPerut: item.lingkarPerut,
    riwayatHt: item.riwayatHt,
    riwayatDm: item.riwayatDm,
    keluhan: item.keluhan,
    tindakan: item.tindakan,
    ...(item.usiaInfo ? { usiaInfo: item.usiaInfo } : {}),
  } as ItemRiwayat;
}

export default function PuskesmasPublicPage() {
  const { user, isLoading: isAuthLoading, login, logout } = useAuth();

  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
  const currentYearStr = String(now.getFullYear());

  const [data, setData] = useState<PublicPemeriksaanItem[]>([]);
  const [posyandus, setPosyandus] = useState<PublicPosyanduInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);

  // Local login state for unauthenticated users
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handlePuskesmasLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "Gagal masuk. Periksa kembali email/username dan kata sandi Anda.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Filters State
  const [selectedPosyandu, setSelectedPosyandu] = useState<string>("semua");
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [filterYear, setFilterYear] = useState<string>(currentYearStr);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Search & Pagination states
  const [searchLansia, setSearchLansia] = useState<string>("");
  const [pageSizeLansia, setPageSizeLansia] = useState<number>(10);
  const [pageLansia, setPageLansia] = useState<number>(1);

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState<PublicPemeriksaanItem | null>(null);

  // Print & PDF Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const lansiaIndexRef = useRef<SearchIndex<PublicPemeriksaanItem>>(
    new SearchIndex<PublicPemeriksaanItem>((l) => [
      l.namaWarga,
      l.posyanduNama,
      l.desa,
      l.wilayah,
      l.nik,
      l.petugas,
      l.keluhan,
      l.tindakan,
      l.tindakanCatatan,
      l.statusRingkasan,
    ])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [posList, records] = await Promise.all([
        publicPuskesmasApi.getPosyandus(),
        publicPuskesmasApi.getPemeriksaanData({
          posyanduId: selectedPosyandu,
          kategori: "Lansia",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);
      setPosyandus(posList);
      setData(records);
    } catch (err) {
      console.error("Gagal memuat data puskesmas:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "PUSKESMAS") {
      loadData();
    }
  }, [user, selectedPosyandu, startDate, endDate]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedPosyandu !== "semua" && item.posyanduId !== selectedPosyandu) {
        return false;
      }
      if (filterYear) {
        const itemYear = new Date(item.tanggalPeriksa).getFullYear().toString();
        if (itemYear !== filterYear) return false;
      }
      if (filterMonth) {
        const itemMonth = String(new Date(item.tanggalPeriksa).getMonth() + 1).padStart(2, "0");
        if (itemMonth !== filterMonth) return false;
      }
      if (startDate && item.tanggalPeriksa < startDate) return false;
      if (endDate && item.tanggalPeriksa > endDate) return false;
      return true;
    });
  }, [data, selectedPosyandu, filterYear, filterMonth, startDate, endDate]);

  useEffect(() => {
    lansiaIndexRef.current.setSource(filteredData);
  }, [filteredData]);

  const filteredLansiaRaw = useMemo(() => {
    if (!searchLansia.trim()) {
      return filteredData;
    }
    return lansiaIndexRef.current.search(searchLansia);
  }, [filteredData, searchLansia]);

  const filteredLansiaLogs = useMemo(() => {
    return filteredLansiaRaw.map(toItemRiwayat);
  }, [filteredLansiaRaw]);

  const periodeText = useMemo(() => {
    return formatPeriodeText(filterMonth, filterYear);
  }, [filterMonth, filterYear]);

  const rekapanLansia = useMemo(() => {
    const lansiaLogs = filteredData.map(toItemRiwayat);
    const totalLansia = new Set(lansiaLogs.map((l) => l.pasienId || l.nama)).size;
    return calculateRekapanLansia(lansiaLogs, totalLansia, periodeText);
  }, [filteredData, periodeText]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const selectedPosyanduName =
    selectedPosyandu === "semua"
      ? "Semua Posyandu"
      : posyandus.find((p) => p.id === selectedPosyandu)?.nama || selectedPosyandu;

  // Export to Excel (.xlsx) menggunakan SheetJS
  const handleExportExcel = () => {
    try {
      setExportingExcel(true);
      if (filteredLansiaRaw.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
      }

      const rows = filteredLansiaRaw.map((item, idx) => ({
        No: idx + 1,
        "Nama Lansia": item.namaWarga || "",
        Posyandu: item.posyanduNama || "",
        Wilayah: item.wilayah || "",
        "Tanggal Periksa": item.tanggalPeriksa || "",
        "Jenis Kelamin": item.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
        Usia: item.usiaInfo || "-",
        "Riw. HT": item.riwayatHt ? "Ya" : "Tidak",
        "Riw. DM": item.riwayatDm ? "Ya" : "Tidak",
        "BB (kg)": item.beratBadan ?? "",
        "TB (cm)": item.tinggiBadan ?? "",
        "Tekanan Darah": item.tekananDarah || (item.sistol ? `${item.sistol}/${item.diastol}` : "-"),
        "GDS (mg/dL)": item.gds ?? "",
        "Kolesterol (mg/dL)": item.kolesterol ?? "",
        "Asam Urat (mg/dL)": item.asamUrat ?? "",
        "Lingkar Perut (cm)": item.lingkarPerut ?? "",
        Keluhan: item.keluhan || "-",
        "Tindakan Medis": item.tindakan || item.tindakanCatatan || "-",
        "Status Ringkasan": item.statusRingkasan || "-",
        Petugas: item.petugas || "Kader Posyandu",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Lansia");

      const fileName = `Laporan_Puskesmas_Lansia_${periodeText.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error("Gagal export Excel:", err);
      alert("Gagal mengunduh file Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSelectLog = (log: ItemRiwayat) => {
    const raw = data.find((d) => d.id === log.id);
    if (raw) {
      setSelectedItem(raw);
    }
  };

  const handleResetCurrentPeriod = () => {
    setFilterMonth(currentMonthStr);
    setFilterYear(currentYearStr);
    setStartDate("");
    setEndDate("");
    setPageLansia(1);
  };

  const handleResetAllPeriods = () => {
    setFilterMonth("");
    setFilterYear("");
    setStartDate("");
    setEndDate("");
    setPageLansia(1);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Memeriksa hak akses portal...</p>
        </div>
      </div>
    );
  }

  // Login Gate jika belum login atau bukan PUSKESMAS
  if (!user || user.role !== "PUSKESMAS") {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-8">
        <PageHelmet
          title="Autentikasi Portal Puskesmas"
          description="Akses login resmi khusus petugas Puskesmas Pembina Posyandu Lansia."
        />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-900 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Portal Resmi</span>
              <h1 className="text-sm font-bold text-white leading-none">Puskesmas Pembina Lansia</h1>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Kembali ke Aplikasi Posyandu &rarr;
          </Link>
        </div>

        <div className="max-w-md mx-auto w-full py-12">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Login Petugas Puskesmas</h2>
              <p className="text-xs text-slate-400 font-normal">
                Khusus petugas Puskesmas Pembina untuk monitoring rekapitulasi Posyandu Lansia.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handlePuskesmasLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email atau Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@puskesmas.go.id"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{isLoggingIn ? "Memverifikasi..." : "Masuk ke Portal"}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Sistem Informasi Posyandu Lansia • Kementerian Kesehatan RI
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6 print:p-0 print:bg-white ${
        isPreviewOpen ? "print:hidden" : ""
      }`}
    >
      <PageHelmet
        title="Portal Puskesmas — Rekapitulasi Lansia"
        description="Portal rekapitulasi data pemeriksaan kesehatan lansia seluruh Posyandu binaan Puskesmas."
      />

      {/* Header Halaman */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 shadow-2xs flex items-center justify-center p-2 shrink-0 mt-0.5 text-teal-700">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-teal-800">
                Portal Puskesmas
              </span>
              {user && (
                <span className="text-xs text-slate-500">
                  · Petugas: <strong className="text-slate-800 font-semibold">{user.nama}</strong> ({user.posyandu?.nama || "Puskesmas"})
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Rekapitulasi Pelayanan Posyandu Lansia
            </h2>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Monitoring dan rekapitulasi data skrining penyakit tidak menular Lansia seluruh Posyandu binaan Puskesmas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:self-center flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <span>Aplikasi Posyandu</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/publik"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Portal Publik ↗</span>
          </Link>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Keluar dari sesi ini"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="print:hidden">
        <LaporanFilterCard
          filterCategory="Lansia"
          posyandus={posyandus}
          selectedPosyandu={selectedPosyandu}
          setSelectedPosyandu={(p) => {
            setSelectedPosyandu(p);
            setPageLansia(1);
          }}
          filterMonth={filterMonth}
          setFilterMonth={(m) => {
            setFilterMonth(m);
            setPageLansia(1);
          }}
          filterYear={filterYear}
          setFilterYear={(y) => {
            setFilterYear(y);
            setPageLansia(1);
          }}
          filterFromDate={startDate}
          setFilterFromDate={(d) => {
            setStartDate(d);
            setPageLansia(1);
          }}
          filterToDate={endDate}
          setFilterToDate={(d) => {
            setEndDate(d);
            setPageLansia(1);
          }}
          yearOptions={yearOptions}
          onResetCurrentPeriod={handleResetCurrentPeriod}
          onResetAllPeriods={handleResetAllPeriods}
          isLoading={isLoading}
          hasData={filteredLansiaRaw.length > 0}
          onOpenPreview={handleOpenPreview}
          onExportExcel={handleExportExcel}
          isExportingExcel={exportingExcel}
        />
      </div>

      {/* Main Report View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <LaporanSkeleton />
        </div>
      ) : (
        <LansiaLaporanView
          rekapanLansia={rekapanLansia}
          filteredLansiaLogs={filteredLansiaLogs}
          pageLansia={pageLansia}
          setPageLansia={setPageLansia}
          pageSizeLansia={pageSizeLansia}
          setPageSizeLansia={setPageSizeLansia}
          searchLansia={searchLansia}
          setSearchLansia={setSearchLansia}
          onSelectLog={handleSelectLog}
          isPublic={true}
          isUpdating={isLoading}
        />
      )}

      {/* Footer Puskesmas Page */}
      <footer className="print:hidden border-t border-gray-200/80 pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© 2026 SIKALANSIA · Sistem Informasi Posyandu Lansia</p>
      </footer>

      {/* Participant Detail Modal */}
      <PuskesmasParticipantModal
        isOpen={Boolean(selectedItem)}
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        allItems={data}
      />

      {/* Modal Pratinjau Dokumen Laporan Resmi */}
      <PuskesmasPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        periodeText={periodeText}
        selectedPosyanduName={selectedPosyanduName}
        rekapanLansia={rekapanLansia}
        filteredLansiaLogs={filteredLansiaRaw}
        exportingExcel={exportingExcel}
        onExportExcel={handleExportExcel}
        onPrintPdf={handlePrintPdf}
      />
    </div>
  );
}