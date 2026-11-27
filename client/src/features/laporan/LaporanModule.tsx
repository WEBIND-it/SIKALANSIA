"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  riwayatApi,
  ItemRiwayat,
  PeriodePelayanan,
  periodeApi,
  lansiaApi,
} from "@/lib/api";
import { clientDataCache } from "@/lib/dataCache";
import { SearchIndex } from "@/lib/searchIndex";
import PageHelmet from "@/components/PageHelmet";
import { LaporanSkeleton } from "@/components/Skeleton";
import PdfPreviewModal from "@/components/PdfPreviewModal";
import { RekapanLansia } from "./types";
import {
  formatPeriodeText,
  filterLogsByDateRange,
  calculateRekapanLansia,
} from "./utils/laporanCalculators";
import LaporanFilterCard from "./components/LaporanFilterCard";
import LansiaLaporanView from "./components/LansiaLaporanView";

interface LaporanModuleProps {
  posyanduId: string;
  activePeriode?: PeriodePelayanan | null;
  onNavigate?: (module: string, itemId?: string) => void;
}

export default function LaporanModule({
  posyanduId,
  activePeriode,
  onNavigate,
}: LaporanModuleProps) {
  const now = new Date();
  const defaultMonth = activePeriode?.bulan
    ? String(activePeriode.bulan).padStart(2, "0")
    : String(now.getMonth() + 1).padStart(2, "0");
  const defaultYear = activePeriode?.tahun
    ? String(activePeriode.tahun)
    : String(now.getFullYear());

  const initialCacheKey = `laporan_logs_${posyanduId}_${defaultMonth}_${defaultYear}`;
  const [logs, setLogs] = useState<ItemRiwayat[]>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<ItemRiwayat[]>(initialCacheKey);
      if (cached && cached.length > 0) return cached;
    }
    return [];
  });
  const [filterMonth, setFilterMonth] = useState<string>(defaultMonth);
  const [filterYear, setFilterYear] = useState<string>(defaultYear);
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");

  // In-Memory Search Index for instant search
  const lansiaIndexRef = useRef<SearchIndex<ItemRiwayat>>(
    new SearchIndex<ItemRiwayat>((l) => [
      l.nama,
      l.nik,
      l.petugas,
      l.parameter,
      l.keluhan,
      l.tindakan,
      l.status,
    ])
  );

  // Sync index whenever logs are loaded or changed
  useEffect(() => {
    lansiaIndexRef.current.setSource(logs.filter((l) => l.tipe === "Lansia"));
  }, [logs]);

  // Sync saat activePeriode berubah
  useEffect(() => {
    if (activePeriode?.bulan && activePeriode?.tahun) {
      setFilterMonth(String(activePeriode.bulan).padStart(2, "0"));
      setFilterYear(String(activePeriode.tahun));
    } else if (posyanduId && !activePeriode) {
      periodeApi
        .getActive(posyanduId)
        .then((res) => {
          if (res.success && res.data?.bulan && res.data?.tahun) {
            setFilterMonth(String(res.data.bulan).padStart(2, "0"));
            setFilterYear(String(res.data.tahun));
          }
        })
        .catch(() => {});
    }
  }, [posyanduId, activePeriode]);

  // Total terdaftar lansia untuk menghitung cakupan (%)
  const [totalLansiaTerdaftar, setTotalLansiaTerdaftar] = useState<number>(0);

  useEffect(() => {
    if (!posyanduId) return;
    lansiaApi
      .getAll(posyanduId, { limit: 1000 })
      .then((res) => {
        if (res.success && res.data) {
          setTotalLansiaTerdaftar(res.data.length);
        }
      })
      .catch(() => {});
  }, [posyanduId]);

  const [rekapanLansia, setRekapanLansia] = useState<RekapanLansia | null>(null);
  const [rekapanLoading, setRekapanLoading] = useState(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<ItemRiwayat[]>(initialCacheKey);
      if (cached && cached.length > 0) return false;
    }
    return false;
  });
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [searchLansia, setSearchLansia] = useState<string>("");
  const [pageSizeLansia, setPageSizeLansia] = useState<number>(10);
  const [pageLansia, setPageLansia] = useState<number>(1);

  // State Pengaturan Tanda Tangan & Pejabat Desa
  const [tanggalTtd, setTanggalTtd] = useState<string>("");
  const [namaKades, setNamaKades] = useState<string>("H. Ahmad Supriyadi");
  const [namaBidan, setNamaBidan] = useState<string>("Bd. Siti Nurhaliza, S.Tr.Keb");
  const [namaKaur, setNamaKaur] = useState<string>("Bambang Wijaya");

  // State Pratinjau Laporan (PDF Modal Preview)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fetchRiwayat = async () => {
    if (!posyanduId) return;
    const cacheKey = `laporan_logs_${posyanduId}_${filterMonth}_${filterYear}`;
    const cached = clientDataCache.get<ItemRiwayat[]>(cacheKey);

    if (cached && cached.length > 0) {
      setLogs(cached);
      setRekapanLoading(false);
    } else if (logs.length === 0) {
      setRekapanLoading(true);
    }

    setIsFetchingData(true);
    try {
      const res = await riwayatApi.getAll(posyanduId, {
        tipe: "lansia",
        bulan: filterMonth || undefined,
        tahun: filterYear || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data);
        clientDataCache.set(cacheKey, res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data riwayat:", err);
      if (!cached) setLogs([]);
    } finally {
      setRekapanLoading(false);
      setIsFetchingData(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await riwayatApi.downloadPdf(posyanduId, {
        tipe: "Lansia",
        bulan: filterMonth || undefined,
        tahun: filterYear || undefined,
        search: searchLansia || undefined,
        tanggalTtd: tanggalTtd || undefined,
        namaKades: namaKades || undefined,
        namaBidan: namaBidan || undefined,
        namaKaur: namaKaur || undefined,
      });
    } catch (err) {
      console.error("Gagal export PDF:", err);
      alert("Gagal mengunduh PDF. Silakan coba lagi.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await riwayatApi.downloadExcel(posyanduId, {
        tipe: "Lansia",
        bulan: filterMonth || undefined,
        tahun: filterYear || undefined,
        search: searchLansia || undefined,
      });
    } catch (err) {
      console.error("Gagal export Excel:", err);
      alert("Gagal mengunduh Excel. Silakan coba lagi.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleOpenPreview = async () => {
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);

    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewPdfBlob(null);

    try {
      const { url, blob } = await riwayatApi.getPdfBlobUrl(posyanduId, {
        tipe: "Lansia",
        bulan: filterMonth || undefined,
        tahun: filterYear || undefined,
        search: searchLansia || undefined,
        tanggalTtd: tanggalTtd || undefined,
        namaKades: namaKades || undefined,
        namaBidan: namaBidan || undefined,
        namaKaur: namaKaur || undefined,
      });
      setPreviewPdfUrl(url);
      setPreviewPdfBlob(blob);
    } catch (err: any) {
      console.error("Gagal memuat pratinjau PDF:", err);
      setPreviewError(err.message || "Gagal memuat pratinjau dokumen. Silakan coba lagi.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewPdfBlob(null);
    setPreviewError(null);
  };

  const handleDownloadFromPreview = () => {
    if (previewPdfBlob) {
      const filename = `Laporan_Lansia_Posyandu_${new Date().toISOString().slice(0, 10)}.pdf`;
      riwayatApi.downloadPdfBlob(previewPdfBlob, filename);
    } else {
      handleExportPdf();
    }
  };

  const periodeText = formatPeriodeText(filterMonth, filterYear);

  useEffect(() => {
    if (posyanduId) {
      fetchRiwayat();
    }
  }, [posyanduId, filterMonth, filterYear]);

  // Hitung rekapan lansia secara reaktif
  useEffect(() => {
    const activeLogs = filterLogsByDateRange(logs, filterFromDate, filterToDate);
    const lansiaLogs = activeLogs.filter((l) => l.tipe === "Lansia");

    setRekapanLansia(calculateRekapanLansia(lansiaLogs, totalLansiaTerdaftar, periodeText));
    setPageLansia(1);
  }, [logs, filterFromDate, filterToDate, totalLansiaTerdaftar, periodeText]);

  // Filter data Lansia berdasarkan search & tanggal, serta urutkan A-Z
  const filteredLansiaLogs = useMemo(() => {
    const source = searchLansia.trim()
      ? lansiaIndexRef.current.search(searchLansia)
      : logs.filter((l) => l.tipe === "Lansia");

    const filtered = filterLogsByDateRange(source, filterFromDate, filterToDate);
    return [...filtered].sort((a, b) =>
      (a.nama || "").localeCompare(b.nama || "", "id", { sensitivity: "base" })
    );
  }, [logs, searchLansia, filterFromDate, filterToDate]);

  const currentYear = new Date().getFullYear();
  const baseYear = activePeriode?.tahun ? Math.max(currentYear, activePeriode.tahun) : currentYear;
  const yearOptions = Array.from({ length: 6 }, (_, i) => baseYear - i);

  const hasData = filteredLansiaLogs.length > 0;

  if (rekapanLoading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
        <PageHelmet
          title="Laporan Rekapan Lansia"
          description="Laporan rekapitulasi pemeriksaan bulanan Lansia dengan filter periode."
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Rekapan Lansia</h2>
          <p className="text-sm text-gray-600 mt-1">
            Laporan rekapitulasi data pemeriksaan Lansia berdasarkan periode waktu dan kegiatan posyandu.
          </p>
        </div>
        <LaporanSkeleton />
      </div>
    );
  }

  const filterKey = `Lansia_${filterMonth}_${filterYear}_${filterFromDate}_${filterToDate}_${logs.length}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <PageHelmet
        title="Laporan Rekapan Lansia"
        description="Laporan rekapitulasi pemeriksaan bulanan Lansia dengan filter periode."
      />

      {/* Header Halaman */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Rekapan Lansia</h2>
        <p className="text-sm text-gray-600 mt-1">
          Laporan rekapitulasi data pemeriksaan dan faktor risiko Lansia berdasarkan periode pelayanan posyandu.
        </p>
      </div>

      {/* Filter Controls & Export Box */}
      <LaporanFilterCard
        filterCategory="Lansia"
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterFromDate={filterFromDate}
        setFilterFromDate={setFilterFromDate}
        filterToDate={filterToDate}
        setFilterToDate={setFilterToDate}
        yearOptions={yearOptions}
        onResetCurrentPeriod={() => {
          const curM = activePeriode?.bulan
            ? String(activePeriode.bulan).padStart(2, "0")
            : String(now.getMonth() + 1).padStart(2, "0");
          const curY = activePeriode?.tahun
            ? String(activePeriode.tahun)
            : String(now.getFullYear());
          setFilterMonth(curM);
          setFilterYear(curY);
          setFilterFromDate("");
          setFilterToDate("");
          setSearchLansia("");
        }}
        onResetAllPeriods={() => {
          setFilterMonth("");
          setFilterYear("");
          setFilterFromDate("");
          setFilterToDate("");
          setSearchLansia("");
        }}
        isLoading={rekapanLoading || isFetchingData}
        hasData={hasData}
        onOpenPreview={handleOpenPreview}
        onExportExcel={handleExportExcel}
        isExportingExcel={exportingExcel}
        isExportingPdf={exportingPdf}
        tanggalTtd={tanggalTtd}
        setTanggalTtd={setTanggalTtd}
        namaKades={namaKades}
        setNamaKades={setNamaKades}
        namaBidan={namaBidan}
        setNamaBidan={setNamaBidan}
        namaKaur={namaKaur}
        setNamaKaur={setNamaKaur}
      />

      {/* Tampilan Rekapan Lansia */}
      <LansiaLaporanView
        rekapanLansia={rekapanLansia}
        filteredLansiaLogs={filteredLansiaLogs}
        pageLansia={pageLansia}
        setPageLansia={setPageLansia}
        pageSizeLansia={pageSizeLansia}
        setPageSizeLansia={setPageSizeLansia}
        searchLansia={searchLansia}
        setSearchLansia={setSearchLansia}
        onNavigate={onNavigate}
        triggerKey={filterKey}
        isUpdating={isFetchingData}
      />

      {/* Modal Pratinjau Dokumen Laporan */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        pdfUrl={previewPdfUrl}
        isLoading={previewLoading}
        error={previewError}
        category="Lansia"
        periodeText={periodeText}
        onRetry={handleOpenPreview}
        onDownloadPdf={handleDownloadFromPreview}
        onDownloadExcel={handleExportExcel}
        isExportingExcel={exportingExcel}
      />
    </div>
  );
}