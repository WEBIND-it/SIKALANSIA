import prisma from '../../shared/config/prisma';
import { CreateAsetInput, UpdateAsetInput } from './aset.schema';

export const asetService = {
  async findAllByPosyandu(posyanduId: string, search?: string, kondisi?: string) {
    const where: any = {
      posyanduId,
      ...(kondisi && kondisi !== 'semua' ? { kondisi } : {}),
      ...(search ? { nama: { contains: search, mode: 'insensitive' } } : {}),
    };

    return prisma.aset.findMany({
      where,
      orderBy: { nama: 'asc' },
    });
  },

  async findById(posyanduId: string, id: string) {
    const aset = await prisma.aset.findFirst({
      where: { id, posyanduId },
    });
    if (!aset) {
      throw new Error('Aset tidak ditemukan');
    }
    return aset;
  },

  async create(posyanduId: string, data: CreateAsetInput) {
    return prisma.aset.create({
      data: {
        posyanduId,
        nama: data.nama,
        foto: data.foto || null,
        stok: data.stok ?? 1,
        kondisi: data.kondisi ?? 'BAIK',
        tanggalMasukBaru: data.tanggalMasukBaru ? new Date(data.tanggalMasukBaru) : null,
        tanggalMasukSebelumnya: data.tanggalMasukSebelumnya ? new Date(data.tanggalMasukSebelumnya) : null,
        catatan: data.catatan || null,
      },
    });
  },

  async update(posyanduId: string, id: string, data: UpdateAsetInput) {
    await this.findById(posyanduId, id);

    const updateData: any = { ...data };
    if (data.tanggalMasukBaru !== undefined) {
      updateData.tanggalMasukBaru = data.tanggalMasukBaru ? new Date(data.tanggalMasukBaru) : null;
    }
    if (data.tanggalMasukSebelumnya !== undefined) {
      updateData.tanggalMasukSebelumnya = data.tanggalMasukSebelumnya ? new Date(data.tanggalMasukSebelumnya) : null;
    }

    return prisma.aset.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(posyanduId: string, id: string) {
    await this.findById(posyanduId, id);
    return prisma.aset.delete({
      where: { id },
    });
  },

  async getSummary(posyanduId: string) {
    const asets = await prisma.aset.findMany({
      where: { posyanduId },
      select: { stok: true, kondisi: true },
    });

    const totalJenis = asets.length;
    let totalUnit = 0;
    let totalBaik = 0;
    let totalRusakRingan = 0;
    let totalRusakBerat = 0;

    for (const a of asets) {
      totalUnit += a.stok;
      if (a.kondisi === 'BAIK') totalBaik += a.stok;
      else if (a.kondisi === 'RUSAK_RINGAN') totalRusakRingan += a.stok;
      else if (a.kondisi === 'RUSAK_BERAT') totalRusakBerat += a.stok;
    }

    return {
      totalJenis,
      totalUnit,
      totalBaik,
      totalRusakRingan,
      totalRusakBerat,
    };
  },
};
