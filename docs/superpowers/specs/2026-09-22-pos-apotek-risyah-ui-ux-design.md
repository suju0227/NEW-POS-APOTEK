# Spesifikasi UI/UX Dashboard Kasir POS Apotek Risyah

## 1. Tujuan

Menyediakan workspace kasir desktop-first yang memungkinkan pencarian/scan produk, pemeriksaan stok, pengelolaan keranjang, pemilihan pembayaran, dan penyelesaian transaksi tanpa berpindah halaman.

Target utama: kasir baru dapat menyelesaikan checkout sederhana dengan sedikit keputusan dan tanpa kehilangan konteks total transaksi.

## 2. Batasan

- Satu cabang apotek.
- Mode utama desktop/tablet landscape; tetap usable pada lebar 768px.
- Pembayaran V1: tunai dan QRIS dinamis dari payload statis.
- QRIS tidak memiliki konfirmasi provider otomatis; kasir mengonfirmasi dana secara manual.
- Tidak membangun halaman resep/konseling pada layar checkout V1.
- Tidak menggunakan warna sebagai satu-satunya penyampai status.

## 3. Prinsip UX

1. **Kasir-first:** area pencarian dan keranjang menjadi pusat layar.
2. **Total selalu terlihat:** subtotal, diskon, total, dan tombol bayar berada pada panel kanan yang sticky.
3. **Scan sebelum klik:** input barcode autofocus ketika layar kasir dibuka dan tetap mudah diaktifkan kembali.
4. **FEFO tidak membebani kasir:** sistem memilih batch otomatis; detail batch tersedia melalui disclosure.
5. **Aman untuk uang dan stok:** aksi bayar, void, retur, dan koreksi memiliki status jelas, konfirmasi, dan permission.
6. **Padat tetapi tenang:** gunakan hierarki tipografi dan ruang yang konsisten, bukan dekorasi.
7. **Accessible by default:** target sentuh minimal 44px, focus ring terlihat, label selalu tersedia, kontras teks memenuhi WCAG AA.

## 4. Struktur Navigasi

### Sidebar

- Logo dan nama `Risyah`
- Kasir
- Transaksi
- Produk
- Pembelian
- Stok
- Laporan
- Pengaturan (manager/admin)
- Status shift dan nama pengguna di bagian bawah

Sidebar dapat diciutkan hanya pada layar >= 1100px. Pada layar lebih kecil, gunakan drawer dengan tombol menu.

### Header konteks

- Breadcrumb atau judul halaman
- Indikator cabang: `Apotek Risyah · Cabang Utama`
- Status shift: `Shift aktif`
- Pencarian global tidak menggantikan pencarian produk di workspace kasir
- Menu akun

## 5. Layar Kasir / Checkout

### Wireframe desktop

```text
┌──────────────┬────────────────────────────────────────────────────────────┐
│ Risyah       │ Kasir                         Shift aktif · Siti            │
│              ├────────────────────────────────────────────────────────────┤
│ Kasir        │ [ Scan barcode / cari nama obat......................... ]  │
│ Transaksi    │ [Semua] [Obat bebas] [Vitamin] [Alat kesehatan]             │
│ Produk       │                                                            │
│ Pembelian    │ Hasil produk                                               │
│ Stok         │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ Laporan      │ │ Paracetamol │ │ Amoxicillin │ │ Vitamin C   │            │
│              │ │ Tablet      │ │ 500 mg      │ │ 1000 mg     │            │
│              │ │ Rp 5.000    │ │ Resep       │ │ Rp 18.000   │            │
│              │ └─────────────┘ └─────────────┘ └─────────────┘            │
│              │                                                            │
│              │ Keranjang (3 item)                        [Simpan draft]   │
│              │ ┌──────────────────────────────────────────┐ ┌───────────┐ │
│              │ │ Paracetamol 500mg  ×2       Rp 10.000    │ │ Ringkasan │ │
│              │ │ Vitamin C           ×1       Rp 18.000    │ │ Subtotal  │ │
│              │ │ [detail batch FEFO]                       │ │ Diskon    │ │
│              │ └──────────────────────────────────────────┘ │ Total     │ │
│              │ [Kosongkan]                                  │ [Tunai]   │ │
│              │                                               │ [QRIS]    │ │
│              │                                               │ BAYAR     │ │
└──────────────┴───────────────────────────────────────────────┴───────────┘
```

