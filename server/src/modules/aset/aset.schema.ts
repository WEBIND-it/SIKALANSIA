import { z } from 'zod';

export const createAsetSchema = z.object({
  nama: z.string().min(1, 'Nama aset wajib diisi'),
  foto: z.string().optional().nullable(),
  stok: z.number().int().min(0, 'Stok minimal 0').default(1),
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT']).default('BAIK'),
  tanggalMasukBaru: z.string().optional().nullable(),
  tanggalMasukSebelumnya: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const updateAsetSchema = createAsetSchema.partial();

export type CreateAsetInput = z.infer<typeof createAsetSchema>;
export type UpdateAsetInput = z.infer<typeof updateAsetSchema>;
