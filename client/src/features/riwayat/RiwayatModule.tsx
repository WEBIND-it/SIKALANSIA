'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { formatTanggalIndonesia, formatTanggalInput } from "../../lib/dateUtils";
import { riwayatApi, ItemRiwayat, lansiaApi, PeriodePelayanan } from "@/lib/api";
import { SearchIndex } from "../../lib/searchIndex";
import { clientDataCache } from "../../lib/dataCache";
import PageHelmet from "@/components/PageHelmet";
import RiwayatFilterBar from "./components/RiwayatFilterBar";
import RiwayatTrendChart from "./components/RiwayatTrendChart";
import RiwayatTable from "./components/RiwayatTable";
import RiwayatDetailModal from "./components/RiwayatDetailModal";
import RiwayatModals from "./components/RiwayatModals";

interface RiwayatModuleProps {
  posyanduId: string;
  activePeriode?: PeriodePelayanan | null;
  onNavigate?: (module: string, itemId?: string) => void;
}

export default function RiwayatModule({ posyanduId, activePeriode, onNavigate }: RiwayatModuleProps) {
  const initialCacheKey = `riwayat_logs_${posyanduId}_lansia_semua_${activePeriode ? activePeriode.bulan : "semua"}_${activePeriode ? activePeriode.tahun : "semua"}`;
  const [logs, setLogs] = useState<ItemRiwayat[]>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<ItemRiwayat[]>(initialCacheKey);
      if (cached && cached.length > 0) return cached;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<ItemRiwayat[]>(initialCacheKey);
      if (cached && cached.length > 0) return false;
    }
    return true;
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "success" | "warning">("semua");
  const [selectedBulan, setSelectedBulan] = useState<number | "semua">(
    activePeriode ? activePeriode.bulan : "semua"
  );
  const [selectedTahun, setSelectedTahun] = useState<number | "semua">(
    activePeriode ? activePeriode.tahun : "semua"
  );

  // In-Memory Search Index for instant O(1) query lookups
  const riwayatIndexRef = useRef<SearchIndex<ItemRiwayat>>(
    new SearchIndex<ItemRiwayat>((log) => [
      log.nama,
      log.nik,
      log.parameter,
      log.status,
      log.petugas,
      log.keluhan,
      log.tindakan,
    ])
  );

  useEffect(() => {
    riwayatIndexRef.current.setSource(logs);
  }, [logs]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, selectedBulan, selectedTahun]);

  // Tab mode: "tabel" vs "grafik"
  const [viewMode, setViewMode] = useState<"tabel" | "grafik">("tabel");

  // Modal Detail & Grafik Perkembangan Peserta State
  const [selectedDetailLog, setSelectedDetailLog] = useState<ItemRiwayat | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal Edit & Delete State
  const [selectedLog, setSelectedLog] = useState<ItemRiwayat | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields - Lansia
  const [lDate, setLDate] = useState("");
  const [lBB, setLBB] = useState("");
  const [lTB, setLTB] = useState("");
  const [lSistol, setLSistol] = useState("");
  const [lDiastol, setLDiastol] = useState("");
  const [lGds, setLGds] = useState("");
  const [lLp, setLLp] = useState("");
  const [lKol, setLKol] = useState("");
  const [lUrat, setLUrat] = useState("");
  const [lKeluhan, setLKeluhan] = useState("");
  const [lTindakan, setLTindakan] = useState("");
  const [lPetugas, setLPetugas] = useState("");

  // Open Detail & Grafik Perkembangan Modal
  const openDetailModal = (log: ItemRiwayat) => {
    setSelectedDetailLog(log);
    setIsDetailModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (log: ItemRiwayat) => {
    setSelectedLog(log);
    setFormError("");
    setLDate(formatTanggalInput(log.tanggal));
    setLBB(log.beratBadan ? String(log.beratBadan) : "");
    setLTB(log.tinggiBadan ? String(log.tinggiBadan) : "");
    setLSistol(log.tekananDarahSistol ? String(log.tekananDarahSistol) : "");
    setLDiastol(log.tekananDarahDiastol ? String(log.tekananDarahDiastol) : "");
    setLGds(log.gulaDarahSewaktu ? String(log.gulaDarahSewaktu) : "");
    setLLp(log.lingkarPerut ? String(log.lingkarPerut) : "");
    setLKol(log.kolesterol ? String(log.kolesterol) : "");
    setLUrat(log.asamUrat ? String(log.asamUrat) : "");
    setLKeluhan(log.keluhan || "");
    setLTindakan(log.tindakan || "");
    setLPetugas(log.petugas || "");
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (log: ItemRiwayat) => {
    setSelectedLog(log);
    setIsDeleteModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    setFormError("");
    setSaving(true);
    try {
      const bb = parseFloat(lBB);
      const tb = parseFloat(lTB);
      const sistol = parseInt(lSistol);
      const diastol = parseInt(lDiastol);
      const gds = parseFloat(lGds);
      const lp = parseFloat(lLp);
      if (isNaN(bb) || bb <= 0 || isNaN(tb) || tb <= 0 || isNaN(sistol) || isNaN(diastol) || isNaN(gds) || isNaN(lp)) {
        setFormError("Mohon isi semua data pemeriksaan lansia dengan angka positif yang valid.");
        setSaving(false);
        return;
      }
      const pasienId = selectedLog.pasienId || selectedLog.id;
      await lansiaApi.updatePemeriksaan(posyanduId, pasienId, selectedLog.id, {
        tanggalPeriksa: lDate,
        beratBadan: bb,
        tinggiBadan: tb,
        tekananDarahSistol: sistol,
        tekananDarahDiastol: diastol,
        gulaDarahSewaktu: gds,
        lingkarPerut: lp,
        kolesterol: lKol ? parseFloat(lKol) : undefined,
        asamUrat: lUrat ? parseFloat(lUrat) : undefined,
        keluhan: lKeluhan || undefined,
        tindakan: lTindakan || undefined,
        petugas: lPetugas || undefined,
      } as any);

      fetchRiwayat();
      window.dispatchEvent(new Event("pemeriksaanSaved"));
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal mengedit data pemeriksaan.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedLog) return;
    setSaving(true);
    try {
      const pasienId = selectedLog.pasienId || selectedLog.id;
      await lansiaApi.deletePemeriksaan(posyanduId, pasienId, selectedLog.id);
      fetchRiwayat();
      window.dispatchEvent(new Event("pemeriksaanSaved"));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus riwayat periksa.");
    } finally {
      setSaving(false);
    }
  };

  // Load data riwayat dari backend API
  const fetchRiwayat = async () => {
    const currentKey = `riwayat_logs_${posyanduId}_lansia_${statusFilter}_${selectedBulan}_${selectedTahun}`;
    const cached = clientDataCache.get<ItemRiwayat[]>(currentKey);

    if (cached && cached.length > 0) {
      setLogs(cached);
      setLoading(false);
    } else if (logs.length === 0) {
      setLoading(true);
    }

    try {
      const res = await riwayatApi.getAll(posyanduId, {
        tipe: "lansia",
        search: query || undefined,
        status: statusFilter,
        bulan: selectedBulan === "semua" ? undefined : String(selectedBulan),
        tahun: selectedTahun === "semua" ? undefined : String(selectedTahun),
      });
      if (res.success) {
        setLogs(res.data);
        clientDataCache.set(currentKey, res.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data riwayat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [posyanduId, statusFilter, selectedBulan, selectedTahun]);

  // Bulan helper list
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const currentYear = new Date().getFullYear();
  const baseYear = activePeriode?.tahun ? Math.max(currentYear, activePeriode.tahun) : currentYear;
  const yearOptions = Array.from({ length: 6 }, (_, i) => baseYear - i);

  const handleSetCurrentPeriod = () => {
    if (activePeriode) {
      setSelectedBulan(activePeriode.bulan);
      setSelectedTahun(activePeriode.tahun);
    }
  };

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("semua");
    setSelectedBulan("semua");
    setSelectedTahun("semua");
  };

  const isFilterActive =
    query.trim() !== "" ||
    statusFilter !== "semua" ||
    selectedBulan !== "semua" ||
    selectedTahun !== "semua";

  // Data agregasi chart trend
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { tanggal: string; lansia: number; warning: number }>();
    const sortedLogs = [...logs].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    sortedLogs.forEach((item) => {
      const key = item.tanggal;
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          tanggal: key,
          lansia: 0,
          warning: 0,
        });
      }
      const entry = dateMap.get(key)!;
      entry.lansia += 1;
      if (item.statusType === "warning") {
        entry.warning += 1;
      }
    });

    return Array.from(dateMap.values());
  }, [logs]);

  // Data histori untuk modal detail log terpilih
  const participantHistory = useMemo(() => {
    if (!selectedDetailLog) return [];
    return logs
      .filter((l) => (l.pasienId && l.pasienId === selectedDetailLog.pasienId) || l.nama === selectedDetailLog.nama)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [logs, selectedDetailLog]);

  const latestRecord = participantHistory[participantHistory.length - 1];

  return (
    <div className="space-y-6">
      <PageHelmet
        title="Riwayat Pemeriksaan Lansia"
        description="Data histori dan arsip pemeriksaan kesehatan berkala lansia Posyandu."
      />

      {/* Filter Bar & Header */}
      <RiwayatFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        query={query}
        setQuery={setQuery}
        selectedBulan={selectedBulan}
        setSelectedBulan={setSelectedBulan}
        selectedTahun={selectedTahun}
        setSelectedTahun={setSelectedTahun}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        monthNames={monthNames}
        yearOptions={yearOptions}
        activePeriode={activePeriode}
        handleSetCurrentPeriod={handleSetCurrentPeriod}
        handleResetFilters={handleResetFilters}
        isFilterActive={isFilterActive}
      />

      {/* Main View: Tabel Riwayat atau Grafik Trend */}
      {viewMode === "tabel" ? (
        <RiwayatTable
          loading={loading}
          logs={logs}
          query={query}
          riwayatIndexRef={riwayatIndexRef}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          formatTanggalIndonesia={formatTanggalIndonesia}
          onNavigate={onNavigate}
          openDetailModal={openDetailModal}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
        />
      ) : (
        <RiwayatTrendChart chartData={chartData} />
      )}

      {/* Modal Detail & Grafik Individual Peserta */}
      <RiwayatDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedDetailLog={selectedDetailLog}
        participantHistory={participantHistory}
        latestRecord={latestRecord}
        onNavigate={onNavigate}
      />

      {/* Modal Edit & Delete */}
      <RiwayatModals
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        selectedLog={selectedLog}
        handleEditSubmit={handleEditSubmit}
        handleDeleteSubmit={handleDeleteSubmit}
        formError={formError}
        saving={saving}
        lDate={lDate}
        setLDate={setLDate}
        lBB={lBB}
        setLBB={setLBB}
        lTB={lTB}
        setLTB={setLTB}
        lSistol={lSistol}
        setLSistol={setLSistol}
        lDiastol={lDiastol}
        setLDiastol={setLDiastol}
        lGds={lGds}
        setLGds={setLGds}
        lLp={lLp}
        setLLp={setLLp}
        lKol={lKol}
        setLKol={setLKol}
        lUrat={lUrat}
        setLUrat={setLUrat}
        lKeluhan={lKeluhan}
        setLKeluhan={setLKeluhan}
        lTindakan={lTindakan}
        setLTindakan={setLTindakan}
        lPetugas={lPetugas}
        setLPetugas={setLPetugas}
      />
    </div>
  );
}