### Area pencarian

- Placeholder: `Scan barcode atau cari nama obat`
- Autofocus saat halaman siap.
- Enter memilih hasil pertama hanya jika hasil unik; jika ambigu tampilkan daftar.
- Hasil menampilkan nama, kekuatan/satuan, harga jual, stok tersedia, dan badge resep bila relevan.
- Produk expired, inactive, atau stok tersedia nol tidak dapat ditambahkan.
- Saat barcode tidak ditemukan, tampilkan pesan inline dengan opsi `Cari berdasarkan nama`.

### Kartu hasil produk

Menampilkan:
- nama produk dan generic name jika tersedia
- dosage form/strength
- harga jual per satuan
- stok tersedia
- status: `Tersedia`, `Stok rendah`, `Habis`, atau `Perlu resep`

Klik kartu atau tekan Enter menambahkan satu unit. Quantity dapat dinaikkan dari keranjang.

### Keranjang

Setiap baris menampilkan:
- nama produk dan satuan
- kontrol quantity dengan input angka yang dapat diakses
- harga per unit dan subtotal
- tombol hapus
- disclosure `Lihat alokasi batch` jika lebih dari satu batch digunakan

Alokasi FEFO tidak diedit kasir pada alur normal. Jika stok berubah saat checkout, sistem menampilkan error yang dapat dipulihkan: `Stok berubah. Periksa keranjang sebelum melanjutkan.`

### Ringkasan pembayaran

Panel kanan sticky berisi:
- subtotal
- diskon jika permission tersedia
- total akhir dalam Rupiah tanpa desimal
- tombol metode: `Tunai` dan `QRIS`
- CTA utama: `Bayar Rp {total}`

CTA nonaktif jika keranjang kosong, total tidak valid, atau transaksi sedang diproses.

## 6. State Pembayaran

### Tunai

Dialog atau panel inline menampilkan:
- total tagihan besar
- input `Uang diterima`
- kembalian otomatis
- nominal cepat: `Rp 20.000`, `Rp 50.000`, `Rp 100.000`, `Uang pas`
- tombol `Konfirmasi pembayaran`

Validasi: uang diterima harus >= total, angka positif, dan tidak melebihi batas numerik aplikasi.

### QRIS

Dialog menampilkan:
- total nominal
- QR dinamis berisi snapshot payload transaksi
- nomor transaksi
- status `Menunggu konfirmasi kasir`
- tombol `Konfirmasi dana diterima`
- tombol `Batalkan pembayaran`

Copy harus tegas: `Pastikan dana sudah masuk sebelum mengonfirmasi.` Sistem tidak menyatakan pembayaran sukses berdasarkan waktu tunggu, tampilan QR, atau tindakan pelanggan.

### Sukses

Receipt success state menampilkan:
- label `Pembayaran berhasil`
- nomor transaksi
- waktu
- metode pembayaran
- total
- tombol `Cetak struk`, `Transaksi baru`, dan `Lihat detail`

## 7. State Global dan Error

- **Loading:** skeleton pada hasil produk dan disabled state pada CTA.
- **Empty:** ilustrasi tidak diperlukan; gunakan pesan singkat dan action utama.
- **Offline/server error:** banner persisten `Koneksi bermasalah. Transaksi belum disimpan.` Jangan menampilkan sukses optimistis.
- **Permission denied:** jelaskan permission yang dibutuhkan, tanpa membocorkan data sensitif.
- **Session expired:** simpan draft keranjang sementara di memory/session flow yang aman, lalu minta login ulang; jangan gunakan localStorage sebagai sumber kebenaran transaksi.
- **Duplicate submit:** tombol berubah menjadi `Memproses...` dan request memakai idempotency key.

## 8. Layar Transaksi

Tabel dengan:
- nomor transaksi
- waktu
- kasir
- total
- metode pembayaran
- status
- tindakan detail

