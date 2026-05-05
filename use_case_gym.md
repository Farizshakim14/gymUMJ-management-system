# Dokumen Use Case - Sistem Manajemen Gym UMJ

Dokumen ini mendeskripsikan spesifikasi fungsional dan interaksi aktor dalam Sistem Manajemen Gym Fakultas Teknik Universitas Muhammadiyah Jakarta (UMJ).

## 1. Daftar Aktor (Actors)

Sistem ini memiliki 3 aktor utama dengan hak akses yang berbeda:

| Aktor | Deskripsi |
|---|---|
| **Member** | Mahasiswa/pengguna biasa yang menggunakan aplikasi untuk memesan jadwal latihan dan melihat riwayat gym mereka. |
| **Admin Gym** | Pengelola operasional gym yang mengatur jadwal, menyetujui *booking*, menghapus *user* secara permanen, dan merekap absensi. |
| **Wadek II** | Eksekutif/Pimpinan (Wakil Dekan II) yang bertugas memantau seluruh aktivitas gym dan menyetujui laporan absensi bulanan/tahunan yang dikirimkan Admin. |

---

## 2. Diagram Use Case (Textual Representation)

### A. Use Case: Member (Aplikasi / Mobile)
1. **Login & Register**: Member dapat membuat akun dan masuk ke dalam aplikasi.
2. **Kelola Profil Pribadi**: Member dapat memperbarui biodata seperti Nama, *Gender*, NIM, Berat Badan, Tinggi Badan, dan Tujuan Latihan.
3. **Melihat & Memilih Slot Latihan**: Member dapat melihat jadwal gym yang tersedia. Sistem akan memfilter slot yang bisa dibooking sesuai dengan *Gender* member (Laki-laki / Perempuan / Campur).
4. **Melakukan Booking**: Member dapat memesan slot latihan. Status awal pemesanan adalah *Pending* dan menunggu persetujuan Admin.
5. **Melihat Riwayat**: Member dapat melihat riwayat *booking* dan absensi (*Check-in*/*Check-out*) mereka.

### B. Use Case: Admin Gym (Web Dashboard)
1. **Login Admin**: Masuk ke dashboard web dengan akses khusus `role: admin`.
2. **Kelola Data User (CRUD)**: 
   - Admin dapat menambah, mengedit, dan menghapus member. 
   - *Penghapusan menggunakan integrasi Backend Node.js*, sehingga akun otomatis terhapus dari *Realtime Database* maupun *Firebase Authentication* (Email bisa digunakan lagi).
3. **Kelola Slot Latihan**: Admin membuat jadwal dengan menentukan Tanggal, Jam, Kapasitas Maksimal, dan Target *Gender* (Laki-laki, Perempuan, Campur).
4. **Validasi & Kelola Booking (ACC/Tolak)**:
   - Admin melihat daftar *booking* member (berstatus *Pending*).
   - Saat Admin menekan **ACC (Disetujui)**, sistem otomatis **mengurangi sisa kapasitas** slot latihan.
   - Admin dapat menghapus atau menolak *booking* (Kapasitas akan dikembalikan otomatis jika sebelumnya disetujui).
5. **Kelola Absensi & Laporan Eksekutif**:
   - Admin dapat memfilter dan mengekspor data absensi ke PDF/Excel.
   - Admin dapat **Mengirim Laporan Rekap (Bulanan/Tahunan) ke Wadek II**.
   - Admin dapat memantau **Riwayat Laporan** beserta status persetujuan dari Wadek II.

### C. Use Case: Wakil Dekan II (Web Dashboard)
1. **Login Wadek II**: Masuk ke dashboard web dengan akses khusus `role: wadek2`.
2. **Melihat Dashboard Utama**: Melihat statistik total Member, total Booking, dan total Absensi.
3. **Monitoring Data Operasional**: Wadek II dapat memantau data secara *Read-Only* (Hanya Baca):
   - Monitoring Users (termasuk *Gender* & Tujuan).
   - Monitoring Slot Latihan (Sisa Kapasitas & Target *Gender*).
   - Monitoring Booking (Melihat *Status* persetujuan *booking*).
4. **Monitoring & Verifikasi Laporan Absensi**:
   - Menerima kotak masuk laporan rekap absensi yang dikirim Admin.
   - Melakukan tinjauan (*Review*) terhadap isi laporan.
   - Memberikan keputusan: **Setujui** atau **Tolak** laporan.
   - Mengunduh laporan yang valid ke dalam bentuk PDF/Excel.

---

## 3. Aturan Bisnis (Business Rules) Terkait

1. **Validasi Gender**: Member perempuan tidak bisa mem-*booking* slot yang dikhususkan untuk laki-laki, begitu pula sebaliknya. Sistem mengecek *Gender* profil member saat *booking* dikirim (oleh member) atau dibuat (oleh admin).
2. **Logika Kapasitas Slot**: 
   - Saat member mengklik *booking*, kapasitas slot **belum** berkurang.
   - Kapasitas hanya berkurang jika Admin menekan **ACC**. 
   - Mencegah kondisi di mana member asal *booking* dan membuat slot seolah-olah penuh padahal belum disetujui admin.
3. **Arsitektur Keamanan (Backend)**: Operasi krusial seperti penghapusan total *Authentication* dikendalikan secara tersentralisasi melalui *Backend Node.js* menggunakan *Firebase Admin SDK* demi keamanan data privasi.
