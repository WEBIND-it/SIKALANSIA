import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { FontSizeProvider } from "../contexts/FontSizeContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import HelmetClientProvider from "../components/HelmetClientProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SIKALANSIA - Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia",
    template: "%s | SIKALANSIA",
  },
  description:
    "Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia (SIKALANSIA) untuk pencatatan pemeriksaan kesehatan lansia, pemantauan faktor risiko, inventaris aset, stok perlakuan, dan pelaporan posyandu.",
  keywords: [
    "SIKALANSIA",
    "posyandu lansia",
    "sistem informasi posyandu",
    "kesehatan lansia",
    "skrining hipertensi diabetes",
    "posyandu digital",
  ],
  authors: [{ name: "SIKALANSIA" }],
  icons: {
    icon: [{ url: "/logo-sikalansia.webp", type: "image/webp" }],
    shortcut: "/logo-sikalansia.webp",
    apple: "/logo-sikalansia.webp",
  },
  openGraph: {
    title: "SIKALANSIA - Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia",
    description:
      "Digitalisasi pencatatan pelayanan, pemantauan kesehatan lansia, stok perlakuan, dan pelaporan posyandu secara terpadu.",
    type: "website",
    locale: "id_ID",
    siteName: "SIKALANSIA",
    images: [
      {
        url: "/logo-sikalansia.webp",
        alt: "Logo SIKALANSIA",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SIKALANSIA - Sistem Informasi Posyandu Lansia",
    description:
      "Digitalisasi pencatatan pelayanan & pemantauan kesehatan lansia — SIKALANSIA.",
    images: ["/logo-sikalansia.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('posyandu_theme_preference');
                var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-canvas text-saas-dark dark:bg-[#0B0F19] dark:text-slate-100 flex flex-col transition-colors duration-200">
        <HelmetClientProvider>
          <ThemeProvider>
            <FontSizeProvider>
              <AuthProvider>{children}</AuthProvider>
            </FontSizeProvider>
          </ThemeProvider>
        </HelmetClientProvider>
      </body>
    </html>
  );
}
