"use client";

import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getModuleRoute } from "../lib/routes";
import OdooMenuPage from "../components/OdooMenuPage";
import LoginPage from "./login/page";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const { user, posyanduId, isLoading, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch className="w-8 h-8 text-saas-primary animate-spin" weight="bold" />
          <p className="text-sm text-saas-muted font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user || !posyanduId) {
    return <LoginPage />;
  }

  const isKader = user.role === "KADER";

  return (
    <OdooMenuPage
      userName={user.nama}
      posyanduName={user.posyandu?.nama}
      isKader={isKader}
      resolvedTheme={resolvedTheme}
      onToggleTheme={() => {
        const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        toast.success(nextTheme === "dark" ? "Mode Gelap diaktifkan" : "Mode Terang diaktifkan");
      }}
      onSelectMenu={(menuName) => {
        if (isKader && menuName !== "Pelayanan" && menuName !== "Bantuan") {
          router.push("/pelayanan");
          return;
        }
        router.push(getModuleRoute(menuName));
      }}
      onLogout={logout}
    />
  );
}
