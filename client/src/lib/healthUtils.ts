/**
 * Utilitas Perhitungan Kesehatan Khusus Lansia
 */

export function hitungIMT(beratBadan: number, tinggiBadan: number): number {
  const bb = Number(beratBadan);
  const tb = Number(tinggiBadan);
  if (isNaN(bb) || isNaN(tb) || tb <= 0 || bb <= 0) return 0;
  const tbMeter = tb / 100;
  const imt = bb / (tbMeter * tbMeter);
  return isNaN(imt) ? 0 : Number(imt.toFixed(1));
}

export function getKategoriIMTLansia(imt: number): {
  label: 'Kurus' | 'Normal' | 'Kelebihan BB' | 'Obesitas';
  color: string;
} {
  if (imt <= 0) return { label: 'Normal', color: 'text-gray-500' };
  if (imt < 18.5) return { label: 'Kurus', color: 'text-amber-600' };
  if (imt <= 24.9) return { label: 'Normal', color: 'text-emerald-600' };
  if (imt <= 27.0) return { label: 'Kelebihan BB', color: 'text-orange-600' };
  return { label: 'Obesitas', color: 'text-rose-600' };
}
