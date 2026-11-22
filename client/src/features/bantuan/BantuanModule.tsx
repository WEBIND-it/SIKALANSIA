"use client";

import { useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  PhoneCall,
  ArrowLeft,
  HelpCircle as InfoIcon,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  Calendar,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Activity,
  Droplet,
  Users,
} from "lucide-react";
import PageHelmet from "../../components/PageHelmet";
import LansiaIcon from "../../components/LansiaIcon";
import { useAuth } from "../../contexts/AuthContext";

interface Guide {
  id: string;
  title: string;
  category: "kader" | "owner";
  description: string;
  icon: any;
  steps: {
    title: string;
    text: string;
    badge?: string;
  }[];
}

interface FaqItem {
  id: string;
  category: "Lansia" | "Akun & Keamanan" | "Umum";
  question: string;
  answer: string;
}

export default function BantuanModule() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  // State Tabel Acuan Lansia (Kemenkes RI)
  const [lansiaTab, setLansiaTab] = useState<"tensi" | "gula" | "asam_kolesterol" | "kemandirian">("tensi");

  // State FAQ Accordion
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq1");
  const [faqFilter, setFaqFilter] = useState<"Semua" | "Lansia" | "Akun & Keamanan" | "Umum">("Semua");

  // Kamus Istilah Posyandu Lansia
  const glossary = [
    { istilah: "Hipertensi", arti: "Kondisi tekanan darah tinggi (sistol di atas 140 mmHg atau diastol di atas 90 mmHg). Faktor risiko utama stroke dan penyakit jantung." },
    { istilah: "Sistol & Diastol", arti: "Angka pengukuran tensi darah. Sistol adalah angka atas (tekanan saat jantung memompa), diastol adalah angka bawah (tekanan saat jantung relaksasi)." },
    { istilah: "GDS (Gula Darah Sewaktu)", arti: "Pemeriksaan kadar glukosa darah kapiler sewaktu-waktu tanpa harus berpuasa (angka normal di bawah 140 mg/dL)." },
    { istilah: "Indeks Massa Tubuh (IMT)", arti: "Perbandingan berat badan (kg) dibagi kuadrat tinggi badan (m²). Untuk lansia, IMT normal berada di kisaran 18.5 – 22.9 kg/m²." },
    { istilah: "Obesitas Sentral", arti: "Penumpukan lemak perut yang diukur dari lingkar perut. Batas risiko: > 90 cm untuk laki-laki dan > 80 cm untuk perempuan." },
    { istilah: "Asam Urat", arti: "Produk akhir metabolisme purin. Normal laki-laki: 3.4 – 7.0 mg/dL, perempuan: 2.4 – 6.0 mg/dL. Tingkat tinggi memicu nyeri sendi/artritis gout." },
    { istilah: "Kolesterol Total", arti: "Kadar seluruh lemak dalam darah. Target ideal < 200 mg/dL. Nilai ≥ 200 mg/dL meningkatkan risiko penyumbatan pembuluh darah." },
    { istilah: "Indeks Barthel (AKS)", arti: "Instrumen penilaian fungsional untuk mengukur tingkat kemandirian lansia dalam aktivitas sehari-hari (Mandiri, Sebagian, Total)." },
  ];

  // FAQ List
  const faqList: FaqItem[] = [
    {
      id: "faq1",
      category: "Lansia",
      question: "Kapan lansia harus segera dirujuk ke Puskesmas?",
      answer: "Lansia wajib segera dirujuk apabila tekanan darah sistol ≥ 160 mmHg atau diastol ≥ 100 mmHg, gula darah sewaktu ≥ 200 mg/dL, mengeluh nyeri dada, pusing berputar berat, atau dicurigai mengalami penurunan kesadaran.",
    },
    {
      id: "faq2",
      category: "Lansia",
      question: "Apakah lansia wajib puasa sebelum cek gula darah di Posyandu?",
      answer: "Tidak wajib. Pemeriksaan rutin di Posyandu menggunakan Gula Darah Sewaktu (GDS) sehingga lansia dapat diperiksa kapan saja tanpa puasa.",
    },
    {
      id: "faq3",
      category: "Lansia",
      question: "Bagaimana cara pengukuran tensi darah yang benar?",
      answer: "Lansia sebaiknya beristirahat santai minimal 5 menit dalam posisi duduk tenang, tidak merokok/minum kopi 30 menit sebelumnya, manset sejajar dengan dada/jantung, dan tidak berbicara selama pengukuran berlangsung.",
    },
    {
      id: "faq4",
      category: "Akun & Keamanan",
      question: "Bagaimana cara menambah kader baru pada sistem?",
      answer: "Akun dengan peran Owner dapat membuka menu 'Manajemen Akun' lalu klik 'Buat Akun Kader Baru' untuk memberikan akses kepada kader posyandu.",
    },
    {
      id: "faq5",
      category: "Umum",
      question: "Apakah data hasil pemeriksaan lansia bisa diekspor ke Excel?",
      answer: "Ya. Buka menu 'Laporan', pilih periode pelayanan, lalu klik tombol 'Unduh Excel' untuk mendapatkan berkas rekapitulasi lengkap dalam format spreadsheet (.xlsx).",
    },
  ];

  // Guides
  const guides: Guide[] = [
    {
      id: "g1",
      title: "Mendaftarkan Lansia Baru",
      category: "kader",
      description: "Cara menambahkan warga lanjut usia baru ke dalam database Posyandu.",
      icon: Users,
      steps: [
        { title: "Langkah 1: Masuk Menu Lansia", text: "Buka menu 'Lansia' di bilah navigasi samping." },
        { title: "Langkah 2: Klik Tambah Lansia", text: "Klik tombol '+ Tambah Lansia' di sudut kanan atas." },
        { title: "Langkah 3: Lengkapi Identitas", text: "Isi NIK (16 digit), Nama Lengkap, Tanggal Lahir, Jenis Kelamin, RT/RW, dan riwayat penyakit hipertensi/diabetes." },
        { title: "Langkah 4: Simpan Data", text: "Klik tombol 'Simpan'. Lansia baru langsung terdaftar dan dapat dicatat pemeriksaannya." },
      ],
    },
    {
      id: "g2",
      title: "Alur Input Pemeriksaan Lansia (Hari-H)",
      category: "kader",
      description: "Langkah mencatat hasil penimbangan, tensi, dan gula darah lansia pada hari pelayanan posyandu.",
      icon: HeartPulse,
      steps: [
        { title: "Langkah 1: Masuk Menu Pelayanan", text: "Buka menu 'Pelayanan' untuk mengakses meja pemeriksaan aktif." },
        { title: "Langkah 2: Pilih Lansia dari Antrean", text: "Cari nama lansia atau pilih lansia yang hadir hari ini." },
        { title: "Langkah 3: Masukkan Data Fisik & Medis", text: "Ketik Berat Badan, Tinggi Badan, Sistol, Diastol, Gula Darah (GDS), dan Lingkar Perut." },
        { title: "Langkah 4: Tambahkan Keluhan & Rujukan", text: "Tulis keluhan atau rujukan obat bila ada, lalu simpan pemeriksaan." },
      ],
    },
    {
      id: "g3",
      title: "Mengunduh Laporan (Excel & PDF)",
      category: "kader",
      description: "Cara mengekspor rekapitulasi data bulanan posyandu lansia untuk Puskesmas atau arsip.",
      icon: Download,
      steps: [
        { title: "Langkah 1: Buka Menu Laporan", text: "Klik menu 'Laporan' di bilah navigasi samping." },
        { title: "Langkah 2: Pilih Periode Waktu", text: "Tentukan bulan dan tahun pelayanan yang ingin direkap." },
        { title: "Langkah 3: Klik Unduh File", text: "Klik 'Unduh Excel' untuk laporan rekapitulasi format spreadsheet, atau 'Unduh PDF' untuk dokumen cetak fisik." },
      ],
    },
    {
      id: "g4",
      title: "Backup & Keamanan Data Posyandu",
      category: "owner",
      description: "Langkah mencadangkan seluruh data posyandu ke file JSON aman untuk mencegah kehilangan data.",
      icon: Database,
      steps: [
        { title: "Langkah 1: Masuk Menu Pengaturan", text: "Klik menu 'Pengaturan' di navigasi utama (khusus hak akses Owner)." },
        { title: "Langkah 2: Pilih Tab Data & Keamanan", text: "Pilih menu 'Data & Keamanan' di dalam panel pengaturan sistem." },
        { title: "Langkah 3: Unduh File Cadangan", text: "Klik tombol 'Unduh Backup Data (.json)'. Sistem akan otomatis mengemas seluruh data profil, kader, lansia, dan rekam medis." },
      ],
    },
  ];

  const filteredGuides = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGuide = guides.find((g) => g.id === activeGuideId);

  const filteredFaqs = faqList.filter((f) => {
    const matchCategory = faqFilter === "Semua" || f.category === faqFilter;
    const matchSearch =
      !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const filteredGlossary = glossary.filter(
    (g) =>
      !searchQuery ||
      g.istilah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.arti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <PageHelmet
        title="Pusat Bantuan & Standar Acuan Lansia"
        description="Panduan operasional posyandu lansia, FAQ, standar acuan medis Kemenkes RI, dan kontak rujukan."
      />

      {/* View Detail Panduan */}
      {selectedGuide ? (
        <div className="space-y-6 max-w-3xl">
          <button
            onClick={() => setActiveGuideId(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-saas-primary hover:underline transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pusat Bantuan
          </button>

          <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saas-primary/10 flex items-center justify-center text-saas-primary shrink-0">
                <selectedGuide.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-saas-dark">{selectedGuide.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                      selectedGuide.category === "owner" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {selectedGuide.category === "owner" ? "Khusus Owner" : "Kader"}
                  </span>
                </div>
                <p className="text-xs text-saas-muted mt-0.5">{selectedGuide.description}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              {selectedGuide.steps.map((s, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-saas-dark">{s.title}</p>
                    {s.badge && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-saas-muted leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header & Search */}
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                Pusat Edukasi &amp; Bantuan Kader
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pusat Bantuan &amp; Standar Acuan Posyandu Lansia
              </h2>
              <p className="text-teal-100 text-xs sm:text-sm font-normal">
                Panduan praktis pengoperasian sistem, acuan medis skrining PTM Kemenkes RI, dan FAQ pelayanan lansia.
              </p>

              <div className="relative pt-2">
                <input
                  type="text"
                  placeholder="Cari panduan, istilah medis, atau pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-xl text-xs font-semibold focus:outline-none shadow-md placeholder-gray-400"
                />
                <Search className="absolute left-3.5 top-5 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Kartu Panduan Cepat */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-saas-primary" />
              <h3 className="font-extrabold text-sm text-saas-dark">Panduan Langkah Kerja Kader</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className="p-5 bg-white rounded-card shadow-soft-card border border-gray-100/70 hover:border-saas-primary/30 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-saas-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <guide.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-saas-dark group-hover:text-saas-primary transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-[11px] text-saas-muted mt-1 leading-relaxed line-clamp-2">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-saas-primary pt-3 block">
                    Buka Panduan &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* STANDAR MEDIS ACUAN LANSIA (KEMENKES RI) */}
          <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <HeartPulse className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-extrabold text-sm text-saas-dark">
                  Standar Medis Acuan Lansia (Kemenkes RI &amp; JNC-7)
                </h3>
                <p className="text-xs text-saas-muted">Pedoman interpretasi nilai pemeriksaan tekanan darah, gula darah, dan metabolik</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Lansia Sub-Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setLansiaTab("tensi")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    lansiaTab === "tensi"
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-black"
                      : "bg-gray-50 border border-gray-100 text-saas-muted hover:bg-gray-100"
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" /> Tekanan Darah (Tensi)
                </button>
                <button
                  onClick={() => setLansiaTab("gula")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    lansiaTab === "gula"
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-black"
                      : "bg-gray-50 border border-gray-100 text-saas-muted hover:bg-gray-100"
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5" /> Gula Darah (GDS / GDP)
                </button>
                <button
                  onClick={() => setLansiaTab("asam_kolesterol")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    lansiaTab === "asam_kolesterol"
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-black"
                      : "bg-gray-50 border border-gray-100 text-saas-muted hover:bg-gray-100"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Asam Urat &amp; Kolesterol
                </button>
                <button
                  onClick={() => setLansiaTab("kemandirian")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    lansiaTab === "kemandirian"
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-black"
                      : "bg-gray-50 border border-gray-100 text-saas-muted hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Tingkat Kemandirian (AKS)
                </button>
              </div>

              {/* Subtab: Tekanan Darah */}
              {lansiaTab === "tensi" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                    <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <InfoIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      Klasifikasi Tekanan Darah (Pedoman JNC / Kemenkes RI)
                    </p>
                    <p className="text-indigo-800 text-[11px] font-semibold mt-1">
                      Pemeriksaan tensi dilakukan setelah lansia beristirahat minimal 5 menit dalam posisi duduk santai dan tidak mengobrol.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-saas-dark font-extrabold border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4">Kategori</th>
                          <th className="py-2.5 px-3">Sistol (mmHg)</th>
                          <th className="py-2.5 px-3">Diastol (mmHg)</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-4">Tindakan / Rekomendasi Kader</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-saas-dark">
                        <tr className="hover:bg-emerald-50/30">
                          <td className="py-2.5 px-4 font-bold">Optimal / Normal</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">&lt; 120</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">&lt; 80</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Normal
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Pertahankan pola makan bergizi seimbang dan aktivitas fisik ringan rutin (jalan santai).
                          </td>
                        </tr>
                        <tr className="hover:bg-amber-50/30">
                          <td className="py-2.5 px-4 font-bold">Pra-Hipertensi</td>
                          <td className="py-2.5 px-3 text-amber-700 font-bold">120 – 139</td>
                          <td className="py-2.5 px-3 text-amber-700 font-bold">80 – 89</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Waspada
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Edukasi pengurangan konsumsi garam (maksimal 1 sendok teh/hari) dan kontrol ulang bulan depan.
                          </td>
                        </tr>
                        <tr className="hover:bg-orange-50/30">
                          <td className="py-2.5 px-4 font-bold">Hipertensi Derajat 1</td>
                          <td className="py-2.5 px-3 text-orange-700 font-bold">140 – 159</td>
                          <td className="py-2.5 px-3 text-orange-700 font-bold">90 – 99</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">
                              Hipertensi 1
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Anjurkan periksa ke dokter Puskesmas untuk evaluasi pengobatan dan modifikasi pola hidup.
                          </td>
                        </tr>
                        <tr className="hover:bg-red-50/30">
                          <td className="py-2.5 px-4 font-bold">Hipertensi Derajat 2</td>
                          <td className="py-2.5 px-3 text-red-700 font-bold">≥ 160</td>
                          <td className="py-2.5 px-3 text-red-700 font-bold">≥ 100</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
                              Hipertensi 2
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Wajib kontrol rutin ke Puskesmas dan patuh minum obat anti-hipertensi dari dokter.
                          </td>
                        </tr>
                        <tr className="hover:bg-rose-100/40 bg-rose-50/20">
                          <td className="py-2.5 px-4 font-bold text-rose-800">Krisis Hipertensi</td>
                          <td className="py-2.5 px-3 text-rose-800 font-extrabold">&gt; 180</td>
                          <td className="py-2.5 px-3 text-rose-800 font-extrabold">&gt; 120</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                              Darurat!
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-rose-900 font-bold">
                            BAHAYA. Segera dampingi lansia ke Puskesmas / IGD terdekat jika disertai pusing berat, mual, atau pandangan kabur!
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab: Gula Darah */}
              {lansiaTab === "gula" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                    <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <InfoIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      Acuan Nilai Gula Darah Lansia (Kemenkes RI)
                    </p>
                    <p className="text-indigo-800 text-[11px] font-semibold mt-1">
                      Pemeriksaan di Posyandu umumnya menggunakan tes Gula Darah Sewaktu (GDS) tanpa puasa.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-saas-dark font-extrabold border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4">Jenis Pemeriksaan</th>
                          <th className="py-2.5 px-3 text-emerald-700">Normal</th>
                          <th className="py-2.5 px-3 text-amber-700">Pra-Diabetes (Waspada)</th>
                          <th className="py-2.5 px-3 text-red-700">Diabetes (Tinggi)</th>
                          <th className="py-2.5 px-4">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-saas-dark">
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-3 px-4 font-bold">
                            GDS (Gula Darah Sewaktu)
                            <span className="block text-[10px] text-saas-muted font-normal">Diperiksa kapan saja tanpa puasa</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-700 font-bold">&lt; 140 mg/dL</td>
                          <td className="py-3 px-3 text-amber-700 font-bold">140 – 199 mg/dL</td>
                          <td className="py-3 px-3 text-red-700 font-bold">≥ 200 mg/dL</td>
                          <td className="py-3 px-4 text-[11px] text-saas-muted">
                            Jika ≥ 200 mg/dL disertai sering haus/kencing, sarankan periksa lanjut ke dokter.
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-3 px-4 font-bold">
                            GDP (Gula Darah Puasa)
                            <span className="block text-[10px] text-saas-muted font-normal">Puasa makan 8–10 jam sebelum tes</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-700 font-bold">70 – 99 mg/dL</td>
                          <td className="py-3 px-3 text-amber-700 font-bold">100 – 125 mg/dL</td>
                          <td className="py-3 px-3 text-red-700 font-bold">≥ 126 mg/dL</td>
                          <td className="py-3 px-4 text-[11px] text-saas-muted">
                            Umumnya dilakukan pada pemeriksaan berkala di fasilitas kesehatan / Puskesmas.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab: Asam Urat & Kolesterol */}
              {lansiaTab === "asam_kolesterol" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                    <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <InfoIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      Acuan Nilai Asam Urat &amp; Kolesterol Total
                    </p>
                    <p className="text-indigo-800 text-[11px] font-semibold mt-1">
                      Pemeriksaan laboratorium sederhana dengan strip darah kapiler pada posyandu lansia.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-saas-dark font-extrabold border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4">Parameter</th>
                          <th className="py-2.5 px-3 text-emerald-700">Target Normal</th>
                          <th className="py-2.5 px-3 text-red-700">Kadar Tinggi</th>
                          <th className="py-2.5 px-4">Edukasi Makanan &amp; Pola Hidup</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-saas-dark">
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-4 font-bold">Asam Urat Laki-laki</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">3.4 – 7.0 mg/dL</td>
                          <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 7.0 mg/dL</td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Batasi jeroan, emping, kangkung, bayam, dan kacang berlebih. Perbanyak minum air putih.
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-4 font-bold">Asam Urat Perempuan</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">2.4 – 6.0 mg/dL</td>
                          <td className="py-2.5 px-3 text-red-700 font-bold">&gt; 6.0 mg/dL</td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Batasi konsumsi makanan tinggi purin (seafood, jeroan) dan hindari minuman manis berfruktosa.
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-4 font-bold">Kolesterol Total</td>
                          <td className="py-2.5 px-3 text-emerald-700 font-bold">&lt; 200 mg/dL</td>
                          <td className="py-2.5 px-3 text-red-700 font-bold">
                            ≥ 240 mg/dL
                            <span className="block text-[10px] text-amber-700 font-normal">Batas: 200–239</span>
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-saas-muted">
                            Kurangi makanan bersantan kental, gorengan minyak berulang, dan lemak hewani. Perbanyak serat buah &amp; oat.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab: Kemandirian */}
              {lansiaTab === "kemandirian" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                    <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <InfoIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                      Tingkat Kemandirian Lansia (Indeks Barthel / AKS)
                    </p>
                    <p className="text-indigo-800 text-[11px] font-semibold mt-1">
                      Digunakan untuk menilai kemampuan fungsional lansia dalam memenuhi kebutuhan dasar sehari-hari.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        Kategori A
                      </span>
                      <h4 className="font-extrabold text-sm text-emerald-950">Mandiri (Skor 20)</h4>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                        Lansia dapat makan, mandi, berpakaian, buang air, dan berjalan secara mandiri tanpa memerlukan bantuan orang lain.
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        Kategori B
                      </span>
                      <h4 className="font-extrabold text-sm text-amber-950">Ketergantungan Sebagian (Skor 5 – 19)</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                        Lansia memerlukan sedikit bantuan, pendampingan, atau pengawasan keluarga untuk beberapa aktivitas harian.
                      </p>
                    </div>

                    <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                        Kategori C
                      </span>
                      <h4 className="font-extrabold text-sm text-rose-950">Ketergantungan Total (Skor 0 – 4)</h4>
                      <p className="text-[11px] text-rose-800 leading-relaxed font-semibold">
                        Lansia tirah baring penuh dan bergantung total pada pendamping/keluarga. Disarankan program kunjungan rumah (home visit).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alur 5 Meja Posyandu Lansia */}
          <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4.5 h-4.5 text-saas-primary" />
              <h3 className="font-extrabold text-sm text-saas-dark">Alur 5 Langkah Pelayanan Posyandu Lansia (Hari-H)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 text-xs font-semibold leading-normal pt-2">
              {[
                { step: "1", title: "Pendaftaran", desc: "Cari nama lansia atau daftarkan jika baru pertama kali hadir." },
                { step: "2", title: "Pengukuran Fisik", desc: "Timbang berat badan, ukur tinggi badan, & lingkar perut." },
                { step: "3", title: "Pemeriksaan Medis", desc: "Cek tekanan darah, tes gula darah sewaktu (GDS), kolesterol/asam urat." },
                { step: "4", title: "Konseling & PMT", desc: "Edukasi pola makan sehat lansia, anjuran istirahat, & pemberian makanan tambahan." },
                { step: "5", title: "Rujukan & Selesai", desc: "Rujuk ke Puskesmas jika tensi >160 atau GDS >200 mg/dL." },
              ].map((s) => (
                <div key={s.step} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-1 relative">
                  <div className="absolute top-2.5 right-3 text-[10px] font-black text-saas-primary bg-saas-primary/10 w-5 h-5 rounded-full flex items-center justify-center">
                    {s.step}
                  </div>
                  <p className="font-extrabold text-saas-dark pr-6">{s.title}</p>
                  <p className="text-[11px] text-saas-muted leading-relaxed font-semibold mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tanya Jawab Umum (FAQ) */}
          <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-saas-primary flex items-center justify-center">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-saas-dark">Tanya Jawab Seputar Posyandu Lansia (FAQ)</h3>
                  <p className="text-[11px] text-saas-muted">Jawaban cepat untuk kendala yang sering ditanyakan kader</p>
                </div>
              </div>

              {/* FAQ Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["Semua", "Lansia", "Akun & Keamanan", "Umum"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFaqFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      faqFilter === cat
                        ? "bg-saas-primary text-white shadow-xs"
                        : "bg-gray-100 text-saas-muted hover:text-saas-dark"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border border-gray-100 rounded-xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 bg-gray-50/50 hover:bg-teal-50/20 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-teal-100 text-teal-800 shrink-0">
                            {faq.category}
                          </span>
                          <span className="font-bold text-xs text-saas-dark">{faq.question}</span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-saas-primary shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-saas-muted shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white text-xs text-saas-muted font-semibold leading-relaxed border-t border-gray-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-saas-muted font-medium">
                  Tidak ditemukan pertanyaan yang cocok dengan pencarian "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* Kamus Istilah Posyandu & Kontak Dukungan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kamus Istilah */}
            <div className="lg:col-span-2 bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <InfoIcon className="w-4.5 h-4.5 text-saas-primary" />
                  <h3 className="font-extrabold text-sm text-saas-dark">Kamus Istilah Kesehatan Lansia</h3>
                </div>
                <span className="text-[10px] font-bold text-saas-muted">
                  {filteredGlossary.length} Istilah
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {filteredGlossary.map((g, idx) => (
                  <div key={idx} className="p-3 bg-gray-50/80 border border-gray-100 rounded-xl space-y-1 hover:border-teal-200 transition-colors">
                    <p className="font-extrabold text-saas-dark text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                      {g.istilah}
                    </p>
                    <p className="text-[10px] text-saas-muted leading-normal font-semibold pl-3">{g.arti}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Kontak Pengembang & Dukungan Teknis */}
            <div className="bg-white rounded-card shadow-soft-card border border-gray-100/70 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4.5 h-4.5 text-saas-primary" />
                  <h3 className="font-extrabold text-sm text-saas-dark">Kontak Pengembang (Developer)</h3>
                </div>
                <p className="text-[11px] text-saas-muted font-medium leading-normal">
                  Bila Anda mengalami kendala teknis, error sistem, atau membutuhkan bantuan penggunaan aplikasi, silakan hubungi pengembang:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3.5 bg-teal-50/50 border border-teal-100/60 rounded-xl space-y-1">
                    <p className="text-[9px] text-saas-primary font-bold uppercase tracking-wider">
                      Tim Pengembang Sistem • Pengabdian Masyarakat
                    </p>
                    <p className="text-xs font-black text-saas-dark">Developer Sistem Lansia</p>
                    <a
                      href="https://wa.me/6285877925025?text=Halo%20Developer,%20saya%20memerlukan%20bantuan%20terkait%20sistem%20lansia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-saas-primary font-bold hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      💬 +62 858-7792-5025 (WhatsApp Developer)
                    </a>
                  </div>

                  <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                    <p className="text-[9px] text-saas-muted font-bold uppercase tracking-wider">Dukungan Teknis &amp; Konsultasi</p>
                    <p className="text-xs font-black text-saas-dark">Layanan Pemeliharaan Sistem</p>
                    <p className="text-[11px] text-saas-muted font-semibold pt-0.5">
                      Siap membantu troubleshooting, sinkronisasi data, &amp; panduan teknis kader.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] text-saas-muted font-medium leading-relaxed">
                  <span className="font-bold text-saas-dark">Catatan:</span> Layanan dukungan teknis hanya untuk masalah terkait sistem, bukan untuk konsultasi medis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}