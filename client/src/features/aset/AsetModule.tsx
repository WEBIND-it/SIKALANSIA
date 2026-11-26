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
} from 'lucide-react';
import { asetApi, Aset, KondisiAset, AsetSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageHelmet from '@/components/PageHelmet';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

interface AsetModuleProps {
  posyanduId: string;
}

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    foto: '',
    stok: 1,
    kondisi: 'BAIK' as KondisiAset,
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

  const filteredAsets = useMemo(() => {
    return asets.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(search.toLowerCase()));
      const matchKondisi = kondisiFilter === 'semua' || item.kondisi === kondisiFilter;
      return matchSearch && matchKondisi;
    });
  }, [asets, search, kondisiFilter]);

  const openAddModal = () => {
    setEditingAset(null);
    setFormData({
      nama: '',
      foto: '',
      stok: 1,
      kondisi: 'BAIK',
      tanggalMasukBaru: new Date().toISOString().slice(0, 10),
      tanggalMasukSebelumnya: '',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (aset: Aset) => {
    setEditingAset(aset);
    setFormData({
      nama: aset.nama,
      foto: aset.foto || '',
      stok: aset.stok,
      kondisi: aset.kondisi,
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
    if (formData.stok < 0) {
      toast.error('Stok minimal 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAset) {
        const res = await asetApi.update(posyanduId, editingAset.id, {
          nama: formData.nama,
          foto: formData.foto || null,
          stok: Number(formData.stok),
          kondisi: formData.kondisi,
          tanggalMasukBaru: formData.tanggalMasukBaru || null,
          tanggalMasukSebelumnya: formData.tanggalMasukSebelumnya || null,
          catatan: formData.catatan || null,
        });
        if (res.success) {
          toast.success('Data aset berhasil diperbarui');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await asetApi.create(posyanduId, {
          nama: formData.nama,
          foto: formData.foto || null,
          stok: Number(formData.stok),
          kondisi: formData.kondisi,
          tanggalMasukBaru: formData.tanggalMasukBaru || null,
          tanggalMasukSebelumnya: formData.tanggalMasukSebelumnya || null,
          catatan: formData.catatan || null,
        });
        if (res.success) {
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
        toast.success('Aset berhasil dihapus');
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus aset');
    }
  };

  const getKondisiBadge = (kondisi: KondisiAset) => {
    switch (kondisi) {
      case 'BAIK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Baik
          </span>
        );
      case 'RUSAK_RINGAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Rusak Ringan
          </span>
        );
      case 'RUSAK_BERAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rusak Berat
          </span>
        );
    }
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
            <span className="text-2xl font-extrabold text-gray-900">{summary?.totalJenis || 0}</span>
            <span className="text-xs font-semibold text-gray-500">{summary?.totalUnit || 0} Unit Fisik</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Kondisi Baik</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-700">{summary?.totalBaik || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Rusak Ringan</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-700">{summary?.totalRusakRingan || 0}</span>
            <span className="text-xs font-normal text-gray-500 ml-1">unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Rusak Berat</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-700">{summary?.totalRusakBerat || 0}</span>
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
              className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
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
                  <div className="absolute top-3 right-3">{getKondisiBadge(aset.kondisi)}</div>
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
                <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(aset)}
                    className="p-1.5 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(aset.id)}
                    className="p-1.5 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Jumlah Stok Unit <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stok}
                onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kondisi Aset <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as KondisiAset })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900 font-semibold"
              >
                <option value="BAIK">Baik</option>
                <option value="RUSAK_RINGAN">Rusak Ringan</option>
                <option value="RUSAK_BERAT">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              URL Foto Aset (Opsional)
            </label>
            <input
              type="url"
              value={formData.foto}
              onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
              placeholder="https://example.com/foto-timbangan.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none text-gray-900"
            />
            <p className="text-[10px] text-gray-400 mt-1">Masukkan URL gambar online foto peralatan posyandu.</p>
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
