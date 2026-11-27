"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import PelayananModule from "../../features/pelayanan/PelayananModule";

function PelayananContent() {
  const searchParams = useSearchParams();
  const pasienId = searchParams.get("pasienId") || undefined;

  return (
    <AppShell activeMenu="Pelayanan">
      {({ posyanduId, activePeriode, onOpenPeriodeModal, onNavigate }) => (
        <PelayananModule
          posyanduId={posyanduId}
          activePeriode={activePeriode}
          initialPasienId={pasienId}
          onOpenPeriodeModal={onOpenPeriodeModal}
          onNavigate={onNavigate}
        />
      )}
    </AppShell>
  );
}

export default function PelayananPage() {
  return (
    <Suspense fallback={null}>
      <PelayananContent />
    </Suspense>
  );
}
