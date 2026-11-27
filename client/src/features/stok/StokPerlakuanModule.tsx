'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Plus,
  Search,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Trash2,
  Package,
  Layers,
  ArrowDownRight,
  TrendingDown,
  MoreVertical,
  Eye,
  History,
} from 'lucide-react';
import { stokPerlakuanApi, StokPerlakuan, StokPerlakuanSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageHelmet from '@/components/PageHelmet';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

interface StokPerlakuanModuleProps {
  posyanduId: string;
}

interface StokHistoryEntry {
  id: string;
  itemId: string;
  tanggal: string;
  aktivitas: 'Stok Awal' | 'Penambahan Stok' | 'Pemakaian' | 'Penyesuaian';
  perubahan: number;
  sisaSetelah: number;
  keterangan: string;
}

export default function StokPerlakuanModule({ posyanduId }: StokPerlakuanModuleProps) {
  const { user } = useAuth();
  const isOperator = user?.role === 'OWNER';

  const [items, setItems] = useState<StokPerlakuan[]>([]);
  const [summary, setSummary] = useState<StokPerlakuanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StokPerlakuan | null>(null);
  const [usingItem, setUsingItem] = useState<StokPerlakuan | null>(null);
  const [detailItem, setDetailItem] = useState<StokPerlakuan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, StokHistoryEntry[]>>({});

  useEffect(() => {
    if (!openMenuId) return;
    const handleClose = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  // Form State Master Barang
  const [formData, setFormData] = useState({
    namaBarang: '',
    kategori: 'Vitamin',
    stokTersedia: 0,
    terpakai: 0,
    satuan: 'pcs',
    catatan: '',
  });

  // Form State Penggunaan
  const [useAmount, setUseAmount] = useState<number>(1);
  const [useNotes, setUseNotes] = useState<string>('');

  const fetchData = async () => {
    if (!posyanduId) return;
    setIsLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        stokPerlakuanApi.getAll(posyanduId),
        stokPerlakuanApi.getSummary(posyanduId),
      ]);
      if (listRes.success && listRes.data) {
        setItems(listRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      console.error('Gagal mengambil data stok perlakuan:', err);
      toast.error('Gagal memuat data stok perlakuan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [posyanduId]);

  useEffect(() => {
    if (!posyanduId) return;
    try {
      const saved = localStorage.getItem(`stok_perlakuan_history_${posyanduId}`);
      if (saved) setHistoryMap(JSON.parse(saved));
    } catch {
      // ignore storage errors
    }
  }, [posyanduId]);

  const appendStokHistory = (entry: Omit<StokHistoryEntry, 'id'>) => {
    setHistoryMap((prev) => {
      const current = prev[entry.itemId] || [];
      const nextList = [{ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...current].slice(0, 50);
      const next = { ...prev, [entry.itemId]: nextList };
      try {
        localStorage.setItem(`stok_perlakuan_history_${posyanduId}`, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.kategori) set.add(i.kategori);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(search.toLowerCase()));
      const matchKategori = kategoriFilter === 'semua' || item.kategori === kategoriFilter;
      return matchSearch && matchKategori;
    });
  }, [items, search, kategoriFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      namaBarang: '',
      kategori: 'Vitamin',
      stokTersedia: 100,
      terpakai: 0,
      satuan: 'tablet',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: StokPerlakuan) => {
    setEditingItem(item);
    setFormData({
      namaBarang: item.namaBarang,
      kategori: item.kategori || 'Vitamin',
      stokTersedia: item.stokTersedia,
      terpakai: item.terpakai,
      satuan: item.satuan,
      catatan: item.catatan || '',
    });
    setIsModalOpen(true);
  };

  const openUseModal = (item: StokPerlakuan) => {
    setUsingItem(item);
    setUseAmount(1);
    setUseNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaBarang.trim()) {
      toast.error('Nama barang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await stokPerlakuanApi.update(posyanduId, editingItem.id, {
          namaBarang: formData.namaBarang,
          kategori: formData.kategori,
          stokTersedia: Number(formData.stokTersedia),
          terpakai: Number(formData.terpakai),
          satuan: formData.satuan,
          catatan: formData.catatan || null,
        });
        if (res.success) {
          const deltaTersedia = Number(formData.stokTersedia) - editingItem.stokTersedia;
          const sisaBaru = Math.max(0, Number(formData.stokTersedia) - Number(formData.terpakai));
          appendStokHistory({
            itemId: editingItem.id,
            tanggal: new Date().toISOString(),
            aktivitas: deltaTersedia > 0 ? 'Penambahan Stok' : 'Penyesuaian',
            perubahan: deltaTersedia,
            sisaSetelah: sisaBaru,
            keterangan: formData.catatan?.trim() || 'Pembaruan data stok barang',
          });
          toast.success('Data stok perlakuan berhasil diperbarui');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await stokPerlakuanApi.create(posyanduId, {
          namaBarang: formData.namaBarang,
          kategori: formData.kategori,
          stokTersedia: Number(formData.stokTersedia),
          terpakai: Number(formData.terpakai),
          satuan: formData.satuan,
          catatan: formData.catatan || null,
        });
        if (res.success && res.data) {
          const sisaAwal = Math.max(0, Number(formData.stokTersedia) - Number(formData.terpakai));
          appendStokHistory({
            itemId: res.data.id,
            tanggal: new Date().toISOString(),
            aktivitas: 'Stok Awal',
            perubahan: Number(formData.stokTersedia),
            sisaSetelah: sisaAwal,
            keterangan: formData.catatan?.trim() || 'Pendaftaran item stok baru',
          });
          toast.success('Item stok perlakuan berhasil ditambahkan');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan stok perlakuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingItem) return;
    if (useAmount <= 0) {
      toast.error('Jumlah penggunaan minimal 1');
      return;
    }
    if (useAmount > usingItem.sisa) {
      toast.error(`Jumlah penggunaan (${useAmount}) melebihi sisa stok (${usingItem.sisa})!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await stokPerlakuanApi.recordUsage(posyanduId, usingItem.id, {
        jumlah: Number(useAmount),
        catatan: useNotes || undefined,
      });
      if (res.success) {
        appendStokHistory({
          itemId: usingItem.id,
          tanggal: new Date().toISOString(),
          aktivitas: 'Pemakaian',
          perubahan: -Number(useAmount),
          sisaSetelah: Math.max(0, usingItem.sisa - Number(useAmount)),
          keterangan: useNotes.trim() || 'Pemakaian sesi pelayanan posyandu',
        });
        toast.success(`Berhasil mencatat penggunaan ${useAmount} ${usingItem.satuan} ${usingItem.namaBarang}`);
        setUsingItem(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat penggunaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await stokPerlakuanApi.delete(posyanduId, id);
      if (res.success) {
        toast.success('Item stok perlakuan berhasil dihapus');
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus item');
    }
  };

  return (
    <div className="space-y-6">
      <PageHelmet
        title="Monitoring Stok Pemberian Perlakuan"
        description="Pantau ketersediaan vitamin, stick tes gula darah, kolesterol, dan asam urat posyandu"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Monitoring Stok Pemberian Perlakuan
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Pencatatan persediaan Vitamin, Stick Gula Darah, Kolesterol, Asam Urat, &amp; Alat Medis
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Stok</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Jenis Barang</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-gray-900">{summary?.totalJenis || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">macam item</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Stok Tersedia</span>
            <Package className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-teal-700">{summary?.totalTersedia || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">total unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Terpakai (Layanan)</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-700">{summary?.totalTerpakai || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">digunakan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Sisa Tersisa</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-700">{summary?.totalSisa || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">tersedia</span>
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
            placeholder="Cari obat, vitamin, stick GDS..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 text-gray-900 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-gray-500">Kategori:</span>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-600"
          >
            <option value="semua">Semua Kategori</option>
            <option value="Vitamin">Vitamin</option>
            <option value="Stick Gula Darah">Stick Gula Darah (GDS)</option>
            <option value="Kolesterol">Kolesterol</option>
            <option value="Asam Urat">Asam Urat</option>
            <option value="Alat Perlakuan">Alat Perlakuan / Swab</option>
            {categories
              .filter((c) => !['Vitamin', 'Stick Gula Darah', 'Kolesterol', 'Asam Urat', 'Alat Perlakuan'].includes(c))
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Tabel Data Stok Pemberian Perlakuan */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/90 text-gray-700 font-bold border-b border-gray-200">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Barang / Perlakuan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Stok Tersedia</th>
                <th className="px-4 py-3 text-right">Terpakai</th>
                <th className="px-4 py-3 text-right">Sisa Stok</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Memuat data stok perlakuan...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Tidak ada item stok yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const sisaPercent = item.stokTersedia > 0 ? (item.sisa / item.stokTersedia) * 100 : 0;
                  const isLow = item.sisa <= 15;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-extrabold text-gray-900 group-hover:text-teal-700 transition-colors block">
                            {item.namaBarang}
                          </span>
                          <span className="text-[10px] text-gray-400">Satuan: {item.satuan}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          {item.kategori || 'Umum'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {item.stokTersedia} <span className="text-[10px] text-gray-400">{item.satuan}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-700">
                        {item.terpakai} <span className="text-[10px] text-gray-400">{item.satuan}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isLow && <AlertCircle className="w-3 h-3" />}
                          {item.sisa} {item.satuan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate" title={item.catatan || '-'}>
                        {item.catatan || '-'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Menu Aksi"
                            aria-label="Menu Aksi"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === item.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-left ${
                                idx >= filteredItems.length - 2 && filteredItems.length > 2
                                  ? 'bottom-full mb-1'
                                  : 'top-full mt-1'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDetailItem(item);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                                <span>Detail &amp; Riwayat</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openUseModal(item);
                                }}
                                disabled={item.sisa <= 0}
                                className="w-full px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Catat Pemakaian</span>
                              </button>

                              {isOperator && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openEditModal(item);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit Data</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteConfirmId(item.id);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Barang</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Penggunaan (Kader & Operator) */}
      {usingItem && (
        <Modal
          isOpen={true}
          onClose={() => setUsingItem(null)}
          title={`Catat Pemakaian: ${usingItem.namaBarang}`}
        >
          <form onSubmit={handleRecordUsage} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900 space-y-1">
              <p>
                <strong>Sisa Stok Saat Ini:</strong> {usingItem.sisa} {usingItem.satuan}
              </p>
              <p className="text-[11px] text-amber-700">
                Catat jumlah vitamin atau stick tes yang digunakan selama sesi posyandu hari ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Jumlah Digunakan ({usingItem.satuan}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={usingItem.sisa}
                required
                value={useAmount}
                onChange={(e) => setUseAmount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Pemakaian (Opsional)</label>
              <input
                type="text"
                value={useNotes}
                onChange={(e) => setUseNotes(e.target.value)}
                placeholder="Misal: Sesi Pelayanan Rutin Posyandu..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-900"
              />
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUsingItem(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Pemakaian'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Tambah / Edit Master Stok (Operator Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Master Stok Perlakuan' : 'Tambah Item Stok Perlakuan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Barang / Perlakuan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.namaBarang}
              onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
              placeholder="Contoh: Vitamin B Kompleks / Stick Gula Darah"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-rose-600 focus:outline-none"
              >
                <option value="Vitamin">Vitamin</option>
                <option value="Stick Gula Darah">Stick Gula Darah</option>
                <option value="Kolesterol">Kolesterol</option>
                <option value="Asam Urat">Asam Urat</option>
                <option value="Alat Perlakuan">Alat Perlakuan / Swab</option>
                <option value="Obat Lainnya">Obat Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Satuan</label>
              <input
                type="text"
                required
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                placeholder="tablet / strip / pcs / botol"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Stok Tersedia (Total Masuk) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stokTersedia}
                onChange={(e) => setFormData({ ...formData, stokTersedia: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Terpakai</label>
              <input
                type="number"
                min="0"
                value={formData.terpakai}
                onChange={(e) => setFormData({ ...formData, terpakai: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-500">Estimasi Sisa Stok:</span>
            <span className="font-extrabold text-gray-900 ml-2">
              {Math.max(0, formData.stokTersedia - formData.terpakai)} {formData.satuan}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Keterangan</label>
            <textarea
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Contoh: Expired date: Desember 2027..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none text-gray-900"
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
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : editingItem ? 'Perbarui Data' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Riwayat Stok Barang */}
      {detailItem && (
        <Modal
          isOpen={true}
          onClose={() => setDetailItem(null)}
          title={`Detail & Riwayat Stok: ${detailItem.namaBarang}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Ringkasan Stok */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-semibold text-gray-500 block">Stok Tersedia</span>
                <strong className="text-base font-black text-gray-900">
                  {detailItem.stokTersedia} {detailItem.satuan}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] font-semibold text-amber-700 block">Terpakai</span>
                <strong className="text-base font-black text-amber-800">
                  {detailItem.terpakai} {detailItem.satuan}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[10px] font-semibold text-emerald-700 block">Sisa Stok</span>
                <strong className="text-base font-black text-emerald-800">
                  {detailItem.sisa} {detailItem.satuan}
                </strong>
              </div>
            </div>

            {/* Metadata & Progress */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-gray-600">
                  Kategori: <strong className="text-gray-900">{detailItem.kategori || 'Umum'}</strong>
                </span>
                <span className="text-gray-600">
                  Diperbarui:{' '}
                  <strong className="text-gray-900">
                    {detailItem.updatedAt
                      ? new Date(detailItem.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </strong>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all"
                  style={{
                    width: `${
                      detailItem.stokTersedia > 0
                        ? Math.min(100, Math.round((detailItem.sisa / detailItem.stokTersedia) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-700">Keterangan:</span>{' '}
                {detailItem.catatan || 'Tidak ada catatan tambahan.'}
              </p>
            </div>

            {/* Riwayat Mutasi Stok */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <History className="w-4 h-4 text-teal-600" />
                <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Riwayat Stok &amp; Pemakaian
                </h5>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                      <th className="px-3 py-2.5">Tanggal</th>
                      <th className="px-3 py-2.5">Aktivitas</th>
                      <th className="px-3 py-2.5 text-right">Perubahan</th>
                      <th className="px-3 py-2.5 text-right">Sisa Stok</th>
                      <th className="px-3 py-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(historyMap[detailItem.id] || []).map((entry) => (
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
                              entry.aktivitas === 'Pemakaian'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            {entry.aktivitas}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-bold ${
                            entry.perubahan < 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {entry.perubahan > 0 ? `+${entry.perubahan}` : entry.perubahan} {detailItem.satuan}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                          {entry.sisaSetelah} {detailItem.satuan}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{entry.keterangan}</td>
                      </tr>
                    ))}

                    {!(historyMap[detailItem.id]?.length) && (
                      <>
                        <tr className="bg-gray-50/40">
                          <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                            {detailItem.createdAt
                              ? new Date(detailItem.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              Stok Terdaftar
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                            +{detailItem.stokTersedia} {detailItem.satuan}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                            {detailItem.stokTersedia} {detailItem.satuan}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">Stok awal tersedia</td>
                        </tr>
                        {detailItem.terpakai > 0 && (
                          <tr className="bg-gray-50/40">
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                              {detailItem.updatedAt
                                ? new Date(detailItem.updatedAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Total Terpakai
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-amber-700">
                              -{detailItem.terpakai} {detailItem.satuan}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                              {detailItem.sisa} {detailItem.satuan}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">Akumulasi pemakaian tercatat</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
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
          title="Konfirmasi Hapus Item Stok"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Apakah Anda yakin ingin menghapus item perlakuan ini? Seluruh riwayat mutasi stok barang ini akan terhapus.
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
