"use client";

import { useState, useEffect, useMemo } from "react";
import {
  dashboardApi,
  DashboardSummary,
  DistribusiKehadiran,
  lansiaApi,
  AktivitasKunjunganData,
  PeriodePelayanan,
  riwayatApi,
  ItemRiwayat,
} from "../../lib/api";
import { formatTanggalIndonesia } from "../../lib/dateUtils";
import Modal from "../../components/Modal";
import PageHelmet from "../../components/PageHelmet";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { hitungIMT } from "../../lib/healthUtils";
import { useAuth } from "../../contexts/AuthContext";
import { Kunjungan, Pasien } from "./types";
import DashboardKpiGrid from "./components/DashboardKpiGrid";
import DashboardCharts from "./components/DashboardCharts";
import DashboardVisitsTable from "./components/DashboardVisitsTable";
import DashboardExamModal from "./components/DashboardExamModal";
import DashboardActivityModal from "./components/DashboardActivityModal";
import { DashboardSkeleton } from "../../components/Skeleton";
import { clientDataCache } from "../../lib/dataCache";

interface DashboardModuleProps {
  searchQuery: string;
  onNavigate: (menu: string, patientId?: string) => void;
  posyanduId: string;
  activePeriode?: PeriodePelayanan | null;
}

export default function DashboardModule({ searchQuery, onNavigate, posyanduId, activePeriode }: DashboardModuleProps) {
  const { user } = useAuth();

  // ── Periode Filter State ────────────────────────────────────
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState<number>(() => {
    return activePeriode?.bulan ?? (now.getMonth() + 1);
  });
  const [selectedTahun, setSelectedTahun] = useState<number>(() => {
    return activePeriode?.tahun ?? now.getFullYear();
  });

  // Sync saat activePeriode berubah
  useEffect(() => {
    if (activePeriode?.bulan && activePeriode?.tahun) {
      setSelectedBulan(activePeriode.bulan);
      setSelectedTahun(activePeriode.tahun);
    }
  }, [activePeriode]);

  const namaBulanList = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const namaBulanAktif = namaBulanList[selectedBulan - 1] || "";
  const periodeLabelAktif = `${namaBulanAktif} ${selectedTahun}`;

  // ── API state ──────────────────────────────────────────────
  const [summary, setSummary] = useState<DashboardSummary | null>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<DashboardSummary>(`dash_summary_${posyanduId}_${selectedBulan}_${selectedTahun}`);
      if (cached) return cached;
    }
    return null;
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const cached = clientDataCache.get<DashboardSummary>(`dash_summary_${posyanduId}_${selectedBulan}_${selectedTahun}`);
      if (cached) return false;
    }
    return true;
  });
  const [dbPasiens, setDbPasiens] = useState<Pasien[]>([]);
  const [distribusiKehadiran, setDistribusiKehadiran] = useState<DistribusiKehadiran[]>([]);
  const [isDistribusiLoading, setIsDistribusiLoading] = useState(false);

  // ── Aktivitas Kunjungan State ─────────────────────────────
  const [aktivitasData, setAktivitasData] = useState<AktivitasKunjunganData | null>(null);
  const [isAktivitasLoading, setIsAktivitasLoading] = useState(false);
  const [aktivitasTab, setAktivitasTab] = useState<"lansia" | "belum_lansia">("lansia");
  const [aktivitasSearch, setAktivitasSearch] = useState("");

  const fetchAktivitas = () => {
    setIsAktivitasLoading(true);
    dashboardApi
      .getAktivitasKunjungan(posyanduId, { bulan: selectedBulan, tahun: selectedTahun })
      .then((res) => {
        if (res.success && res.data) {
          setAktivitasData(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsAktivitasLoading(false));
  };

  useEffect(() => {
    fetchAktivitas();
  }, [posyanduId, selectedBulan, selectedTahun]);

  // ── Modals State ──
  const [showDetailAktivitas, setShowDetailAktivitas] = useState(false);
  const [showDetailDistribusi, setShowDetailDistribusi] = useState(false);

  const modalDistribusiList = useMemo(() => {
    return (distribusiKehadiran || [])
      .map((row) => {
        const lTotal = row.lansia?.total ?? row.total ?? 0;
        const lHadir = row.lansia?.hadir ?? row.hadir ?? 0;
        const lPersen = lTotal > 0 ? Math.round((lHadir / lTotal) * 100) : 0;
        return {
          rtRw: row.rtRw,
          total: lTotal,
          hadir: lHadir,
          persentase: lPersen,
          label: "Lansia",
        };
      })
      .sort((a, b) => {
        if (a.total > 0 && b.total === 0) return -1;
        if (a.total === 0 && b.total > 0) return 1;
        return b.persentase - a.persentase;
      });
  }, [distribusiKehadiran]);

  const handleDetailAktivitas = (tab?: "lansia" | "belum_lansia") => {
    if (tab) setAktivitasTab(tab);
    setShowDetailAktivitas(true);
  };

  const fetchSummary = () => {
    const dashCacheKey = `dash_summary_${posyanduId}_${selectedBulan}_${selectedTahun}`;
    const cached = clientDataCache.get<DashboardSummary>(dashCacheKey);
    if (cached) {
      setSummary(cached);
      setIsSummaryLoading(false);
    } else if (!summary) {
      setIsSummaryLoading(true);
    }

    dashboardApi
      .getSummary(posyanduId, { bulan: selectedBulan, tahun: selectedTahun })
      .then((res) => {
        if (res.success) {
          setSummary(res.data);
          clientDataCache.set(dashCacheKey, res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsSummaryLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, [posyanduId, selectedBulan, selectedTahun]);

  // Fetch Lansia Patients List
  useEffect(() => {
    const targetMonth = selectedBulan;
    const targetYear = selectedTahun;

    lansiaApi.getAll(posyanduId)
      .then((lansiaRes) => {
        const lansias: Pasien[] = (lansiaRes.data || []).map((l) => {
          const currentExam = (l.pemeriksaans || []).find((exam) => {
            const d = new Date(exam.tanggalPeriksa);
            return (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
          });

          return {
            id: l.id,
            nama: l.nama,
            tipe: "Lansia",
            detailInfo: `RT/RW ${l.rtRw || "-"}`,
            tanggalLahir: l.tanggalLahir,
            jenisKelamin: l.jenisKelamin,
            currentPeriodExam: currentExam,
          };
        });

        setDbPasiens(lansias);
      })
      .catch(console.error);
  }, [posyanduId, selectedBulan, selectedTahun]);

  // Fetch Distribusi Kehadiran RT/RW
  useEffect(() => {
    setIsDistribusiLoading(true);
    dashboardApi
      .getDistribusiKehadiran(posyanduId, { bulan: selectedBulan, tahun: selectedTahun })
      .then((res) => {
        if (res.success && res.data) {
          setDistribusiKehadiran(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsDistribusiLoading(false));
  }, [posyanduId, selectedBulan, selectedTahun]);

  // ── Riwayat Pelayanan Periode Aktif (untuk KPI Perlu Tindak Lanjut & Follow-Up) ──
  const [riwayatLogs, setRiwayatLogs] = useState<ItemRiwayat[]>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const targetM = String(selectedBulan).padStart(2, "0");
      const targetY = String(selectedTahun);
      const cacheKey = `laporan_logs_${posyanduId}_${targetM}_${targetY}`;
      const cached = clientDataCache.get<ItemRiwayat[]>(cacheKey);
      if (cached) return cached;
    }
    return [];
  });
  const [isRiwayatLoading, setIsRiwayatLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && posyanduId) {
      const targetM = String(selectedBulan).padStart(2, "0");
      const targetY = String(selectedTahun);
      const cacheKey = `laporan_logs_${posyanduId}_${targetM}_${targetY}`;
      const cached = clientDataCache.get<ItemRiwayat[]>(cacheKey);
      if (cached && cached.length > 0) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!posyanduId) return;
    const targetM = String(selectedBulan).padStart(2, "0");
    const targetY = String(selectedTahun);
    const cacheKey = `laporan_logs_${posyanduId}_${targetM}_${targetY}`;
    const cached = clientDataCache.get<ItemRiwayat[]>(cacheKey);

    if (cached) {
      setRiwayatLogs(cached);
      setIsRiwayatLoading(false);
    } else {
      setIsRiwayatLoading(true);
    }

    riwayatApi
      .getAll(posyanduId, { tipe: "lansia", bulan: targetM, tahun: targetY })
      .then((res) => {
        if (res.success && res.data) {
          setRiwayatLogs(res.data);
          clientDataCache.set(cacheKey, res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsRiwayatLoading(false));
  }, [posyanduId, selectedBulan, selectedTahun]);

  const { perluFollowUpLansia } = useMemo(() => {
    const lansiaLogs = riwayatLogs.filter((l) => l.tipe === "Lansia");
    const lansiaAttentionMap = new Set<string>();

    lansiaLogs.forEach((log) => {
      const sistol = Number(log.tekananDarahSistol || 0);
      const diastol = Number(log.tekananDarahDiastol || 0);
      const gds = Number(log.gulaDarahSewaktu || 0);
      const kol = Number(log.kolesterol || 0);
      const au = Number(log.asamUrat || 0);
      const lp = Number(log.lingkarPerut || 0);
      const jk = (log.jenisKelamin || "").toUpperCase().startsWith("P") ? "P" : "L";

      const isHt = sistol >= 140 || diastol >= 90;
      const isGds = gds >= 140;
      const isKolTinggi = kol >= 200;
      const isAuTinggi = au > (jk === "P" ? 6.0 : 7.0);
      const isObesitasSentral = lp > (jk === "P" ? 80 : 90);

      if (isHt || isGds || isKolTinggi || isAuTinggi || isObesitasSentral) {
        lansiaAttentionMap.add(log.pasienId || log.nik || log.nama);
      }
    });

    return {
      perluFollowUpLansia: lansiaAttentionMap.size,
    };
  }, [riwayatLogs]);

  // Daftar Pasien yang Perlu Prioritas Tindak Lanjut Hari Ini
  const priorityItems = useMemo(() => {
    const list: Array<{
      id: string;
      nama: string;
      tipe: "Lansia";
      subText: string;
      alasan: string;
      tingkat: "bahaya" | "waspada";
    }> = [];

    const lansiaLogs = riwayatLogs.filter((l) => l.tipe === "Lansia");

    lansiaLogs.forEach((l) => {
      const sistol = Number(l.tekananDarahSistol || 0);
      const diastol = Number(l.tekananDarahDiastol || 0);
      const gds = Number(l.gulaDarahSewaktu || 0);
      const kol = Number(l.kolesterol || 0);

      let alasan = "";
      let tingkat: "bahaya" | "waspada" = "waspada";

      if (sistol >= 160 || diastol >= 100) {
        alasan = `Hipertensi Derajat 2 (${sistol}/${diastol} mmHg)`;
        tingkat = "bahaya";
      } else if (sistol >= 140 || diastol >= 90) {
        alasan = `Hipertensi Derajat 1 (${sistol}/${diastol} mmHg)`;
        tingkat = "waspada";
      } else if (gds >= 200) {
        alasan = `Gula Darah Tinggi (${gds} mg/dL)`;
        tingkat = "bahaya";
      } else if (gds >= 140) {
        alasan = `Gula Darah Waspada (${gds} mg/dL)`;
        tingkat = "waspada";
      } else if (kol >= 240) {
        alasan = `Kolesterol Tinggi (${kol} mg/dL)`;
        tingkat = "bahaya";
      }

      if (alasan && !list.some((item) => item.nama === l.nama)) {
        list.push({
          id: l.pasienId || l.id,
          nama: l.nama,
          tipe: "Lansia",
          subText: l.nik ? `NIK: ${l.nik}` : (l.rtRw ? `RT/RW ${l.rtRw}` : "-"),
          alasan,
          tingkat,
        });
      }
    });

    return list.slice(0, 5);
  }, [riwayatLogs]);

  const targetMonth = activePeriode ? activePeriode.bulan : (new Date().getUTCMonth() + 1);
  const targetYear = activePeriode ? activePeriode.tahun : new Date().getUTCFullYear();

  const isMatchingPeriod = (tanggalStr?: string) => {
    if (!tanggalStr) return true;
    const d = new Date(tanggalStr);
    return (d.getUTCMonth() + 1) === targetMonth && d.getUTCFullYear() === targetYear;
  };

  const formatJamDanTanggal = (tanggalStr?: string, createdAtStr?: string) => {
    const raw = createdAtStr || tanggalStr;
    if (!raw) return "-";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "-";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const jamStr = `${hours}:${minutes} WIB`;
    const tglStr = formatTanggalIndonesia(tanggalStr || raw);
    return `${jamStr} • ${tglStr}`;
  };

  const filteredLansiaTerbaru = (summary?.pemeriksaanTerbaru.lansia ?? []).filter((p) => isMatchingPeriod(p.tanggalPeriksa));

  // Build kunjungan list from API data
  const apiKunjungans: Kunjungan[] = [
    ...filteredLansiaTerbaru.map((p, i) => ({
      id: `l-${p.id ?? i}`,
      nama: p.lansia.nama,
      tipe: "Lansia" as const,
      detail: `${p.tekananDarahSistol}/${p.tekananDarahDiastol} mmHg`,
      status: "Selesai Periksa",
      statusType: "success" as const,
      waktu: formatJamDanTanggal(p.tanggalPeriksa, p.createdAt),
    })),
  ];

  const kunjungans = apiKunjungans;

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);

  // Form Fields - Lansia
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [examBB, setExamBB] = useState("");
  const [examTB, setExamTB] = useState("");
  const [examSistol, setExamSistol] = useState("");
  const [examDiastol, setExamDiastol] = useState("");
  const [examGds, setExamGds] = useState("");
  const [examLp, setExamLp] = useState("");
  const [examCholesterol, setExamCholesterol] = useState("");
  const [examUricAcid, setExamUricAcid] = useState("");
  const [examKeluhan, setExamKeluhan] = useState("");
  const [examTindakan, setExamTindakan] = useState("");

  // Pre-fill form modal jika pasien sudah memiliki data di periode ini
  useEffect(() => {
    if (!selectedPasien) {
      setExamBB("");
      setExamTB("");
      setExamSistol("");
      setExamDiastol("");
      setExamGds("");
      setExamLp("");
      setExamCholesterol("");
      setExamUricAcid("");
      setExamKeluhan("");
      setExamTindakan("");
      return;
    }

    const exam = selectedPasien.currentPeriodExam;
    if (exam) {
      if (exam.tanggalPeriksa) {
        setExamDate(new Date(exam.tanggalPeriksa).toISOString().slice(0, 10));
      }
      setExamBB(exam.beratBadan ? String(exam.beratBadan) : "");
      setExamTB(exam.tinggiBadan ? String(exam.tinggiBadan) : "");
      setExamSistol(exam.tekananDarahSistol ? String(exam.tekananDarahSistol) : "");
      setExamDiastol(exam.tekananDarahDiastol ? String(exam.tekananDarahDiastol) : "");
      setExamGds(exam.gulaDarahSewaktu ? String(exam.gulaDarahSewaktu) : "");
      setExamLp(exam.lingkarPerut ? String(exam.lingkarPerut) : "");
      setExamCholesterol(exam.kolesterol ? String(exam.kolesterol) : "");
      setExamUricAcid(exam.asamUrat ? String(exam.asamUrat) : "");
      setExamKeluhan(exam.keluhan || "");
      setExamTindakan(exam.tindakan || "");
    } else {
      setExamBB("");
      setExamTB("");
      setExamSistol("");
      setExamDiastol("");
      setExamGds("");
      setExamLp("");
      setExamCholesterol("");
      setExamUricAcid("");
      setExamKeluhan("");
      setExamTindakan("");
    }
  }, [selectedPasien]);

  // Warning & Success State
  const [modalError, setModalError] = useState("");
  const [modalWarning, setModalWarning] = useState("");

  // Filter Kunjungan
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const filteredKunjungan = kunjungans.filter((k) => {
    return k.nama.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredKunjungan.length / itemsPerPage) || 1;
  const paginatedKunjungan = filteredKunjungan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter Pasien in Modal
  const filteredPasiens = dbPasiens.filter((p) =>
    p.nama.toLowerCase().includes(modalSearch.toLowerCase())
  );

  // Warning Check
  const checkWarnings = (bbVal: string, sistolVal: string) => {
    setModalWarning("");
    if (!selectedPasien) return;

    const sistol = parseInt(sistolVal);
    if (sistol > 200) {
      setModalWarning("Tekanan darah sistol >200 mmHg sangat tinggi. Mohon prioritaskan rujukan ke puskesmas.");
    }
  };

  // Submit Quick Exam
  const handleQuickExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!selectedPasien) return;

    const bb = parseFloat(examBB);
    const tb = parseFloat(examTB);

    if (isNaN(bb) || bb <= 0 || isNaN(tb) || tb <= 0) {
      setModalError("Berat Badan dan Tinggi Badan wajib diisi angka positif.");
      return;
    }

    try {
      const sis = parseInt(examSistol);
      const dia = parseInt(examDiastol);
      const gds = parseInt(examGds);
      const lp = parseInt(examLp);

      if (isNaN(sis) || isNaN(dia) || isNaN(gds) || isNaN(lp)) {
        setModalError("Kolom tekanan darah, GDS, dan lingkar perut wajib diisi.");
        return;
      }

      const data = {
        tanggalPeriksa: examDate,
        beratBadan: bb,
        tinggiBadan: tb,
        tekananDarahSistol: sis,
        tekananDarahDiastol: dia,
        gulaDarahSewaktu: gds,
        lingkarPerut: lp,
        kolesterol: examCholesterol ? parseInt(examCholesterol) : undefined,
        asamUrat: examUricAcid ? parseFloat(examUricAcid) : undefined,
        keluhan: examKeluhan || undefined,
        tindakan: examTindakan || undefined,
        petugas: user?.nama || "Kader Posyandu",
      };
      await lansiaApi.createPemeriksaan(posyanduId, selectedPasien.id, data);

      toast.success(`Pemeriksaan untuk ${selectedPasien.nama} berhasil dicatat.`);
      fetchSummary();
      fetchAktivitas();

      // Close & Reset
      setIsOpenModal(false);
      setSelectedPasien(null);
      setModalSearch("");
      setExamBB("");
      setExamTB("");
      setExamSistol("");
      setExamDiastol("");
      setExamGds("");
      setExamLp("");
      setExamCholesterol("");
      setExamUricAcid("");
      setExamKeluhan("");
      setExamTindakan("");
      setModalWarning("");
    } catch (err: any) {
      const msg = err.message || "Gagal menyimpan pemeriksaan.";
      setModalError(msg);
      toast.error(msg);
    }
  };

  if (isSummaryLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHelmet
        title="Dashboard Posyandu Lansia"
        description="Ringkasan pemantauan kesehatan lansia, skrining penyakit tidak menular, dan partisipasi posyandu."
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-hairline pb-4 sm:pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal">
            Pemantauan status kesehatan lansia dan skrining penyakit tidak menular Posyandu Lansia untuk bulan <strong>{namaBulanAktif} {selectedTahun}</strong>.
          </p>
        </div>

        {/* Periode / Month Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-2xs">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
            >
              {namaBulanList.map((m, idx) => (
                <option key={idx + 1} value={idx + 1} className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-l border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y} className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              const curDate = new Date();
              setSelectedBulan(curDate.getMonth() + 1);
              setSelectedTahun(curDate.getFullYear());
            }}
            className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Kembali ke bulan ini"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* 1. 4 Summary KPI Cards Grid */}
      <DashboardKpiGrid
        onNavigate={onNavigate}
        isSummaryLoading={isSummaryLoading}
        isRiwayatLoading={isRiwayatLoading}
        summary={summary}
        perluFollowUpLansia={perluFollowUpLansia}
      />

      {/* 2. Blok Prioritas Hari Ini (Jika ada temuan klinis) */}
      {priorityItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Prioritas Hari Ini — Tindak Lanjut Temuan Klinis
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                {priorityItems.length} Perlu Pemantauan
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Daftar lansia yang memerlukan edukasi diet, pemantauan tekanan darah, atau rujukan Puskesmas.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {priorityItems.map((item) => (
              <div
                key={`lansia-${item.id}`}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Lansia
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mr-2">
                      {item.nama}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ({item.subText})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md ${
                      item.tingkat === "bahaya"
                        ? "bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.tingkat === "bahaya" ? "bg-red-600" : "bg-amber-600"}`} />
                    {item.alasan}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate("Lansia", item.id)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 hover:underline shrink-0 cursor-pointer ml-auto sm:ml-0"
                  >
                    Buka Data →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Charts */}
      <DashboardCharts
        isAktivitasLoading={isAktivitasLoading}
        aktivitasData={aktivitasData}
        summary={summary}
        onOpenDetailAktivitas={handleDetailAktivitas}
      />

      {/* 3. Table & RT/RW Distribution */}
      <DashboardVisitsTable
        onNavigate={onNavigate}
        paginatedKunjungan={paginatedKunjungan}
        filteredKunjungan={filteredKunjungan}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        isDistribusiLoading={isDistribusiLoading}
        distribusiKehadiran={distribusiKehadiran}
        onOpenDetailDistribusi={() => setShowDetailDistribusi(true)}
      />

      {/* 4. Quick Examination Input Modal */}
      <DashboardExamModal
        isOpen={isOpenModal}
        onClose={() => {
          setIsOpenModal(false);
          setSelectedPasien(null);
          setModalSearch("");
        }}
        selectedPasien={selectedPasien}
        setSelectedPasien={setSelectedPasien}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        filteredPasiens={filteredPasiens}
        handleQuickExamSubmit={handleQuickExamSubmit}
        modalError={modalError}
        setModalError={setModalError}
        modalWarning={modalWarning}
        setModalWarning={setModalWarning}
        examDate={examDate}
        setExamDate={setExamDate}
        examBB={examBB}
        setExamBB={setExamBB}
        examTB={examTB}
        setExamTB={setExamTB}
        examSistol={examSistol}
        setExamSistol={setExamSistol}
        examDiastol={examDiastol}
        setExamDiastol={setExamDiastol}
        examGds={examGds}
        setExamGds={setExamGds}
        examLp={examLp}
        setExamLp={setExamLp}
        examCholesterol={examCholesterol}
        setExamCholesterol={setExamCholesterol}
        examUricAcid={examUricAcid}
        setExamUricAcid={setExamUricAcid}
        examKeluhan={examKeluhan}
        setExamKeluhan={setExamKeluhan}
        examTindakan={examTindakan}
        setExamTindakan={setExamTindakan}
        checkWarnings={checkWarnings}
        hitungIMT={hitungIMT}
      />

      {/* 5. Detail Aktivitas Modal */}
      <DashboardActivityModal
        isOpen={showDetailAktivitas}
        onClose={() => setShowDetailAktivitas(false)}
        aktivitasTab={aktivitasTab}
        setAktivitasTab={setAktivitasTab}
        aktivitasData={aktivitasData}
        aktivitasSearch={aktivitasSearch}
        setAktivitasSearch={setAktivitasSearch}
        onNavigate={onNavigate}
        onQuickInputForPatient={(p) => {
          const targetPasien = dbPasiens.find((dbP) => dbP.id === p.id) || {
            id: p.id,
            nama: p.nama,
            tipe: p.tipe,
            detailInfo: p.detailInfo,
          };
          setSelectedPasien(targetPasien);
          setShowDetailAktivitas(false);
          setIsOpenModal(true);
        }}
        formatTanggalIndonesia={formatTanggalIndonesia}
      />

      {/* Modal Detail Distribusi Kehadiran */}
      <Modal
        isOpen={showDetailDistribusi}
        onClose={() => setShowDetailDistribusi(false)}
        title="Detail Distribusi Kehadiran Lansia per RT/RW"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {modalDistribusiList.length > 0 ? (
            modalDistribusiList.map((item, i) => {
              const persentase = isNaN(Number(item.persentase)) ? 0 : Number(item.persentase);
              return (
                <div key={i} className="border border-gray-200 rounded-lg p-3 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-saas-dark">{item.rtRw}</span>
                    <span className="bg-saas-primary/10 text-saas-primary px-2.5 py-0.5 rounded-md text-xs font-bold">
                      {persentase}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div
                      style={{ width: `${persentase}%` }}
                      className="h-full bg-saas-primary rounded-full"
                    ></div>
                  </div>
                  <div className="text-[11px] text-saas-dark text-right font-semibold">
                    {item.hadir} dari {item.total} Lansia Hadir
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-saas-muted text-center py-4">Belum ada data distribusi kehadiran lansia.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}