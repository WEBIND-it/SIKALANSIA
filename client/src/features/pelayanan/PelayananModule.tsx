"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatTanggalIndonesia } from "../../lib/dateUtils";
import {
  AlertCircle,
  Loader2,
  Edit2,
  Plus,
  CheckCircle2,
  UserPlus,
  Package,
} from "lucide-react";
import { lansiaApi, Lansia, PeriodePelayanan, stokPerlakuanApi, StokPerlakuan } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { SearchIndex } from "../../lib/searchIndex";
import { clientDataCache } from "../../lib/dataCache";
import Modal from "../../components/Modal";
import PageHelmet from "../../components/PageHelmet";
import toast from "react-hot-toast";
import {
  getExamDraft,
  saveExamDraft,
  clearExamDraft,
  getActivePatientId,
  setActivePatientId,
} from "../../lib/draftStorage";
import { PelayananSkeleton } from "../../components/Skeleton";
import LansiaIcon from "../../components/LansiaIcon";

// Extracted Subcomponents & Types
import {
  Pasien,
  SessionLog,
  calculateAgeInYears,
} from "./types";
import PelayananQueue from "./components/PelayananQueue";
import LansiaExamFields from "./components/LansiaExamFields";
import SessionLogsTable from "./components/SessionLogsTable";
import AddLansiaModal from "./components/AddLansiaModal";

interface PelayananModuleProps {
  posyanduId: string;
  activePeriode?: PeriodePelayanan | null;
  onOpenPeriodeModal?: () => void;
  onNavigate?: (menu: string, patientId?: string) => void;
}

