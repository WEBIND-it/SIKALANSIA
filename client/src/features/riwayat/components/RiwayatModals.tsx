"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import Modal from "@/components/Modal";
import { ItemRiwayat } from "@/lib/api";

export interface RiwayatModalsProps {
  isEditModalOpen: boolean;
  setIsEditModalOpen: (val: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (val: boolean) => void;
  selectedLog: ItemRiwayat | null;
  handleEditSubmit: (e: React.FormEvent) => void;
  handleDeleteSubmit: () => void;
  formError: string;
  saving: boolean;

  // Lansia fields
  lDate: string;
  setLDate: (v: string) => void;
  lBB: string;
  setLBB: (v: string) => void;
  lTB: string;
  setLTB: (v: string) => void;
  lSistol: string;
  setLSistol: (v: string) => void;
  lDiastol: string;
  setLDiastol: (v: string) => void;
  lGds: string;
  setLGds: (v: string) => void;
  lLp: string;
  setLLp: (v: string) => void;
  lKol: string;
  setLKol: (v: string) => void;
  lUrat: string;
  setLUrat: (v: string) => void;
  lKeluhan: string;
  setLKeluhan: (v: string) => void;
  lTindakan: string;
  setLTindakan: (v: string) => void;
  lPetugas: string;
  setLPetugas: (v: string) => void;
}

export default function RiwayatModals({
  isEditModalOpen,
  setIsEditModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  selectedLog,
  handleEditSubmit,
  handleDeleteSubmit,
  formError,
  saving,
  lDate,
  setLDate,
  lBB,
  setLBB,
  lTB,
  setLTB,
  lSistol,
  setLSistol,
  lDiastol,
  setLDiastol,
  lGds,
  setLGds,
  lLp,
  setLLp,
  lKol,
  setLKol,
  lUrat,
  setLUrat,
  lKeluhan,
  setLKeluhan,
  lTindakan,
  setLTindakan,
  lPetugas,
  setLPetugas,
}: RiwayatModalsProps) {
  return (
    <>
      {/* MODAL EDIT RECORD PEMERIKSAAN */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Data Pemeriksaan: ${selectedLog?.nama || ""}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Tanggal Periksa</label>
              <input
                type="date"
                required
                value={lDate}
                onChange={(e) => setLDate(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Petugas / Kader</label>
              <input
                type="text"
                placeholder="Nama Kader"
                value={lPetugas}
                onChange={(e) => setLPetugas(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={lBB}
                onChange={(e) => setLBB(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Tinggi Badan (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={lTB}
                onChange={(e) => setLTB(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Sistol (mmHg)</label>
              <input
                type="number"
                min="0"
                required
                value={lSistol}
                onChange={(e) => setLSistol(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Diastol (mmHg)</label>
              <input
                type="number"
                min="0"
                required
                value={lDiastol}
                onChange={(e) => setLDiastol(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">GDS (mg/dL)</label>
              <input
                type="number"
                min="0"
                required
                value={lGds}
                onChange={(e) => setLGds(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Lingkar Perut (cm)</label>
              <input
                type="number"
                min="0"
                required
                value={lLp}
                onChange={(e) => setLLp(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Kolesterol (mg/dL)</label>
              <input
                type="number"
                min="0"
                placeholder="Opsional"
                value={lKol}
                onChange={(e) => setLKol(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Asam Urat (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Opsional"
                value={lUrat}
                onChange={(e) => setLUrat(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Keluhan Saat Ini</label>
              <textarea
                rows={2}
                placeholder="Keluhan lansia..."
                value={lKeluhan}
                onChange={(e) => setLKeluhan(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary resize-none text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-saas-dark">Tindakan / Rujukan</label>
              <textarea
                rows={2}
                placeholder="Rujukan obat / edukasi..."
                value={lTindakan}
                onChange={(e) => setLTindakan(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-saas-primary resize-none text-gray-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100 gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-saas-dark text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-saas-primary hover:bg-teal-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL KONFIRMASI HAPUS RECORD */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Catatan Pemeriksaan"
      >
        <div className="space-y-4">
          <p className="text-xs text-saas-muted leading-relaxed">
            Apakah Anda yakin ingin menghapus data pemeriksaan untuk{" "}
            <strong className="text-saas-dark font-bold">{selectedLog?.nama}</strong> pada tanggal{" "}
            <strong className="text-saas-dark font-bold">{selectedLog?.tanggal}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex justify-end pt-3 border-t border-gray-100 gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-saas-dark text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleDeleteSubmit}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Menghapus..." : "Ya, Hapus Data"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}