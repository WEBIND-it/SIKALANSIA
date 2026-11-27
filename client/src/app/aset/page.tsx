"use client";

import AppShell from "../../components/AppShell";
import AsetModule from "../../features/aset/AsetModule";

export default function AsetPage() {
  return (
    <AppShell activeMenu="Aset">
      {({ posyanduId }) => <AsetModule posyanduId={posyanduId} />}
    </AppShell>
  );
}
