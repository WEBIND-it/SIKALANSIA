"use client";

import React from "react";
import { Helmet } from "react-helmet-async";

export interface PageHelmetProps {
  title: string;
  description?: string;
  keywords?: string;
  ogType?: string;
}

export default function PageHelmet({
  title,
  description = "Digitalisasi Pencatatan Pelayanan & Pemantauan Kesehatan Lansia — SIKALANSIA",
  keywords = "posyandu lansia, kesehatan lansia, hipertensi, diabetes, posyandu digital, SIKALANSIA",
  ogType = "website",
}: PageHelmetProps) {
  const fullTitle = title ? `${title} | SIKALANSIA` : "SIKALANSIA - Sistem Informasi Pengelolaan dan Visualisasi Data Posyandu Lansia Lansia";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
