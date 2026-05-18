# 🛡️ PamFlow — Official Release Documentation
**Professional Task Management & Engineering Reporting Application**

---

| ℹ️ Project Information | Details |
| :--- | :--- |
| **Last Updated** | 5 Mei 2026 |
| **Current Status** | 🟢 Stable / Production Ready |
| **Identity** | PamFlow (Premium Enterprise Edition) |

---

## 👥 Development Team
*The core team responsible for the architecture, development, and quality assurance of the PamFlow system.*

| Role | Name | Responsibility |
| :--- | :--- | :--- |
| **Project Manager** | Ahmad Affan Ridha | Strategic Planning & Requirements |
| **Lead Developer** | Adil Effendi | Full-stack Architecture & Core Logic |
| **Quality Assurance** | Riky Akbar | System Stability & Bug Tracking |

---

## 📜 Project Vision
Aplikasi **PamFlow** adalah solusi manajemen operasional terpadu yang dirancang untuk meningkatkan transparansi, akuntabilitas, dan efisiensi kerja antar departemen. Dengan fokus pada estetika premium, konektivitas cerdas, dan keamanan data, PamFlow memberikan kontrol penuh bagi manajemen untuk memantau performa operasional secara real-time.

---

## 🚀 Version History

### 💎 v1.9.0 — Integrated Asset Management & Seamless UX Transition [CURRENT]
> *Fokus: Implementasi modul manajemen aset yang komprehensif, kontrol hak akses aset yang dinamis, optimasi alur login tanpa modal popup, serta pembatasan akses checklist harian antar-departemen.*

#### 📦 Asset Management System
*   **Register Aset**: Modul terpadu untuk mendaftarkan aset fisik baru dengan dukungan untuk detail teknis (merek, model, nomor seri) dan unggah dokumentasi pendukung.
*   **Monitoring Aset**: Panel visual dengan bagan interaktif (*ApexCharts*) untuk menganalisis skor kesehatan aset, frekuensi pemeliharaan bulanan, status operasional, serta analisis penggantian aset.
*   **Hak Akses Aset**: Kontrol granular berbasis peran dan departemen untuk melihat, memodifikasi, mendaftarkan, maupun mengaudit aset guna memastikan keamanan informasi internal.
*   **Mobile Asset Debug Info**: Penambahan panel diagnostik hak akses aset di halaman Profil Mobile untuk mempermudah audit izin modul bagi para agen di lapangan.

#### 📋 Daily Checklist (Checklist Harian) Access Control
*   **RBAC & Dept Relationship Restriction**: Membatasi akses penuh modul checklist harian hanya untuk departemen asal/pelapor (misalnya Operasional). Departemen penerima/tujuan (misalnya Engineering) kini hanya dapat melakukan *monitoring* (melihat daftar riwayat dan rincian audit checklist).
*   **Action Lock on Target Dept**: Tombol "Mulai Baru" di halaman riwayat dan tombol "Kirim WO Masal" di halaman detail hasil checklist disembunyikan/dikunci secara otomatis dengan penjelasan akses terbatas ketika dibuka oleh departemen target guna menghindari duplikasi kerja.
*   **Mobile-Ready Experience**: Fitur peninjauan tindakan perbaikan (kartu "Tindakan Diperlukan") dan modal pengecekan duplikasi laporan kini diaktifkan penuh di perangkat mobile, memberikan alur kerja WO instan bagi tim yang berwenang.
*   **Sidebar Visibility Fix (PC)**: Memperbaiki keterlihatan menu utama **Checklist** di dashboard PC bagi departemen penerima/target (seperti *Engineering Ewalk*) agar mereka dapat mengakses submenu **Riwayat Checklist** untuk memantau temuan audit operasional, sembari menyembunyikan link pembuatan checklist baru (**Checklist Harian**) untuk menghindari input data yang salah.
*   **Premium History Search, Filters & View Toggle**: Menambahkan panel pencarian, filter interaktif (Shift, Temuan), serta **Segmented View Toggle** (Tampilan Kartu vs Tampilan Tabel) di menu Riwayat Checklist yang dioptimalkan penuh untuk PC & mobile. Pengguna dapat secara instan mengubah visualisasi riwayat, dengan status pencarian dan filter yang tetap sinkron di kedua mode tampilan secara real-time lengkap dengan fallback tampilan hasil kosong dan tombol reset.
*   **Live Camera Enforced Uploads & Video Capture Restrictions**:
    *   **Live-Only Capture**: Menambahkan atribut `capture="environment"` pada input foto dan video untuk memaksa browser memanggil aplikasi kamera langsung pada perangkat mobile, mencegah kecurangan/manipulasi data lewat unggahan galeri foto.
    *   **Maximum Limits**: Membatasi unggahan hingga maksimal 5 foto dan durasi video maksimal 20 detik secara offline menggunakan validasi metadata video virtual browser sebelum diunggah.
    *   **Full Media Deletion**: Pengguna dapat membatalkan atau menghapus foto/video yang diambil sebelum mengirim formulir checklist.