Filter: rentang tanggal, status, metode, kasir. Detail transaksi menampilkan item, alokasi batch, payment record, dan audit trail. Void/retur tidak menghapus transaksi; tampil sebagai status dan movement baru.

## 9. Layar Stok

Ringkasan berbentuk kartu kecil:
- stok menipis
- kedaluwarsa < 90 hari
- batch expired/karantina
- nilai persediaan

Tabel batch menampilkan produk, batch number, expiry, quantity, HPP, status, dan last movement. Koreksi stok menggunakan drawer dengan alasan wajib dan permission manager.

## 10. Layar Produk

Tabel searchable dengan nama, barcode, generic name, satuan, harga aktif, stok tersedia, dan status aktif. Form produk dipisah menjadi section katalog dan aturan penjualan. Harga pada form adalah harga aktif; harga transaksi tetap snapshot pada sale item.

## 11. Layar Pembelian

Alur ringkas: buat draft pembelian → pilih supplier → tambah item → terima barang → masukkan batch/expiry/HPP → posting penerimaan. Draft dapat diedit; receipt yang sudah diposting tidak diedit, melainkan dikoreksi melalui adjustment/return.

## 12. Responsif

- >= 1200px: sidebar 240px, workspace 2 kolom, panel pembayaran 340px.
- 900–1199px: sidebar 72px dengan tooltip, workspace tetap 2 kolom jika cukup.
- 768–899px: sidebar drawer, hasil produk dan keranjang stacked; payment summary tetap sticky di bawah.
- < 768px: bukan target kasir utama; gunakan single-column dengan keranjang sebagai drawer.

## 13. Design tokens

- Font: satu sans-serif UI yang sangat terbaca; gunakan font proyek yang tersedia, jangan menambah font eksternal tanpa alasan.
- Background: slate sangat muda; surface putih.
- Primary: navy/blue gelap untuk aksi utama dan navigasi aktif.
- Success: hijau untuk pembayaran berhasil.
- Warning: amber untuk stok rendah/kedaluwarsa dekat.
- Destructive: merah untuk void, hapus, dan karantina.
- Border radius sedang; gunakan shadow tipis hanya untuk layer yang benar-benar bertumpuk.
- Ikon bersifat pendamping; semua aksi memiliki label teks atau accessible name.

## 14. Komponen yang diperlukan untuk implementasi

- `AppShell`: sidebar, header, responsive navigation.
- `CheckoutWorkspace`: search, category filters, product results, cart.
- `ProductSearch`: barcode/name input dan result states.
- `CartPanel`: line items, quantity controls, batch disclosure.
- `PaymentSummary`: totals, payment method, checkout CTA.
- `CashPaymentDialog` dan `QrisPaymentDialog`.
- `TransactionSuccess`.
- `StatusBadge`, `EmptyState`, `PermissionGate`, dan `ConfirmAction`.

Komponen harus menerima data/status melalui props atau server state; jangan menaruh aturan FEFO atau perhitungan total hanya di UI.

## 15. Kriteria penerimaan UI/UX

1. Kasir dapat scan/cari produk, menambah quantity, dan melihat total dari satu layar.
2. Checkout tunai menolak nominal kurang dan menghitung kembalian dengan benar.
3. Checkout QRIS menampilkan nominal tepat dan teks konfirmasi manual yang jelas.
4. Tombol bayar tidak dapat diklik dua kali selama request berjalan.
5. Produk unavailable tidak dapat ditambahkan.
6. Alokasi FEFO dapat ditinjau tanpa mengganggu alur normal.
7. Error stok berubah dan server error tidak tampil sebagai sukses.
8. Keyboard focus terlihat dan seluruh alur utama dapat dijalankan tanpa mouse.
9. Layout tetap dapat digunakan pada viewport 842x539 dan tidak memotong CTA pembayaran.
10. Status selalu memiliki label teks selain warna.

## 16. Di luar scope UI V1

- Customer-facing loyalty dashboard.
- Payment provider/webhook otomatis.
- Multi-cabang.
- Modul konseling lengkap.
- Pencetakan label rak.
- Analytics lanjutan dan forecasting.

Dokumen ini adalah spesifikasi UI/UX; implementasi dilakukan setelah spesifikasi ditinjau dan rencana implementasi disetujui.
