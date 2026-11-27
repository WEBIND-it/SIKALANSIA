"use client";

import React from "react";
import { Helmet } from "react-helmet-async";

export interface PageHelmetProps {
  title: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
}

export default function PageHelmet({
  title,
  description = "Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia (SIKALANSIA) — Digitalisasi pencatatan pelayanan & pemantauan kesehatan lansia.",
  keywords = "SIKALANSIA, posyandu lansia, kesehatan lansia, hipertensi, diabetes, posyandu digital, monitoring lansia",
  ogType = "website",
  ogImage = "/logo-sikalansia.webp",
}: PageHelmetProps) {
  const fullTitle = title
    ? `${title} | SIKALANSIA`
    : "SIKALANSIA - Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="icon" type="image/webp" href="/logo-sikalansia.webp" />
      <link rel="shortcut icon" type="image/webp" href="/logo-sikalansia.webp" />
      <link rel="apple-touch-icon" href="/logo-sikalansia.webp" />
      <meta name="theme-color" content="#112751" />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:site_name" content="SIKALANSIA" />
      <meta property="og:locale" content="id_ID" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
