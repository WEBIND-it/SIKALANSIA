"use client";

import AppShell from "../../components/AppShell";
import LaporanModule from "../../features/laporan/LaporanModule";

export default function LaporanPage() {
  return (
    <AppShell activeMenu="Laporan">
      {({ posyanduId, activePeriode, onNavigate }) => (
        <LaporanModule
          posyanduId={posyanduId}
          activePeriode={activePeriode}
          onNavigate={onNavigate}
        />
      )}
    </AppShell>
  );
}
