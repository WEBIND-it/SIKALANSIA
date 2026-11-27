"use client";

import AppShell from "../../components/AppShell";
import ManajemenAkunModule from "../../features/pengaturan/ManajemenAkunModule";

export default function ManajemenAkunPage() {
  return (
    <AppShell activeMenu="Manajemen Akun">
      {({ posyanduId }) => <ManajemenAkunModule posyanduId={posyanduId} />}
    </AppShell>
  );
}
