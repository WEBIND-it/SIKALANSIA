"use client";

import AppShell from "../../components/AppShell";
import DashboardModule from "../../features/dashboard/DashboardModule";

export default function OverviewPage() {
  return (
    <AppShell activeMenu="Overview">
      {({ posyanduId, activePeriode, searchQuery, onNavigate }) => (
        <DashboardModule
          searchQuery={searchQuery}
          onNavigate={onNavigate}
          posyanduId={posyanduId}
          activePeriode={activePeriode}
        />
      )}
    </AppShell>
  );
}