*   **Work Order (WO) Media Traceability & Video Players**:
    *   **Backend Media Storage Extension**: Mengembangkan utility `fileHelper.js` backend agar mendukung penyimpanan video berformat base64 (`data:video/`) ke direktori statis server.
    *   **End-to-End Media Preservation**: Menyimpan data array foto asli (`original_photos`) dan video temuan asli (`original_video`) di database saat hasil checklist dikonversi menjadi Work Order.
    *   **Integrated HTML5 Video Players**: Menyematkan pemutar video modern interaktif pada antarmuka rincian tugas PC dan Mobile di halaman:
        *   **WO Terkirim Detail** (`TerkirimDetail.jsx`) untuk pelapor.
        *   **WO Diterima Detail** (`DiterimaDetail.jsx`) untuk penerima.
        *   **Buat Tugas Departemen** (`BuatTugasDepartemen.jsx`) untuk peninjau WO inter-departemen.
        *   **Buat Tugas Agen** (`BuatTugas.jsx`) untuk penugasan ke lapangan.

#### ⚡ Seamless UX Transition (Optimasi Login)
*   **Instant Login Redirect**: Penghapusan modal popup "Login Berhasil" di versi desktop maupun mobile. Login kini langsung memicu layar transisi transparan (*LoadingScreen*) untuk mempercepat pemuatan dashboard dan meningkatkan kenyamanan pengguna.

---

### 💎 v1.8.2 — System Reliability & Offline Sync Optimization
> *Fokus: Peningkatan keandalan database, pengalaman offline yang robust, penambahan test coverage, dan sesi token dinamis.*

#### 🛠️ Core Infrastructure & Database
*   **Auto-Reconnect Database**: Implementasi sistem `exponential backoff` pada inisialisasi database MySQL untuk mencegah *server crash* saat *startup* jika database belum sepenuhnya siap (menangani `ECONNREFUSED`).
*   **Docker Integration**: Menambahkan `docker-compose.yml` khusus untuk containerisasi MySQL 8.0, mempermudah deployment dan standarisasi *environment*.
*   **Health Check API**: Ekspansi *endpoint* diagnostik dengan `/api/health` untuk memantau status *uptime*.

#### 🌐 Offline Sync & PWA
*   **Smart Conflict Resolution**: Pembaruan sistem *IndexedDB* (`OfflineSyncManager`) dengan logika *queue* cerdas yang mampu mendeteksi dan menyelesaikan konflik data secara otomatis (misalnya penumpukan event 'SUBMIT' berulang).
*   **Granular Sync Feedback**: UI sinkronisasi kini melacak status sukses dan gagal secara terpisah, memberikan notifikasi detail (*partial success*) dan menyimpan log data yang tertunda untuk diulang di siklus berikutnya tanpa memblokir *queue*.

#### 🛡️ Security & Authentication
*   **Seamless Token Refresh**: Menambahkan dukungan *Refresh Token* berumur 7 hari. Aplikasi frontend (`api.js`) kini secara otomatis mencegat error *401/403* (sesi kedaluwarsa) dan meminta token baru secara transparan tanpa memaksa pengguna (*force logout*) keluar dari aplikasi.

#### 🧪 Quality Assurance
*   **Controller Testing**: Integrasi *Supertest* dan *Jest* untuk pengujian tingkat *controller*. Menambahkan unit testing untuk `authController` dan integration testing untuk `taskController` untuk menjamin stabilitas fungsional.

---

### ✨ v1.7.0 — PamFlow Rebranding & Optimization
> *Fokus: Pembaruan identitas brand PamFlow dan penyederhanaan UI.*

#### 🎨 Branding & Identity
*   **Official Logo Update**: Implementasi logo baru PamFlow pada seluruh platform.
*   **Clean UI Initiative**: Penyederhanaan halaman login dengan menghapus elemen deskriptif yang tidak diperlukan untuk estetika yang lebih profesional.
*   **Global Entity Renaming**: Perubahan total nama entitas dari Optera kembali menjadi **PamFlow** di seluruh sistem, termasuk database, API, dan UI.

#### 🛡️ Security & Performance Hardening
*   **Bcrypt Password Encryption**: Mengimplementasikan algoritma `bcrypt` untuk perlindungan tingkat tinggi pada seluruh kata sandi dan PIN pengguna. Termasuk skrip migrasi otomatis dari plaintext ke enkripsi *hash*.
*   **Rate Limiting Protection**: Memasang sistem perlindungan *Brute Force* dengan `express-rate-limit` pada *endpoint* login untuk membatasi akses berlebihan dari IP yang mencurigakan.
*   **Memory DoS Prevention**: Mengurangi batas maksimal ukuran muatan JSON (*payload limit*) dari 50MB menjadi 5MB secara global pada sisi server.
*   **Smart Auto-Logout (6 Jam)**: Memperketat masa berlaku sesi JWT menjadi 6 jam, memastikan aplikasi (*frontend*) akan mengeluarkan pengguna secara otomatis jika sudah kedaluwarsa.

