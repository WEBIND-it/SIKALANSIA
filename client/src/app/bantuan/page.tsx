"use client";

import AppShell from "../../components/AppShell";
import BantuanModule from "../../features/bantuan/BantuanModule";

export default function BantuanPage() {
  return (
    <AppShell activeMenu="Bantuan">
      {() => <BantuanModule />}
    </AppShell>
  );
}
