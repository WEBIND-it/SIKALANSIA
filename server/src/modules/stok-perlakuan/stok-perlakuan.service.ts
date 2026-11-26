import prisma from '../../shared/config/prisma';
import { CreateStokPerlakuanInput, UpdateStokPerlakuanInput } from './stok-perlakuan.schema';

export const stokPerlakuanService = {
  async findAllByPosyandu(posyanduId: string, search?: string, kategori?: string) {
    const where: any = {
      posyanduId,
      ...(kategori && kategori !== 'semua' ? { kategori } : {}),
      ...(search ? { namaBarang: { contains: search, mode: 'insensitive' } } : {}),
    };

    return prisma.stokPerlakuan.findMany({
      where,
      orderBy: { namaBarang: 'asc' },
    });
  },

  async findById(posyanduId: string, id: string) {
    const item = await prisma.stokPerlakuan.findFirst({
      where: { id, posyanduId },
    });
    if (!item) {
      throw new Error('Data stok perlakuan tidak ditemukan');
    }
    return item;
  },

  async create(posyanduId: string, data: CreateStokPerlakuanInput) {
    const stokTersedia = data.stokTersedia ?? 0;
    const terpakai = data.terpakai ?? 0;
    const sisa = data.sisa !== undefined ? data.sisa : Math.max(0, stokTersedia - terpakai);

    return prisma.stokPerlakuan.create({
      data: {
        posyanduId,
        namaBarang: data.namaBarang,
        stokTersedia,
        terpakai,
        sisa,
        satuan: data.satuan || 'pcs',
        kategori: data.kategori || null,
        catatan: data.catatan || null,
      },
    });
  },

  async update(posyanduId: string, id: string, data: UpdateStokPerlakuanInput) {
    const current = await this.findById(posyanduId, id);

    const stokTersedia = data.stokTersedia !== undefined ? data.stokTersedia : current.stokTersedia;
    const terpakai = data.terpakai !== undefined ? data.terpakai : current.terpakai;
    const sisa = data.sisa !== undefined ? data.sisa : Math.max(0, stokTersedia - terpakai);

    return prisma.stokPerlakuan.update({
      where: { id },
      data: {
        ...(data.namaBarang !== undefined && { namaBarang: data.namaBarang }),
        stokTersedia,
        terpakai,
        sisa,
        ...(data.satuan !== undefined && { satuan: data.satuan }),
        ...(data.kategori !== undefined && { kategori: data.kategori }),
        ...(data.catatan !== undefined && { catatan: data.catatan }),
      },
    });
  },

  async recordUsage(posyanduId: string, id: string, jumlah: number, _catatan?: string | null) {
    const current = await this.findById(posyanduId, id);
    const newTerpakai = current.terpakai + jumlah;
    const newSisa = Math.max(0, current.stokTersedia - newTerpakai);

    return prisma.stokPerlakuan.update({
      where: { id },
      data: {
        terpakai: newTerpakai,
        sisa: newSisa,
      },
    });
  },

  async delete(posyanduId: string, id: string) {
    await this.findById(posyanduId, id);
    return prisma.stokPerlakuan.delete({
      where: { id },
    });
  },

  async getSummary(posyanduId: string) {
    const items = await prisma.stokPerlakuan.findMany({
      where: { posyanduId },
      select: { stokTersedia: true, terpakai: true, sisa: true, kategori: true },
    });

    const totalJenis = items.length;
    let totalTersedia = 0;
    let totalTerpakai = 0;
    let totalSisa = 0;

    for (const item of items) {
      totalTersedia += item.stokTersedia;
      totalTerpakai += item.terpakai;
      totalSisa += item.sisa;
    }

    return {
      totalJenis,
      totalTersedia,
      totalTerpakai,
      totalSisa,
    };
  },
};
