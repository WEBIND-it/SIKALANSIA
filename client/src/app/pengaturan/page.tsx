"use client";

import AppShell from "../../components/AppShell";
import PengaturanModule from "../../features/pengaturan/PengaturanModule";

export default function PengaturanPage() {
  return (
    <AppShell activeMenu="Pengaturan">
      {() => <PengaturanModule />}
    </AppShell>
  );
}
