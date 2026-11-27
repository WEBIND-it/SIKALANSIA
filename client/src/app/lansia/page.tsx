"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import LansiaModule from "../../features/lansia/LansiaModule";
import { getModuleRoute } from "../../lib/routes";

function LansiaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id") || undefined;
  const fromMenu = searchParams.get("from") || undefined;

  const getBackLabel = () => {
    if (!fromMenu) return "Kembali ke Daftar Lansia";
    if (fromMenu === "Overview") return "Kembali ke Dashboard";
    if (fromMenu === "Laporan") return "Kembali ke Laporan Rekapan";
    if (fromMenu === "Riwayat") return "Kembali ke Riwayat";
    if (fromMenu === "Pelayanan") return "Kembali ke Pelayanan";
    return `Kembali ke ${fromMenu}`;
  };

  return (
    <AppShell activeMenu="Lansia">
      {({ posyanduId, activePeriode, searchQuery, onNavigate }) => (
        <LansiaModule
          key={`lansia-${selectedId || "list"}`}
          posyanduId={posyanduId}
          activePeriode={activePeriode}
          searchQuery={searchQuery}
          selectedId={selectedId}
          onBack={fromMenu ? () => router.push(getModuleRoute(fromMenu)) : undefined}
          backLabel={getBackLabel()}
          onNavigateToPelayanan={(pasienId) => onNavigate("Pelayanan", pasienId)}
        />
      )}
    </AppShell>
  );
}

export default function LansiaPage() {
  return (
    <Suspense fallback={null}>
      <LansiaContent />
    </Suspense>
  );
}
