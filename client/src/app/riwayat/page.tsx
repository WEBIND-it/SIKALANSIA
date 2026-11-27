"use client";

import AppShell from "../../components/AppShell";
import RiwayatModule from "../../features/riwayat/RiwayatModule";

export default function RiwayatPage() {
  return (
    <AppShell activeMenu="Riwayat">
      {({ posyanduId, activePeriode, onNavigate }) => (
        <RiwayatModule
          posyanduId={posyanduId}
          activePeriode={activePeriode}
          onNavigate={onNavigate}
        />
      )}
    </AppShell>
  );
}
