'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Image as ImageIcon,
  Pencil,
  Trash2,
  RefreshCw,
  Box,
  Upload,
  X,
  History,
} from 'lucide-react';
import { asetApi, Aset, KondisiAset, AsetSummary } from '@/lib/api';
import { appendLocalHistory, loadLocalMap, saveLocalMap } from '@/lib/historyStorage';
import { useAuth } from '@/contexts/AuthContext';
import PageHelmet from '@/components/PageHelmet';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

interface AsetModuleProps {
  posyanduId: string;
}

interface AsetHistoryEntry {
  id: string;
  asetId: string;
  tanggal: string;
  aktivitas: 'Aset Masuk' | 'Penambahan Stok' | 'Pengurangan Stok' | 'Pembaruan Data';
  perubahanStok: number;
  stokAkhir: number;
  kondisi: KondisiAset;
  keterangan: string;
}

const compressImageToDataUrl = (file: File, maxDim = 800, quality = 0.78): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webp = canvas.toDataURL('image/webp', quality);
        resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('File gambar tidak valid'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });

export default function AsetModule({ posyanduId }: AsetModuleProps) {
  const { user } = useAuth();
  const isOperator = user?.role === 'OWNER';

  const [asets, setAsets] = useState<Aset[]>([]);
  const [summary, setSummary] = useState<AsetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState<'semua' | KondisiAset>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAset, setEditingAset] = useState<Aset | null>(null);
  const [detailAset, setDetailAset] = useState<Aset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, AsetHistoryEntry[]>>({});
  const [breakdownMap, setBreakdownMap] = useState<
    Record<string, { baik: number; rusakRingan: number; rusakBerat: number }>
  >({});

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    foto: '',
    baik: 1,
    rusakRingan: 0,
    rusakBerat: 0,
    tanggalMasukBaru: '',
    tanggalMasukSebelumnya: '',
    catatan: '',
  });

  const fetchData = async () => {
    if (!posyanduId) return;
    setIsLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        asetApi.getAll(posyanduId),
        asetApi.getSummary(posyanduId),
      ]);
      if (listRes.success && listRes.data) {
        setAsets(listRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      console.error('Gagal mengambil data aset:', err);
      toast.error('Gagal memuat data aset posyandu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [posyanduId]);

  useEffect(() => {
    if (!posyanduId) return;
    setHistoryMap(loadLocalMap<AsetHistoryEntry[]>(`aset_stock_history_${posyanduId}`));
    setBreakdownMap(
      loadLocalMap<{ baik: number; rusakRingan: number; rusakBerat: number }>(
        `aset_kondisi_breakdown_${posyanduId}`
      )
    );
  }, [posyanduId]);

  const getAsetBreakdown = (aset: Aset) => {
    const saved = breakdownMap[aset.id];
    if (saved && saved.baik + saved.rusakRingan + saved.rusakBerat === aset.stok) {
      return saved;
    }
    return {
      baik: aset.kondisi === 'BAIK' ? aset.stok : 0,
      rusakRingan: aset.kondisi === 'RUSAK_RINGAN' ? aset.stok : 0,
      rusakBerat: aset.kondisi === 'RUSAK_BERAT' ? aset.stok : 0,
    };
  };

  const saveAsetBreakdown = (asetId: string, breakdown: { baik: number; rusakRingan: number; rusakBerat: number }) => {
    setBreakdownMap((prev) => {
      const next = { ...prev, [asetId]: breakdown };
      saveLocalMap(`aset_kondisi_breakdown_${posyanduId}`, next);
      return next;
    });
  };

  const appendAsetHistory = (entry: Omit<AsetHistoryEntry, 'id'>) => {
    setHistoryMap((prev) =>
      appendLocalHistory(`aset_stock_history_${posyanduId}`, entry.asetId, entry, prev)
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, atau WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5 MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setFormData((prev) => ({ ...prev, foto: dataUrl }));
      toast.success('Foto aset berhasil dimuat');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses gambar');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const filteredAsets = useMemo(() => {
    return asets.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(search.toLowerCase()));
      if (kondisiFilter === 'semua') return matchSearch;
      const bd = getAsetBreakdown(item);
      const matchKondisi =
        (kondisiFilter === 'BAIK' && bd.baik > 0) ||
        (kondisiFilter === 'RUSAK_RINGAN' && bd.rusakRingan > 0) ||
        (kondisiFilter === 'RUSAK_BERAT' && bd.rusakBerat > 0);
      return matchSearch && matchKondisi;
    });
  }, [asets, search, kondisiFilter, breakdownMap]);

  const computedSummary = useMemo(() => {
    let totalUnit = 0;
    let totalBaik = 0;
    let totalRusakRingan = 0;
    let totalRusakBerat = 0;
    for (const a of asets) {
      const bd = getAsetBreakdown(a);
      totalUnit += a.stok;
      totalBaik += bd.baik;
      totalRusakRingan += bd.rusakRingan;
      totalRusakBerat += bd.rusakBerat;
    }
    return {
      totalJenis: asets.length,
      totalUnit: summary ? totalUnit : 0,
      totalBaik,
      totalRusakRingan,
      totalRusakBerat,
    };
  }, [asets, summary, breakdownMap]);

  const openAddModal = () => {
    setEditingAset(null);
    setFormData({
      nama: '',
      foto: '',
      baik: 1,
      rusakRingan: 0,
      rusakBerat: 0,
      tanggalMasukBaru: new Date().toISOString().slice(0, 10),
      tanggalMasukSebelumnya: '',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (aset: Aset) => {
    const bd = getAsetBreakdown(aset);
    setEditingAset(aset);
    setFormData({
      nama: aset.nama,
      foto: aset.foto || '',
      baik: bd.baik,
      rusakRingan: bd.rusakRingan,
      rusakBerat: bd.rusakBerat,
      tanggalMasukBaru: aset.tanggalMasukBaru ? aset.tanggalMasukBaru.slice(0, 10) : '',
      tanggalMasukSebelumnya: aset.tanggalMasukSebelumnya ? aset.tanggalMasukSebelumnya.slice(0, 10) : '',
      catatan: aset.catatan || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error('Nama aset wajib diisi');
      return;
    }
    const totalStok = Number(formData.baik) + Number(formData.rusakRingan) + Number(formData.rusakBerat);
    if (totalStok < 0) {
      toast.error('Stok minimal 0');
      return;
    }

    const derivedKondisi: KondisiAset =
      formData.baik > 0
        ? 'BAIK'
        : formData.rusakRingan > 0
        ? 'RUSAK_RINGAN'
        : formData.rusakBerat > 0
        ? 'RUSAK_BERAT'
        : 'BAIK';

    const breakdownPayload = {
      baik: Math.max(0, Number(formData.baik) || 0),
      rusakRingan: Math.max(0, Number(formData.rusakRingan) || 0),
      rusakBerat: Math.max(0, Number(formData.rusakBerat) || 0),
    };

    setIsSubmitting(true);
    try {
      if (editingAset) {
        const res = await asetApi.update(posyanduId, editingAset.id, {
          nama: formData.nama,
          foto: formData.foto || null,
          stok: totalStok,
          kondisi: derivedKondisi,
          tanggalMasukBaru: formData.tanggalMasukBaru || null,
          tanggalMasukSebelumnya: formData.tanggalMasukSebelumnya || null,
          catatan: formData.catatan || null,
        });
        if (res.success) {
          saveAsetBreakdown(editingAset.id, breakdownPayload);
          const delta = totalStok - editingAset.stok;
          appendAsetHistory({
            asetId: editingAset.id,
            tanggal: new Date().toISOString(),
            aktivitas:
              delta > 0 ? 'Penambahan Stok' : delta < 0 ? 'Pengurangan Stok' : 'Pembaruan Data',
            perubahanStok: delta,
            stokAkhir: totalStok,
            kondisi: derivedKondisi,
            keterangan:
              formData.catatan?.trim() ||
              `Baik: ${breakdownPayload.baik}, Rusak Ringan: ${breakdownPayload.rusakRingan}, Rusak Berat: ${breakdownPayload.rusakBerat}`,
          });
          toast.success('Data aset berhasil diperbarui');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await asetApi.create(posyanduId, {
          nama: formData.nama,
          foto: formData.foto || null,
          stok: totalStok,
          kondisi: derivedKondisi,
          tanggalMasukBaru: formData.tanggalMasukBaru || null,
          tanggalMasukSebelumnya: formData.tanggalMasukSebelumnya || null,
          catatan: formData.catatan || null,
        });
        if (res.success && res.data) {
          saveAsetBreakdown(res.data.id, breakdownPayload);
          appendAsetHistory({
            asetId: res.data.id,
            tanggal: formData.tanggalMasukBaru ? new Date(formData.tanggalMasukBaru).toISOString() : new Date().toISOString(),
            aktivitas: 'Aset Masuk',
            perubahanStok: totalStok,
            stokAkhir: totalStok,
            kondisi: derivedKondisi,
            keterangan:
              formData.catatan?.trim() ||
              `Baik: ${breakdownPayload.baik}, Rusak Ringan: ${breakdownPayload.rusakRingan}, Rusak Berat: ${breakdownPayload.rusakBerat}`,
          });
          toast.success('Aset baru berhasil ditambahkan');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      console.error('Gagal menyimpan aset:', err);
      toast.error(err.message || 'Gagal menyimpan aset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await asetApi.delete(posyanduId, id);
      if (res.success) {
        setBreakdownMap((prev) => {
          const next = { ...prev };
          delete next[id];
          saveLocalMap(`aset_kondisi_breakdown_${posyanduId}`, next);
          return next;
        });
        setHistoryMap((prev) => {
          const next = { ...prev };
          delete next[id];
          saveLocalMap(`aset_stock_history_${posyanduId}`, next);
          return next;
        });
        toast.success('Aset berhasil dihapus');
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus aset');
    }
  };

  const renderKondisiBadges = (aset: Aset) => {
    const bd = getAsetBreakdown(aset);
    if (aset.stok === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
          0 Unit
        </span>
      );
    }
    return (
      <div className="flex flex-wrap justify-end gap-1">
        {bd.baik > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle className="w-3 h-3" /> {bd.baik} Baik
          </span>
        )}
        {bd.rusakRingan > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3" /> {bd.rusakRingan} Rusak Ringan
          </span>
        )}
        {bd.rusakBerat > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle className="w-3 h-3" /> {bd.rusakBerat} Rusak Berat
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHelmet title="Monitoring Aset Posyandu" description="Kelola dan pantau kondisi aset alat kesehatan posyandu lansia" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Monitoring Aset Posyandu</h2>
              <p className="text-xs text-gray-500 font-medium">
                Pencatatan inventaris alat kesehatan seperti timbangan, tensimeter, dan meja layanan
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOperator && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aset</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Jenis Aset</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900">{computedSummary.totalJenis}</span>
            <span className="text-xs font-semibold text-gray-500">{computedSummary.totalUnit} Unit Fisik</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Kondisi Baik</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-700">{computedSummary.totalBaik}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Rusak Ringan</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-700">{computedSummary.totalRusakRingan}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Rusak Berat</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-700">{computedSummary.totalRusakBerat}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">unit</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aset (timbangan, tensi, meja)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-900 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-gray-500">Filter Kondisi:</span>
          <select
            value={kondisiFilter}
            onChange={(e) => setKondisiFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="semua">Semua Kondisi</option>
            <option value="BAIK">Kondisi Baik</option>
            <option value="RUSAK_RINGAN">Rusak Ringan</option>
            <option value="RUSAK_BERAT">Rusak Berat</option>
          </select>
        </div>
      </div>

      {/* Aset Grid / Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-200 p-4 h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredAsets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Box className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Belum ada aset terdaftar</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search || kondisiFilter !== 'semua'
              ? 'Tidak ditemukan aset yang cocok dengan filter pencarian.'
              : 'Tambahkan data aset seperti timbangan, tensimeter, dan meja untuk memantau inventaris posyandu.'}
          </p>
          {isOperator && !search && kondisiFilter === 'semua' && (
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Aset Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAsets.map((aset) => (
            <div
              key={aset.id}
              onClick={() => setDetailAset(aset)}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Image Preview / Placeholder */}
                <div className="h-44 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {aset.foto ? (
                    <img
                      src={aset.foto}
                      alt={aset.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon className="w-10 h-10 stroke-1 mb-1" />
                      <span className="text-[10px] font-medium">Foto Belum Diunggah</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 left-3 flex justify-end">{renderKondisiBadges(aset)}</div>
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    Stok: {aset.stok} Unit
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{aset.nama}</h3>
                    {aset.catatan && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{aset.catatan}</p>
                    )}
                  </div>

                  {/* Dates Information (Task.md: Tanggal masuk stok baru dan sebelumnya) */}
                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> Stok Baru Masuk:
                      </span>
                      <strong className="text-gray-900 font-semibold">
                        {aset.tanggalMasukBaru ? new Date(aset.tanggalMasukBaru).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> Masuk Sebelumnya:
                      </span>
                      <span className="text-gray-700">
                        {aset.tanggalMasukSebelumnya ? new Date(aset.tanggalMasukSebelumnya).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {isOperator && (
                <div
                  className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEditModal(aset)}
                    className="p-1.5 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(aset.id)}
                    className="p-1.5 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Aset */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAset ? 'Edit Data Aset' : 'Tambah Aset Posyandu Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Aset <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Timbangan Badan Digital Camry"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Rincian Kondisi Unit <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-teal-700">
                Total: {Number(formData.baik) + Number(formData.rusakRingan) + Number(formData.rusakBerat)} Unit
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 mb-1">Baik</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.baik}
                  onChange={(e) => setFormData({ ...formData, baik: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-900 bg-emerald-50/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">Rusak Ringan</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.rusakRingan}
                  onChange={(e) => setFormData({ ...formData, rusakRingan: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-900 bg-amber-50/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-rose-700 mb-1">Rusak Berat</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.rusakBerat}
                  onChange={(e) => setFormData({ ...formData, rusakBerat: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-rose-50/40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Upload Foto Aset (Opsional)
            </label>
            {formData.foto ? (
              <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={formData.foto}
                  alt="Preview Foto Aset"
                  className="w-full h-40 object-cover"
                />
                <div className="p-2.5 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, foto: '' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Hapus Foto
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-xl bg-gray-50/70 hover:bg-teal-50/30 cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
                <span className="text-xs font-semibold text-gray-700">
                  {isUploadingImage ? 'Memproses gambar...' : 'Klik untuk pilih gambar aset'}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  Format JPG, PNG, atau WebP (maks. 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Masuk Stok Baru
              </label>
              <input
                type="date"
                value={formData.tanggalMasukBaru}
                onChange={(e) => setFormData({ ...formData, tanggalMasukBaru: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Masuk Sebelumnya
              </label>
              <input
                type="date"
                value={formData.tanggalMasukSebelumnya}
                onChange={(e) => setFormData({ ...formData, tanggalMasukSebelumnya: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Catatan / Lokasi Penempatan
            </label>
            <textarea
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Misal: Ditaruh di Meja 2 Layanan Penimbangan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : editingAset ? 'Perbarui Aset' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Riwayat Stok Aset */}
      {detailAset && (
        <Modal
          isOpen={true}
          onClose={() => setDetailAset(null)}
          title={`Detail & Riwayat Aset: ${detailAset.nama}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header Info + Foto */}
            <div className="flex flex-col sm:flex-row gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200/80">
              <div className="w-full sm:w-40 h-32 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {detailAset.foto ? (
                  <img src={detailAset.foto} alt={detailAset.nama} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageIcon className="w-8 h-8 stroke-1 mb-1" />
                    <span className="text-[10px]">Tidak ada foto</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-gray-900">{detailAset.nama}</h4>
                  {renderKondisiBadges(detailAset)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200/80">
                    <span className="text-[10px] text-gray-500 block">Jumlah Stok Saat Ini</span>
                    <strong className="text-sm font-black text-gray-900">{detailAset.stok} Unit</strong>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200/80">
                    <span className="text-[10px] text-gray-500 block">Stok Baru Masuk</span>
                    <strong className="text-xs font-bold text-gray-900">
                      {detailAset.tanggalMasukBaru
                        ? new Date(detailAset.tanggalMasukBaru).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </strong>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Catatan / Lokasi:</span>{' '}
                  {detailAset.catatan || 'Belum ada catatan lokasi penempatan.'}
                </p>
              </div>
            </div>

            {/* Riwayat Stok Aset */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <History className="w-4 h-4 text-teal-600" />
                <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Riwayat Stok &amp; Pembaruan
                </h5>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                      <th className="px-3 py-2.5">Tanggal</th>
                      <th className="px-3 py-2.5">Aktivitas</th>
                      <th className="px-3 py-2.5 text-right">Perubahan</th>
                      <th className="px-3 py-2.5 text-right">Stok Akhir</th>
                      <th className="px-3 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(historyMap[detailAset.id] || []).map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/70">
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {new Date(entry.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              entry.aktivitas === 'Pengurangan Stok'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            {entry.aktivitas}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold">
                          {entry.perubahanStok > 0
                            ? `+${entry.perubahanStok}`
                            : entry.perubahanStok === 0
                            ? '0'
                            : entry.perubahanStok}{' '}
                          Unit
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                          {entry.stokAkhir} Unit
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{entry.keterangan}</td>
                      </tr>
                    ))}

                    {detailAset.tanggalMasukBaru && (
                      <tr className="bg-gray-50/40">
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {new Date(detailAset.tanggalMasukBaru).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Stok Baru Masuk
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500">-</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                          {detailAset.stok} Unit
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">Tanggal masuk stok terbaru tercatat</td>
                      </tr>
                    )}

                    {detailAset.tanggalMasukSebelumnya && (
                      <tr className="bg-gray-50/40">
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {new Date(detailAset.tanggalMasukSebelumnya).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            Masuk Sebelumnya
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500">-</td>
                        <td className="px-3 py-2.5 text-right text-gray-500">-</td>
                        <td className="px-3 py-2.5 text-gray-600">Riwayat penerimaan aset sebelumnya</td>
                      </tr>
                    )}

                    {!(historyMap[detailAset.id]?.length) &&
                      !detailAset.tanggalMasukBaru &&
                      !detailAset.tanggalMasukSebelumnya && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                            Belum ada riwayat perubahan stok yang tercatat.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailAset(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Konfirmasi Hapus Aset"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Apakah Anda yakin ingin menghapus aset ini dari inventaris posyandu? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg"
              >
                Ya, Hapus Aset
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