#### 📊 Dashboard & Reporting
*   **Searchable Dropdowns**: Memperbarui antarmuka pemilihan Perusahaan dan Departemen dengan *Dropdown Popover* interaktif (bergaya *glassmorphism* modern) yang dilengkapi dengan kotak pencarian terintegrasi.
*   **Smart Department Auto-Select**: Dashboard kini dibekali fitur inisialisasi cerdas yang mendeteksi profil departemen pengguna saat *login* dan memilih tampilan analitik mereka secara otomatis.
*   **Real-time Analytics**: Optimalisasi perhitungan statistik dashboard untuk akurasi data real-time.
*   **Professional PDF Reporting**: Implementasi modul generator PDF dengan standar branding perusahaan.

---

### 💎 v1.6.0 — Dynamic Connectivity & HD Rebranding
> *Fokus: Optimalisasi konektivitas jaringan dan restorasi identitas visual HD.*

#### 🌐 Network & Connectivity
*   **Dynamic API Auto-Detection**: Implementasi deteksi hostname otomatis pada `config.js`. Aplikasi kini secara cerdas mendeteksi IP server secara real-time, menghilangkan ketergantungan pada IP statis di file `.env`.
*   **WiFi-Agnostic Operation**: Pengguna tidak perlu lagi melakukan *rebuild* aplikasi saat berpindah jaringan WiFi; koneksi API dan Socket akan menyesuaikan secara dinamis.
*   **Centralized Configuration**: Refaktor besar-besaran pada 10+ komponen untuk menggunakan satu sumber data (`API_URL`) yang terpusat.

#### 🎨 Visual Identity & Branding
*   **HD Logo Implementation**: Migrasi ke logo High-Definition baru berbasis aset PNG HD.
*   **Full Identity Restoration**: Mengembalikan identitas brand ke **PamFlow** pada seluruh elemen UI (Desktop & Mobile), termasuk manifest PWA, judul halaman, dan footer.
*   **System-Wide Rebranding**: Pembaruan teks notifikasi, konfirmasi keluar, dan laporan PDF untuk menggunakan nama entitas **PamFlow**.

#### 🐛 Bug Fixes
*   **Mobile Navigation Loop**: Perbaikan bug pada `MobileTaskDetail` di mana aplikasi tetap berada di halaman detail setelah tugas diselesaikan atau disetujui. Sekarang aplikasi otomatis kembali ke Beranda (Home) setelah aksi berhasil.

---

### ✨ v1.5.0 — Premium Branding & Audit Evolution
> *Fokus: Transformasi identitas brand dan penguatan akuntabilitas sistem.*

#### 🎨 Branding & UI/UX
*   **Identity Migration**: Rebranding elemen aplikasi (Desktop & Mobile).
*   **Design System**: Implementasi palet warna baru (Vibrant Green & Deep Blue) untuk memberikan kesan modern dan premium.
*   **UI Polish**: Pembersihan elemen visual untuk memastikan konsistensi branding.

#### 🛠️ Technical & Infrastructure
*   **Advanced Audit Module**: Implementasi modul "Audit Log" di menu Pengaturan dengan fitur filter modul dan detail perubahan data (JSON Comparison).
*   **RBAC Enforcement**: Penambahan hak akses khusus modul Audit Log untuk peran *Super Admin* dan *L1 - Superadmin*.
*   **TDD Framework**: Integrasi **Jest** dan **Supertest** pada backend untuk memastikan stabilitas sistem.

---

### 💎 v1.4.0 — Workflow & Approval Optimization
> *Fokus: Efisiensi manajerial dan stabilitas performa pada perangkat mobile.*

*   **Mobile Approval Engine**: Pemisahan data tugas "Menunggu Approval" dan "Riwayat" pada endpoint `approvals`.
*   **High-Fidelity Detail View**: Redesain komponen detail tugas untuk tampilan data teknis yang lebih terstruktur.
*   **Activity Timeline**: Visualisasi riwayat status tugas yang terintegrasi langsung dengan database audit log.

---

### 📱 v1.2.0 — Native Mobile Experience
> *Fokus: Responsivitas layout dan navigasi context-aware.*

*   **Layout Persistence**: Arsitektur `position: fixed` untuk mencegah *layout shift*.
*   **Safe-Area Integration**: Dukungan penuh untuk notch perangkat modern via CSS `env()`.

---

### 🏗️ v1.0.0 — Baseline Foundation
> *Fokus: Peluncuran perdana sistem manajemen operasional inti.*

*   **Core Task Management**: Arsitektur dasar pembuatan dan pelaporan tugas.
*   **Auth System**: Implementasi JWT (JSON Web Token) untuk keamanan akses.

---

> [!IMPORTANT]
> Seluruh dokumentasi ini adalah milik tim pengembangan PamFlow dan harus dirujuk sebagai panduan resmi pengembangan berkelanjutan.an harus dirujuk sebagai panduan resmi pengembangan berkelanjutan.
