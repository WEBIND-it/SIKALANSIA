"use client";

import AppShell from "../../components/AppShell";
import StokPerlakuanModule from "../../features/stok/StokPerlakuanModule";

export default function StokPerlakuanPage() {
  return (
    <AppShell activeMenu="Stok Perlakuan">
      {({ posyanduId }) => <StokPerlakuanModule posyanduId={posyanduId} />}
    </AppShell>
  );
}
