import { z } from 'zod';

export const createStokPerlakuanSchema = z.object({
  namaBarang: z.string().min(1, 'Nama barang perlakuan wajib diisi'),
  stokTersedia: z.number().int().min(0, 'Stok tersedia minimal 0').default(0),
  terpakai: z.number().int().min(0, 'Jumlah terpakai minimal 0').default(0),
  sisa: z.number().int().min(0, 'Sisa minimal 0').optional(),
  satuan: z.string().default('pcs'),
  kategori: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const updateStokPerlakuanSchema = createStokPerlakuanSchema.partial();

export const useStokPerlakuanSchema = z.object({
  jumlah: z.number().int().min(1, 'Jumlah penggunaan minimal 1'),
  catatan: z.string().optional().nullable(),
});

export type CreateStokPerlakuanInput = z.infer<typeof createStokPerlakuanSchema>;
export type UpdateStokPerlakuanInput = z.infer<typeof updateStokPerlakuanSchema>;
export type UseStokPerlakuanInput = z.infer<typeof useStokPerlakuanSchema>;