export default function PelayananModule({
  posyanduId,
  activePeriode,
  onOpenPeriodeModal,
  onNavigate,
}: PelayananModuleProps) {
  const { user } = useAuth();
  const cacheKey = `pelayanan_pasiens_${posyanduId}`;
  const [pasiens, setPasiens] = useState<Pasien[]>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<Pasien[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }
    return [];
  });
  const [query, setQuery] = useState("");
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Modal konfirmasi hapus log
  const [deletingLog, setDeletingLog] = useState<SessionLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionLimit, setSessionLimit] = useState(10);
  const [isEditingExam, setIsEditingExam] = useState(false);

  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"semua" | "selesai" | "belum">("semua");

  // Search Engine In-Memory
  const searchIndex = useMemo(
    () =>
      new SearchIndex<Pasien>((p) => [
        p.nama,
        p.subInfo,
        p.detail1,
        p.detail2,
      ]),
    []
  );

  // Modal Tambah Lansia
  const [showAddLansiaModal, setShowAddLansiaModal] = useState(false);

  // Form Fields - Lansia
  const [beratBadanLansia, setBeratBadanLansia] = useState("");
  const [tinggiBadanLansia, setTinggiBadanLansia] = useState("");
  const [tensiSistol, setTensiSistol] = useState("");
  const [tensiDiastol, setTensiDiastol] = useState("");
  const [gulaDarah, setGulaDarah] = useState("");
  const [lingkarPerut, setLingkarPerut] = useState("");
  const [kolesterol, setKolesterol] = useState("");
  const [asamUrat, setAsamUrat] = useState("");
  const [keluhanLansia, setKeluhanLansia] = useState("");
  const [tindakanLansia, setTindakanLansia] = useState("");
  const [petugas, setPetugas] = useState("");

  // Stok Perlakuan Auto-Deduction State
  const [stokList, setStokList] = useState<StokPerlakuan[]>([]);
  const [manualCheckedStokIds, setManualCheckedStokIds] = useState<string[]>([]);
  const [manualUncheckedStokIds, setManualUncheckedStokIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSubmittedExam, setLastSubmittedExam] = useState<{
    nama: string;
    tipe: "Lansia";
    waktu: string;
    summary: string;
    status: string;
    statusType?: "success" | "warning" | "info";
  } | null>(null);

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<Pasien[]>(cacheKey);
      if (cached && cached.length > 0) return false;
    }
    return true;
  });

  const fetchPatients = (silent = false) => {
    const cached = clientDataCache.get<Pasien[]>(cacheKey);
    if (cached && cached.length > 0) {
      setIsLoading(false);
    } else if (!silent && pasiens.length === 0) {
      setIsLoading(true);
    }
    const targetMonth = activePeriode ? activePeriode.bulan : new Date().getMonth() + 1;
    const targetYear = activePeriode ? activePeriode.tahun : new Date().getFullYear();

    lansiaApi.getAll(posyanduId, { limit: 1000 })
      .then((lansiaRes) => {
        const lansias: Pasien[] = (lansiaRes.data || []).map((l: Lansia) => {
          const currentExam = (l.pemeriksaans || []).find((exam) => {
            const d = new Date(exam.tanggalPeriksa);
            return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
          });

          return {
            id: l.id,
            nama: l.nama,
            tipe: "Lansia",
            subInfo: `Usia ${calculateAgeInYears(l.tanggalLahir, new Date())} Tahun`,
            detail1: l.noBpjs || "BPJS -",
            detail2: `RT/RW ${l.rtRw || "-"}, ${l.alamat}`,
            tanggalLahir: l.tanggalLahir,
            jenisKelamin: l.jenisKelamin,
            isCheckedInCurrentPeriod: Boolean(currentExam),
            currentPeriodExam: currentExam,
          };
        });

        setPasiens(lansias);
        clientDataCache.set(cacheKey, lansias);

        searchIndex.setSource(lansias);

        // Ekstraksi Log Sesi Pemeriksaan Periode Ini
        const activeLogs: SessionLog[] = [];
        lansias.forEach((p) => {
          if (p.currentPeriodExam) {
            const exam = p.currentPeriodExam;
            const sis = exam.tekananDarahSistol;
            const dia = exam.tekananDarahDiastol;
            const gds = exam.gulaDarahSewaktu;

            const isHipertensi = sis >= 140 || dia >= 90;
            const isGdsTinggi = gds >= 200;
            const isWarning = isHipertensi || isGdsTinggi;

            let statusDesc = "Sehat & Normal";
            if (isHipertensi && isGdsTinggi) statusDesc = "Hipertensi & GDS Tinggi";
            else if (isHipertensi) statusDesc = "Hipertensi";
            else if (isGdsTinggi) statusDesc = "GDS Tinggi";

            activeLogs.push({
              id: exam.id,
              pasienId: p.id,
              nama: p.nama,
              tipe: "Lansia",
              waktu: new Date(exam.tanggalPeriksa).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              summary: `TD: ${sis}/${dia} mmHg, GDS: ${gds || "-"}, BB: ${exam.beratBadan} kg`,
              status: statusDesc,
              statusType: isWarning ? "warning" : "success",
              petugas: exam.petugas || "Kader",
            });
          }
        });

        setSessionLogs(activeLogs);
      })
      .catch((err) => {
        console.error("Gagal memuat data sasaran lansia:", err);
        toast.error("Gagal memuat data sasaran pelayanan lansia");
      })
      .finally(() => setIsLoading(false));
  };

  const fetchStokList = async () => {
    try {
      const res = await stokPerlakuanApi.getAll(posyanduId);
      if (res.success && Array.isArray(res.data)) {
        setStokList(res.data);
      }
    } catch {
      // Silent fallback jika stok belum tersedia
    }
  };

  useEffect(() => {
    if (posyanduId) {
      fetchPatients();
      fetchStokList();
    }
  }, [posyanduId, activePeriode]);

  const autoMatchedStokIds = useMemo(() => {
    if (isEditingExam || stokList.length === 0) return [];
    const matched: string[] = [];
    const hasGds = Number(gulaDarah) > 0;
    const hasKolesterol = Number(kolesterol) > 0;
    const hasAsamUrat = Number(asamUrat) > 0;

    for (const item of stokList) {
      if (item.sisa <= 0) continue;
      const kat = (item.kategori || "").toLowerCase();
      const nama = item.namaBarang.toLowerCase();
      if (hasGds && (kat.includes("gula") || nama.includes("gds") || nama.includes("gula darah"))) {
        matched.push(item.id);
      } else if (hasKolesterol && (kat.includes("kolesterol") || nama.includes("kolesterol"))) {
        matched.push(item.id);
      } else if (hasAsamUrat && (kat.includes("asam urat") || nama.includes("asam urat"))) {
        matched.push(item.id);
      }
    }
    return matched;
  }, [isEditingExam, stokList, gulaDarah, kolesterol, asamUrat]);

  const selectedStokIds = useMemo(() => {
    if (isEditingExam) return [];
    const availableIds = new Set(stokList.filter((s) => s.sisa > 0).map((s) => s.id));
    const autoActive = autoMatchedStokIds.filter((id) => !manualUncheckedStokIds.includes(id));
    const manualActive = manualCheckedStokIds.filter((id) => availableIds.has(id));
    return Array.from(new Set([...autoActive, ...manualActive]));
  }, [isEditingExam, stokList, autoMatchedStokIds, manualCheckedStokIds, manualUncheckedStokIds]);

  const toggleStokItem = (id: string) => {
    const isCurrentlySelected = selectedStokIds.includes(id);
    const isAuto = autoMatchedStokIds.includes(id);
    if (isCurrentlySelected) {
      setManualCheckedStokIds((prev) => prev.filter((x) => x !== id));
      if (isAuto) {
        setManualUncheckedStokIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }
    } else {
      setManualUncheckedStokIds((prev) => prev.filter((x) => x !== id));
      if (!isAuto) {
        setManualCheckedStokIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }
    }
  };

  const filteredPasiens = useMemo(() => {
    let result = pasiens;
    if (query.trim()) {
      result = searchIndex.search(query.trim());
    }

    if (statusFilter === "selesai") {
      result = result.filter((p) => p.isCheckedInCurrentPeriod);
    } else if (statusFilter === "belum") {
      result = result.filter((p) => !p.isCheckedInCurrentPeriod);
    }

    return result;
  }, [pasiens, query, statusFilter, searchIndex]);

  // Handle Pilih Pasien dari Antrian
  const handleSelectPasien = (p: Pasien) => {
    setSelectedPasien(p);
    setActivePatientId(posyanduId, p.id);

    // Cek apakah pasien sudah punya pemeriksaan di periode aktif -> pre-fill form
    if (p.currentPeriodExam) {
      const exam = p.currentPeriodExam;
      setIsEditingExam(true);
      setEditingExamId(exam.id);

      setBeratBadanLansia(String(exam.beratBadan || ""));
      setTinggiBadanLansia(String(exam.tinggiBadan || ""));
      setTensiSistol(String(exam.tekananDarahSistol || ""));
      setTensiDiastol(String(exam.tekananDarahDiastol || ""));
      setGulaDarah(String(exam.gulaDarahSewaktu || ""));
      setLingkarPerut(String(exam.lingkarPerut || ""));
      setKolesterol(exam.kolesterol !== null && exam.kolesterol !== undefined ? String(exam.kolesterol) : "");
      setAsamUrat(exam.asamUrat !== null && exam.asamUrat !== undefined ? String(exam.asamUrat) : "");
      setKeluhanLansia(exam.keluhan || "");
      setTindakanLansia(exam.tindakan || "");
      setPetugas(exam.petugas || user?.nama || "");
    } else {
      setIsEditingExam(false);
      setEditingExamId(null);
      resetLansiaForm();
    }
  };

  const resetLansiaForm = () => {
    setBeratBadanLansia("");
    setTinggiBadanLansia("");
    setTensiSistol("");
    setTensiDiastol("");
    setGulaDarah("");
    setLingkarPerut("");
    setKolesterol("");
    setAsamUrat("");
    setKeluhanLansia("");
    setTindakanLansia("");
    setPetugas(user?.nama || "");
    setFormWarning(null);
    setManualCheckedStokIds([]);
    setManualUncheckedStokIds([]);
  };

  const checkWarnings = (bb: string, sistol: string, gds: string) => {
    const s = Number(sistol);
    const g = Number(gds);
    if (s >= 140 || g >= 200) {
      setFormWarning("Peringatan: Tensi atau GDS melebihi batas rujukan normal.");
    } else {
      setFormWarning(null);
    }
  };

  // Handle Edit dari Session Log
  const handleEditLog = (log: SessionLog) => {
    const p = pasiens.find((pas) => pas.id === log.pasienId);
    if (p) {
      handleSelectPasien(p);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Handle Konfirmasi Hapus Log
  const handleDeleteLogConfirm = async () => {
    if (!deletingLog || !deletingLog.pasienId) return;
    setIsDeleting(true);
    try {
      await lansiaApi.deletePemeriksaan(posyanduId, deletingLog.pasienId, deletingLog.id);
      toast.success("Catatan pemeriksaan berhasil dihapus");
      setDeletingLog(null);
      if (selectedPasien?.id === deletingLog.pasienId) {
        setSelectedPasien(null);
        resetLansiaForm();
      }
      fetchPatients(true);
    } catch (err: any) {
      console.error("Gagal menghapus log pemeriksaan:", err);
      toast.error(err.message || "Gagal menghapus log pemeriksaan");
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Pemeriksaan Lansia
  const handleSubmitLansia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien) return;

    if (!beratBadanLansia || !tinggiBadanLansia || !tensiSistol || !tensiDiastol || !gulaDarah || !lingkarPerut) {
      toast.error("Mohon lengkapi seluruh pengukuran wajib (BB, TB, Tensi Sistol/Diastol, GDS, Lingkar Perut)");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const payload = {
        tanggalPeriksa: now.toISOString(),
        beratBadan: Number(beratBadanLansia),
        tinggiBadan: Number(tinggiBadanLansia),
        tekananDarahSistol: Number(tensiSistol),
        tekananDarahDiastol: Number(tensiDiastol),
        gulaDarahSewaktu: Number(gulaDarah),
        lingkarPerut: Number(lingkarPerut),
        kolesterol: kolesterol ? Number(kolesterol) : undefined,
        asamUrat: asamUrat ? Number(asamUrat) : undefined,
        keluhan: keluhanLansia || undefined,
        tindakan: tindakanLansia || undefined,
        petugas: petugas || user?.nama || "Kader",
      };

      if (isEditingExam && editingExamId) {
        await lansiaApi.updatePemeriksaan(posyanduId, selectedPasien.id, editingExamId, payload);
        toast.success("Data pemeriksaan lansia berhasil diperbarui!");
      } else {
        await lansiaApi.createPemeriksaan(posyanduId, selectedPasien.id, {
          ...payload,
          ...(selectedStokIds.length > 0 ? { usedStokIds: selectedStokIds } : {}),
        });
        toast.success(
          selectedStokIds.length > 0
            ? `Pemeriksaan disimpan & ${selectedStokIds.length} stok perlakuan terpotong otomatis!`
            : "Pemeriksaan lansia berhasil disimpan!"
        );
        if (selectedStokIds.length > 0) {
          fetchStokList();
        }
      }

      clearExamDraft(posyanduId, selectedPasien.id);

      const sis = Number(tensiSistol);
      const dia = Number(tensiDiastol);
      const gds = Number(gulaDarah);
      const isHipertensi = sis >= 140 || dia >= 90;
      const isGdsTinggi = gds >= 200;

      let statusDesc = "Sehat & Normal";
      if (isHipertensi && isGdsTinggi) statusDesc = "Hipertensi & GDS Tinggi";
      else if (isHipertensi) statusDesc = "Hipertensi";
      else if (isGdsTinggi) statusDesc = "GDS Tinggi";

      setLastSubmittedExam({
        nama: selectedPasien.nama,
        tipe: "Lansia",
        waktu: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        summary: `TD: ${sis}/${dia} mmHg, GDS: ${gds}, BB: ${beratBadanLansia} kg`,
        status: statusDesc,
        statusType: isHipertensi || isGdsTinggi ? "warning" : "success",
      });

      setIsSuccessModalOpen(true);
      fetchPatients(true);
      setSelectedPasien(null);
      resetLansiaForm();
    } catch (err: any) {
      console.error("Gagal menyimpan pemeriksaan lansia:", err);
      toast.error(err.message || "Gagal menyimpan pemeriksaan lansia");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && pasiens.length === 0) {
    return <PelayananSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHelmet
        title="Pelayanan Posyandu Lansia — SIKALANSIA"
        description="Pencatatan pemeriksaan kesehatan lansia (tensi, gula darah, asam urat, kolesterol)."
      />

      {/* Header Halaman Pelayanan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Pencatatan Pelayanan Lansia
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Lansia
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input data tekanan darah, gula darah sewaktu, kolesterol, asam urat, dan keluhan lansia.
          </p>
        </div>

        <button
          onClick={() => setShowAddLansiaModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> + Lansia Baru
        </button>
      </div>

      {/* Grid Utama: Panel Antrian (Kiri) & Formulir Pelayanan (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Antrian Pasien Lansia */}
        <div className="lg:col-span-5">
          <PelayananQueue
            pasiens={pasiens}
            filteredPasiens={filteredPasiens}
            selectedPasien={selectedPasien}
            onSelectPasien={handleSelectPasien}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            query={query}
            setQuery={setQuery}
            onAddNew={() => setShowAddLansiaModal(true)}
          />
        </div>

        {/* Panel Formulir Pemeriksaan */}
        <div ref={formRef} className="lg:col-span-7">
          {selectedPasien ? (
            <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-6">
              {/* Header Pasien Terpilih */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    <LansiaIcon className="w-6 h-6" gender={selectedPasien.jenisKelamin} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedPasien.nama}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Lansia
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {selectedPasien.subInfo} • {selectedPasien.detail1}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedPasien.detail2}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPasien(null);
                    resetLansiaForm();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
              </div>

              {isEditingExam && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Anda sedang memperbarui data pemeriksaan yang sudah tersimpan pada periode ini.
                  </span>
                </div>
              )}

              {/* Form Input Pemeriksaan Lansia */}
              <form onSubmit={handleSubmitLansia} className="space-y-5">
                <LansiaExamFields
                  examBB={beratBadanLansia}
                  setExamBB={(v) => {
                    setBeratBadanLansia(v);
                    checkWarnings(v, tensiSistol, gulaDarah);
                  }}
                  examTB={tinggiBadanLansia}
                  setExamTB={setTinggiBadanLansia}
                  examSistol={tensiSistol}
                  setExamSistol={(v) => {
                    setTensiSistol(v);
                    checkWarnings(beratBadanLansia, v, gulaDarah);
                  }}
                  examDiastol={tensiDiastol}
                  setExamDiastol={setTensiDiastol}
                  examGds={gulaDarah}
                  setExamGds={(v) => {
                    setGulaDarah(v);
                    checkWarnings(beratBadanLansia, tensiSistol, v);
                  }}
                  examLp={lingkarPerut}
                  setExamLp={setLingkarPerut}
                  examCholesterol={kolesterol}
                  setExamCholesterol={setKolesterol}
                  examUricAcid={asamUrat}
                  setExamUricAcid={setAsamUrat}
                  examKeluhan={keluhanLansia}
                  setExamKeluhan={setKeluhanLansia}
                  examTindakan={tindakanLansia}
                  setExamTindakan={setTindakanLansia}
                  checkWarnings={checkWarnings}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-saas-muted">Nama Petugas / Kader Pemeriksa</label>
                  <input
                    type="text"
                    placeholder="Nama petugas..."
                    value={petugas}
                    onChange={(e) => setPetugas(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-input text-xs font-semibold focus:outline-none focus:border-saas-primary/50"
                  />
                </div>

                {formWarning && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formWarning}</span>
                  </div>
                )}

                {!isEditingExam && stokList.length > 0 && (
                  <div className="p-3.5 bg-teal-50/50 border border-teal-200/70 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold text-teal-900">
                          Potong Stok Perlakuan Otomatis (-1)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-700">
                        {selectedStokIds.length} dipilih
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-800/80">
                      Stick GDS, Kolesterol, & Asam Urat tercentang otomatis saat nilainya diisi. Pilih juga vitamin/alat yang diberikan:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stokList.map((item) => {
                        const checked = selectedStokIds.includes(item.id);
                        const isAuto = autoMatchedStokIds.includes(item.id);
                        const outOfStock = item.sisa <= 0;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={outOfStock}
                            onClick={() => toggleStokItem(item.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                              outOfStock
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : checked
                                  ? "bg-teal-700 text-white border-teal-700 shadow-2xs cursor-pointer"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-teal-400 cursor-pointer"
                            }`}
                          >
                            <span>{item.namaBarang}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                checked
                                  ? "bg-teal-800 text-teal-100"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {outOfStock ? "Habis" : `Sisa ${item.sisa}`}
                            </span>
                            {isAuto && !outOfStock && (
                              <span
                                className={`text-[9px] uppercase tracking-wider font-bold ${
                                  checked ? "text-amber-200" : "text-teal-600"
                                }`}
                              >
                                Auto
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tombol Simpan */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPasien(null);
                      resetLansiaForm();
                    }}
                    className="px-4 py-2 border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isEditingExam ? "Perbarui Pemeriksaan" : "Simpan Pemeriksaan"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <LansiaIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-extrabold text-base text-slate-900">
                  Pencatatan Pemeriksaan Lansia
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih salah satu lansia dari daftar di panel sebelah kiri atau daftarkan lansia baru untuk memasukkan data tekanan darah, gula darah, dan antropometri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLansiaModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                + Daftarkan Lansia Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Catatan Sesi Pemeriksaan Periode Ini */}
      <SessionLogsTable
        sessionLogs={sessionLogs}
        sessionPage={sessionPage}
        setSessionPage={setSessionPage}
        sessionLimit={sessionLimit}
        setSessionLimit={setSessionLimit}
        onEditLog={handleEditLog}
        onDeleteLog={(log) => setDeletingLog(log)}
        onNavigate={onNavigate}
      />

      {/* Modal Tambah Lansia Baru */}
      <AddLansiaModal
        isOpen={showAddLansiaModal}
        onClose={() => setShowAddLansiaModal(false)}
        posyanduId={posyanduId}
        onSuccess={(newLansia) => {
          setShowAddLansiaModal(false);
          fetchPatients(true);
          const p: Pasien = {
            id: newLansia.id,
            nama: newLansia.nama,
            tipe: "Lansia",
            subInfo: `Usia ${calculateAgeInYears(newLansia.tanggalLahir, new Date())} Tahun`,
            detail1: newLansia.noBpjs || "BPJS -",
            detail2: `RT/RW ${newLansia.rtRw || "-"}, ${newLansia.alamat}`,
            tanggalLahir: newLansia.tanggalLahir,
            jenisKelamin: newLansia.jenisKelamin,
            isCheckedInCurrentPeriod: false,
          };
          handleSelectPasien(p);
        }}
      />

      {/* Modal Konfirmasi Hapus Log Pemeriksaan */}
      {deletingLog && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingLog(null)}
          title="Konfirmasi Hapus Pemeriksaan"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus catatan pemeriksaan untuk{" "}
              <strong className="text-slate-900">{deletingLog.nama}</strong>? Data yang dihapus
              tidak dapat dikembalikan.
            </p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingLog(null)}
                className="px-4 py-2 border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteLogConfirm}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Sukses Simpan */}
      {isSuccessModalOpen && lastSubmittedExam && (
        <Modal
          isOpen={true}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Pemeriksaan Berhasil Dicatat"
        >
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{lastSubmittedExam.nama}</h4>
              <p className="text-xs text-slate-500 mt-1">{lastSubmittedExam.summary}</p>
              <span className="inline-block mt-2 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {lastSubmittedExam.status}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Tutup & Lanjutkan Pelayanan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
