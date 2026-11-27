export const MODULE_ROUTES: Record<string, string> = {
  Overview: "/overview",
  Pelayanan: "/pelayanan",
  Lansia: "/lansia",
  Aset: "/aset",
  "Stok Perlakuan": "/stok-perlakuan",
  Riwayat: "/riwayat",
  Laporan: "/laporan",
  "Manajemen Akun": "/manajemen-akun",
  Pengaturan: "/pengaturan",
  Bantuan: "/bantuan",
};

export function getModuleRoute(menu: string, patientId?: string, fromMenu?: string): string {
  const normalized = menu.toLowerCase().trim();

  if (normalized === "lansia") {
    const params = new URLSearchParams();
    if (patientId) params.set("id", patientId);
    if (fromMenu && fromMenu !== "Lansia") params.set("from", fromMenu);
    const qs = params.toString();
    return `/lansia${qs ? `?${qs}` : ""}`;
  }

  if (normalized === "pelayanan") {
    return patientId ? `/pelayanan?pasienId=${encodeURIComponent(patientId)}` : "/pelayanan";
  }

  if (normalized === "aset") return "/aset";
  if (normalized === "stok perlakuan" || normalized === "stok") return "/stok-perlakuan";
  if (normalized === "laporan") return "/laporan";
  if (normalized === "riwayat") return "/riwayat";
  if (normalized === "overview" || normalized === "dashboard") return "/overview";
  if (normalized === "pengaturan" || normalized === "settings") return "/pengaturan";
  if (normalized === "manajemen akun" || normalized === "manajemen-akun") return "/manajemen-akun";
  if (normalized === "bantuan" || normalized === "help") return "/bantuan";

  return MODULE_ROUTES[menu] || "/overview";
}
