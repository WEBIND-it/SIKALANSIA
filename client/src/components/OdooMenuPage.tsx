"use client";

import React, { useMemo, useState } from "react";
import {
  SquaresFour,
  ClipboardText,
  ClockCounterClockwise,
  Users,
  Gear,
  Question,
  SignOut,
  FileText,
  Globe,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Package, HeartPulse, Sun, Moon } from "lucide-react";
import LansiaIcon from "./LansiaIcon";

interface MenuAppItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; weight?: any }>;
  gradient: string;
  shadow: string;
  href?: string;
  kaderAllowed?: boolean;
}

const MENU_APPS: MenuAppItem[] = [
  {
    id: "Overview",
    label: "Overview",
    subtitle: "Ringkasan & Grafik",
    icon: SquaresFour,
    gradient: "from-[#0A95E6] to-[#087EC4]",
    shadow: "shadow-sky-500/25",
  },
  {
    id: "Pelayanan",
    label: "Pelayanan",
    subtitle: "Pemeriksaan Lansia",
    icon: ClipboardText,
    gradient: "from-[#489E23] to-[#367A19]",
    shadow: "shadow-emerald-600/25",
    kaderAllowed: true,
  },
  {
    id: "Lansia",
    label: "Data Lansia",
    subtitle: "Sasaran & Profil",
    icon: LansiaIcon,
    gradient: "from-indigo-500 to-indigo-700",
    shadow: "shadow-indigo-500/25",
  },
  {
    id: "Aset",
    label: "Monitoring Aset",
    subtitle: "Inventaris Posyandu",
    icon: Package as any,
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/25",
  },
  {
    id: "Stok Perlakuan",
    label: "Stok Perlakuan",
    subtitle: "Vitamin & Stick Tes",
    icon: HeartPulse as any,
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/25",
  },
  {
    id: "Riwayat",
    label: "Riwayat",
    subtitle: "Catatan Kunjungan",
    icon: ClockCounterClockwise,
    gradient: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-500/25",
  },
  {
    id: "Laporan",
    label: "Laporan",
    subtitle: "Rekap & Cetak PDF",
    icon: FileText,
    gradient: "from-violet-500 to-purple-700",
    shadow: "shadow-violet-500/25",
  },
  {
    id: "Manajemen Akun",
    label: "Manajemen Akun",
    subtitle: "Kelola Kader",
    icon: Users,
    gradient: "from-teal-500 to-emerald-700",
    shadow: "shadow-teal-500/25",
  },
  {
    id: "Pengaturan",
    label: "Pengaturan",
    subtitle: "Preferensi Sistem",
    icon: Gear,
    gradient: "from-slate-600 to-slate-800",
    shadow: "shadow-slate-500/25",
  },
  {
    id: "Bantuan",
    label: "Bantuan",
    subtitle: "Panduan & FAQ",
    icon: Question,
    gradient: "from-sky-500 to-indigo-600",
    shadow: "shadow-sky-500/25",
    kaderAllowed: true,
  },
  {
    id: "Portal Publik",
    label: "Portal Publik",
    subtitle: "Cek Data Warga ↗",
    icon: Globe,
    gradient: "from-[#112751] to-[#1E3A73]",
    shadow: "shadow-blue-900/25",
    href: "/publik",
    kaderAllowed: true,
  },
];

interface OdooMenuPageProps {
  userName: string;
  posyanduName?: string;
  isKader: boolean;
  resolvedTheme: "light" | "dark";
  onToggleTheme: () => void;
  onSelectMenu: (menuName: string) => void;
  onLogout: () => void;
}

export default function OdooMenuPage({
  userName,
  posyanduName,
  isKader,
  resolvedTheme,
  onToggleTheme,
  onSelectMenu,
  onLogout,
}: OdooMenuPageProps) {
  const [query, setQuery] = useState("");

  const visibleApps = useMemo(() => {
    return MENU_APPS.filter((app) => {
      if (isKader && !app.kaderAllowed) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        app.label.toLowerCase().includes(q) ||
        app.subtitle.toLowerCase().includes(q)
      );
    });
  }, [isKader, query]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#112751] via-[#153166] to-[#0A95E6]/90 dark:from-[#0B0F19] dark:via-[#0F172A] dark:to-[#112751] flex flex-col justify-between overflow-y-auto select-none">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo-sikalansia.webp"
            alt="Logo SIKALANSIA"
            className="w-11 h-11 object-contain shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-black text-white text-lg tracking-tight leading-none">
              SIKALANSIA
            </h1>
            <p className="text-[11px] text-white/75 font-semibold truncate mt-1">
              {posyanduName || "Posyandu Lansia"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
            title={resolvedTheme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-white" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white">
            <div className="w-7 h-7 rounded-lg bg-[#0A95E6] text-white font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <span className="text-xs font-semibold max-w-[140px] truncate">
              {userName}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white border border-white/15 text-xs font-semibold transition-colors cursor-pointer"
            title="Keluar"
          >
            <SignOut className="w-4 h-4" weight="bold" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Center Odoo-style App Grid */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pilih Modul Aplikasi
          </h2>
          <p className="text-xs sm:text-sm text-white/75 mt-1.5">
            Selamat datang, <span className="font-semibold text-white">{userName}</span>. Silakan pilih menu halaman yang ingin dibuka.
          </p>

          {/* Quick Search Bar */}
          <div className="relative max-w-sm mx-auto mt-5">
            <MagnifyingGlass className="w-4 h-4 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari menu atau modul..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/60 text-xs font-medium focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-xs"
            />
          </div>
        </div>

        {visibleApps.length === 0 ? (
          <div className="text-center py-12 text-white/70 text-sm">
            Menu &ldquo;{query}&rdquo; tidak ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-7">
            {visibleApps.map((app) => {
              const Icon = app.icon;
              const content = (
                <div className="group flex flex-col items-center text-center cursor-pointer">
                  <div
                    className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br ${app.gradient} shadow-lg ${app.shadow} border border-white/25 flex items-center justify-center transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-105 group-hover:shadow-2xl group-active:scale-95`}
                  >
                    <Icon className="w-9 h-9 sm:w-10 sm:h-10 text-white" weight="bold" />
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-white group-hover:text-sky-200 transition-colors leading-tight">
                    {app.label}
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-[11px] text-white/65 leading-tight">
                    {app.subtitle}
                  </span>
                </div>
              );

              if (app.href) {
                return (
                  <a
                    key={app.id}
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus:outline-none"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onSelectMenu(app.id)}
                  className="focus:outline-none"
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[11px] text-white/60">
        SIKALANSIA © 2026 · Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia
      </footer>
    </div>
  );
}
