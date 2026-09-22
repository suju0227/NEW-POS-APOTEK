# POS Apotek Risyah — Spesifikasi Desain Alur Bisnis dan Database

**Status:** Draft untuk review
**Scope:** MVP satu cabang apotek
**Tanggal:** 22 September 2026

## 1. Tujuan

Membangun sistem POS dan persediaan untuk satu cabang Apotek Risyah yang memprioritaskan transaksi kasir cepat, stok berbasis batch dan kedaluwarsa, perhitungan HPP historis, serta histori perubahan yang dapat diaudit.

MVP menggunakan pembayaran tunai/manual. QRIS disiapkan tanpa payment gateway: admin memasukkan payload QRIS statis, sistem memvalidasi TLV dan CRC16, lalu menghasilkan payload QR dinamis dengan nominal transaksi. QRIS tidak dianggap lunas otomatis; kasir tetap mengonfirmasi dana masuk secara manual.

## 2. Batasan MVP

### Termasuk

- Satu cabang dan satu lokasi stok.
- Autentikasi pengguna dan permission berbasis peran.
- Katalog produk, kategori, satuan, barcode, dan status obat resep.
- Batch dengan nomor batch, tanggal kedaluwarsa, harga beli, dan kuantitas.
- Penerimaan pembelian yang menambah stok.
- Penjualan kasir dengan alokasi FEFO dan dukungan satu item dari beberapa batch.
- Pembayaran tunai dan QRIS manual-confirmation.
- Retur penjualan dengan kontrol batch dan karantina.
- Stock opname dan penyesuaian stok beralasan.
- Audit log untuk aksi sensitif.
- Laporan penjualan, stok menipis, kedaluwarsa, dan margin dasar.

### Ditunda

- Multi-cabang dan transfer antar-cabang.
- Payment gateway, webhook, dan rekonsiliasi otomatis.
- Reservasi stok untuk resep.
- Modul konseling dan rekam medis.
- Akuntansi lengkap, hutang supplier, loyalty, promosi kompleks, dan marketplace.

## 3. Prinsip domain

1. **Stok tidak boleh diedit langsung.** Semua perubahan berasal dari penerimaan, penjualan, retur yang disetujui, opname, atau penyesuaian beralasan.
2. **Histori immutable.** Sale, payment, batch allocation, dan stock movement tidak dihapus; pembatalan memakai status dan reversal movement.
3. **FEFO.** Batch dengan tanggal kedaluwarsa terdekat yang masih layak jual dialokasikan lebih dahulu. Batch kedaluwarsa atau dikarantina tidak tersedia untuk penjualan.
4. **Nominal rupiah integer.** Semua nilai uang disimpan sebagai `BIGINT` rupiah, bukan floating point.
5. **Snapshot transaksi.** Nama produk, barcode, harga jual, diskon, HPP, dan batch yang dipakai disalin ke detail transaksi agar laporan historis tidak berubah ketika katalog diedit.
6. **Transisi status tervalidasi.** Status tidak boleh dilompati oleh client dan setiap transisi sensitif dicatat.
7. **Scope satu cabang.** Tidak ada `branch_id` pada MVP; struktur dapat ditambah saat multi-cabang benar-benar dibutuhkan.

## 4. Peran dan permission

| Peran | Tanggung jawab utama |
|---|---|
| Admin | Pengguna, katalog, konfigurasi QRIS, dan pengaturan sistem |
| Manager | Pembelian, retur, opname, penyesuaian, laporan margin |
| Kasir | Penjualan, pembayaran, cetak/kirim struk, konfirmasi pembayaran QRIS |
| Apoteker | Verifikasi obat resep dan pengecualian penjualan resep |

Permission minimum:

- `catalog.manage`
- `stock.view`
- `stock.receive`
- `stock.adjust`
- `stock.opname`
- `sale.create`
- `sale.void`
- `sale.return`
- `payment.confirm`
- `purchase.manage`
- `report.view`
- `report.profit`
- `qris.manage`
- `user.manage`
- `audit.view`

UI boleh menyembunyikan aksi, tetapi server action/API wajib memeriksa permission. `stock.adjust`, `sale.void`, `sale.return`, `qris.manage`, dan `user.manage` membutuhkan role yang sesuai serta alasan atau catatan.

## 5. Alur bisnis utama

### 5.1 Katalog dan batch

1. Admin membuat produk aktif dengan SKU, barcode, nama generik, merek, bentuk sediaan, kekuatan, kategori, satuan dasar, harga jual aktif, dan penanda `requiresPrescription`.
2. Saat barang diterima, user memilih produk lalu membuat batch dengan nomor batch, kedaluwarsa, harga beli per satuan dasar, dan jumlah diterima.
3. Sistem menolak batch dengan tanggal kedaluwarsa sebelum tanggal berjalan, nomor batch kosong, atau kuantitas non-positif.
4. Sistem membuat `StockMovement(RECEIPT)` dan memperbarui kuantitas batch dalam transaksi database.

### 5.2 Penjualan kasir

1. Kasir memindai barcode atau mencari produk.
2. Sistem mengambil harga aktif dan ketersediaan agregat dari batch layak jual.
3. Kasir memasukkan jumlah, lalu sistem mengalokasikan batch menggunakan FEFO. Jika satu batch tidak cukup, item dipecah ke beberapa `SaleBatchAllocation`.
4. Sistem membuat sale berstatus `DRAFT` dan menghitung subtotal, diskon, pajak jika kelak diperlukan, serta total.
5. Kasir memilih tunai atau QRIS.
6. Untuk tunai, kasir memasukkan jumlah diterima. Sistem menolak jumlah kurang dari total.
7. Untuk QRIS, sistem menghasilkan payload dinamis dari konfigurasi QRIS tervalidasi dan membuat payment `PENDING`.
8. Setelah dana tunai diterima atau QRIS diverifikasi manual, transaksi diproses secara atomik: payment `PAID`, sale `PAID`, kuantitas batch berkurang, dan movement `SALE` dibuat.
9. Sistem menerbitkan nomor struk. Sale `PAID` tidak diedit; koreksi dilakukan melalui void atau retur.

**Concurrency:** proses finalisasi wajib berada dalam satu database transaction dengan row lock pada batch yang dialokasikan. Sistem menghitung ulang stok setelah lock; jika stok berubah dan tidak cukup, finalisasi gagal tanpa mengurangi stok atau membuat payment lunas.

### 5.3 Pembelian dan penerimaan

1. Manager membuat purchase `DRAFT` berisi supplier dan item.
2. Saat barang datang, user memeriksa jumlah, batch, kedaluwarsa, dan harga beli.
3. Penerimaan mengubah purchase menjadi `RECEIVED`, membuat atau memperbarui batch, lalu membuat movement `RECEIPT` dalam satu transaksi.
4. Purchase yang sudah `RECEIVED` tidak diedit. Koreksi memakai pembatalan/reversal dengan permission manager.

Status purchase: `DRAFT → RECEIVED → CANCELLED`.

### 5.4 Retur penjualan

1. Kasir mencari sale `PAID` dan memilih item serta jumlah yang dikembalikan.
2. Sistem menolak jumlah yang melebihi jumlah terjual dikurangi jumlah yang sudah diretur.
3. Manager/apoteker memilih hasil pemeriksaan: `RESTOCK` atau `QUARANTINE`.
4. Barang `RESTOCK` hanya boleh kembali ke batch asal dan stok layak jual jika kemasan, kondisi, dan rantai penyimpanan memenuhi pemeriksaan.
5. Barang `QUARANTINE` tidak menambah `availableQuantity`; movement tetap dicatat dengan tujuan karantina.
6. Sistem membuat refund/credit record manual dan reversal movement bila berlaku.

Status return: `DRAFT → APPROVED → COMPLETED` atau `CANCELLED`.

### 5.5 Stock opname dan penyesuaian

1. Manager membuat opname dengan snapshot kuantitas sistem per batch.
2. Petugas memasukkan kuantitas fisik dan alasan selisih.
3. Manager menyetujui hasil.
4. Sistem membuat movement `OPNAME_IN` atau `OPNAME_OUT` untuk selisih; tidak ada penghapusan movement lama.

Status opname: `DRAFT → COUNTED → APPROVED → POSTED`.

### 5.6 QRIS statis ke QR dinamis

1. Admin memasukkan satu string QRIS statis dari provider.
2. Validator memeriksa TLV secara rekursif untuk tag template, panjang dua digit, batas payload, tag wajib, dan satu tag CRC `63` sepanjang empat karakter.
3. Validator menghitung CRC16-CCITT-FALSE pada seluruh payload sebelum nilai CRC, termasuk `6304`, lalu membandingkannya dengan nilai CRC.
4. Sistem menolak payload rusak, CRC salah, format bukan QRIS yang didukung, atau payload yang sudah mengandung nominal dinamis yang tidak dapat dipastikan.
5. Payload tervalidasi disimpan terenkripsi atau melalui secret management yang tersedia. Nilai mentah tidak ditampilkan pada log.
6. Saat checkout QRIS, sistem menghapus CRC lama, menambahkan/mengganti tag nominal `54` dengan nominal rupiah tanpa pemisah, lalu menghitung CRC baru.
7. Payload hasil disimpan sebagai snapshot pada payment `PENDING`.
8. QR dinamis hanya bukti instruksi pembayaran. Kasir menekan konfirmasi setelah melihat dana masuk. Jika tidak dibayar, payment dapat `EXPIRED` atau `CANCELLED` tanpa mengubah stok.

## 6. Model data

Semua tabel memiliki `id UUID`, `created_at`, dan `updated_at` kecuali tabel histori yang immutable. Timestamp disimpan UTC dan ditampilkan dalam zona waktu `Asia/Jakarta`.

### User dan akses

`users`
- `id`, `name`, `email` unik, `password_hash`, `is_active`, `last_login_at`.

`roles`
- `id`, `code` unik, `name`.

`permissions`
- `id`, `code` unik, `name`.

`user_roles`
- `user_id`, `role_id`, unique gabungan.

`role_permissions`
- `role_id`, `permission_id`, unique gabungan.

### Katalog

`categories`
- `id`, `name`, `is_active`.

`products`
- `id`, `sku` unik, `barcode` unik nullable, `generic_name`, `brand_name`, `name`, `dosage_form`, `strength`, `requires_prescription`, `minimum_stock`, `is_active`.

`product_units`
- `id`, `product_id`, `unit_name`, `conversion_to_base` positif, `sale_price_rupiah` BIGINT, `is_default`, `barcode` unik nullable.

MVP menetapkan satu `product_unit` default untuk penjualan dan pembelian. Konversi multi-satuan disimpan agar model tidak perlu dirombak, tetapi UI hanya mengaktifkan konversi yang benar-benar dibutuhkan.

### Batch dan persediaan

`batches`
- `id`, `product_id`, `batch_number`, `expires_on`, `purchase_price_rupiah`, `received_quantity`, `available_quantity`, `quarantine_quantity`, `status` (`AVAILABLE`, `EXPIRED`, `QUARANTINED`, `DEPLETED`), unique `(product_id, batch_number)`.

`stock_movements`
- `id`, `product_id`, `batch_id`, `type` (`RECEIPT`, `SALE`, `RETURN_RESTOCK`, `RETURN_QUARANTINE`, `OPNAME_IN`, `OPNAME_OUT`, `VOID_REVERSAL`), `quantity_delta`, `reference_type`, `reference_id`, `reason`, `created_by`.

`stock_movements` immutable. `available_quantity` tidak boleh negatif dan harus konsisten dengan movement yang sudah diposting.

### Pembelian

`purchases`
- `id`, `purchase_number` unik, `supplier_name`, `status`, `received_at`, `received_by`, `notes`.

`purchase_items`
- `id`, `purchase_id`, `product_id`, `product_unit_id`, `quantity`, `unit_cost_rupiah`, `line_total_rupiah`, `batch_id` nullable.

### Penjualan dan pembayaran

`sales`
- `id`, `sale_number` unik, `status` (`DRAFT`, `PAID`, `VOID`, `PARTIALLY_RETURNED`, `RETURNED`), `subtotal_rupiah`, `discount_rupiah`, `total_rupiah`, `cashier_id`, `paid_at`, `voided_at`, `void_reason`.

`sale_items`
- `id`, `sale_id`, `product_id`, `product_name_snapshot`, `barcode_snapshot`, `quantity`, `unit_price_rupiah`, `discount_rupiah`, `hpp_rupiah`, `line_total_rupiah`, `requires_prescription_snapshot`.

`sale_batch_allocations`
- `id`, `sale_item_id`, `batch_id`, `quantity`, `purchase_price_snapshot_rupiah`.

`payments`
- `id`, `sale_id` unik, `method` (`CASH`, `QRIS`), `status` (`PENDING`, `PAID`, `FAILED`, `EXPIRED`, `CANCELLED`, `REFUNDED`), `amount_rupiah`, `cash_received_rupiah` nullable, `change_rupiah` nullable, `qris_payload_snapshot` nullable, `confirmed_by`, `confirmed_at`, `expires_at`.

V2 menambahkan field provider/reference bila diperlukan tanpa mengubah alur sale: `provider`, `provider_reference`, `provider_metadata`.

### Retur, opname, dan audit

`returns`
- `id`, `return_number` unik, `sale_id`, `status`, `reason`, `inspection_result`, `requested_by`, `approved_by`, `completed_at`.

`return_items`
- `id`, `return_id`, `sale_item_id`, `batch_id`, `quantity`, `disposition` (`RESTOCK`, `QUARANTINE`), `refund_amount_rupiah`.

`stocktakes`
- `id`, `stocktake_number` unik, `status`, `started_by`, `approved_by`, `posted_at`.

`stocktake_items`
- `id`, `stocktake_id`, `batch_id`, `system_quantity`, `physical_quantity`, `difference_quantity`, `reason`.

`audit_logs`
- `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `reason`, `ip_address`, `created_at`.

`qris_settings`
- `id`, `provider_name`, `static_payload_ciphertext`, `merchant_name`, `is_active`, `validated_at`, `validated_by`, `updated_by`.

## 7. Constraint dan indeks wajib

- Unique: email, role/permission code, SKU, barcode aktif, sale number, purchase number, return number, stocktake number.
- Check: semua quantity positif pada input, `available_quantity >= 0`, uang tidak negatif, tanggal batch valid, payment amount sama dengan sale total.
- Foreign key wajib untuk semua relasi transaksi dan histori.
- Index `batches(product_id, status, expires_on)` untuk FEFO.
- Index `products(barcode)` dan `products(sku)` untuk kasir.
- Index `stock_movements(product_id, created_at)` untuk kartu stok.
- Index `sales(created_at, status)` dan `payments(status, expires_at)` untuk laporan serta pembersihan payment pending.
- Partial unique index untuk satu QRIS aktif.

## 8. Kontrak transaksi server

### Finalisasi penjualan

Input: `saleId`, `paymentMethod`, `cashReceived` untuk tunai atau konfirmasi QRIS.

Urutan:

1. Validasi session dan permission.
2. Lock sale draft dan batch allocation.
3. Hitung ulang total dari snapshot server-side.
4. Validasi stok tersedia dan status batch.
5. Validasi payment amount sama dengan total.
6. Update payment dan sale.
7. Kurangi kuantitas batch.
8. Insert sale movements.
9. Insert audit log bila QRIS dikonfirmasi, diskon manual, atau ada override.
10. Commit; jika satu langkah gagal, rollback seluruhnya.

Operasi harus idempotent: finalisasi sale yang sudah `PAID` mengembalikan hasil sebelumnya dan tidak membuat movement kedua.

### Perubahan konfigurasi QRIS

Hanya admin dengan `qris.manage` yang dapat mengganti payload. Validasi dilakukan sebelum penyimpanan. Perubahan menonaktifkan konfigurasi lama setelah konfigurasi baru berhasil divalidasi dan dicatat dalam audit log.

## 9. Validasi dan error domain

- `INSUFFICIENT_STOCK`: stok batch tidak cukup setelah lock.
- `EXPIRED_BATCH`: batch tidak layak jual.
- `INVALID_STATE_TRANSITION`: status tidak dapat diubah dari state saat ini.
- `PAYMENT_AMOUNT_MISMATCH`: nominal payment berbeda dari sale.
- `QRIS_INVALID_TLV`: struktur tag/length/value tidak valid.
- `QRIS_INVALID_CRC`: checksum tidak cocok.
- `RETURN_QUANTITY_EXCEEDED`: jumlah retur melebihi sisa yang dapat diretur.
- `FORBIDDEN`: permission tidak memadai.

Pesan untuk user harus aman dan dapat dipahami; detail query, payload QRIS mentah, dan secret tidak boleh masuk response atau log.

## 10. Laporan MVP

- Penjualan harian: gross sales, diskon, net sales, jumlah transaksi, metode pembayaran.
- Margin dasar: net sales dikurangi HPP snapshot `sale_items.hpp_rupiah`.
- Stok saat ini per produk dan batch.
- Batch mendekati kedaluwarsa dengan filter rentang hari.
- Produk di bawah minimum stock.
- Kartu stok berdasarkan movement.
- Retur dan penyesuaian berdasarkan periode dan user.

Laporan profit tidak menghitung ulang HPP dari harga katalog saat ini.

## 11. Non-functional requirements

- Zona waktu bisnis: `Asia/Jakarta`; penyimpanan timestamp UTC.
- Format tampilan uang: Rupiah tanpa floating point.
- Semua operasi mutasi memakai server action/route yang tervalidasi; client tidak dipercaya.
- Password menggunakan hashing library yang sesuai; session cookie HttpOnly, Secure, dan SameSite sesuai environment.
- Audit log tersedia bagi admin/manager dan tidak dapat dihapus melalui UI.
- Pencarian barcode harus menjadi jalur utama kasir; endpoint daftar memakai pagination.
- Backup database terjadwal dan prosedur restore harus diuji sebelum produksi.
- Error aplikasi dicatat tanpa data pribadi berlebihan atau payload QRIS mentah.
- Checkout finalisasi harus atomic dan aman terhadap double-submit.

## 12. Urutan implementasi

1. Schema inti, migration, user/role/permission, dan audit foundation.
2. Katalog, product unit, batch, stock movement, serta penerimaan pembelian.
3. Kasir: cart, FEFO, sale snapshot, payment tunai, dan receipt.
4. QRIS validator/generator sebagai modul terisolasi dengan test TLV/CRC.
5. Retur, stock opname, dan penyesuaian.
6. Laporan MVP dan hardening concurrency/idempotency.
7. Resep dan fitur lanjutan setelah alur stok/transaksi stabil.

## 13. Kriteria penerimaan MVP

- Dua transaksi simultan tidak dapat menjual unit batch yang sama melebihi stok.
- Penjualan memakai batch kedaluwarsa atau karantina selalu ditolak.
- Satu item dapat dialokasikan ke beberapa batch secara FEFO.
- Sale `PAID` selalu memiliki payment `PAID`, allocation, dan stock movement yang konsisten.
- Double-submit finalisasi tidak menggandakan pengurangan stok.
- Retur tidak dapat melebihi jumlah terjual dan tidak otomatis membuat obat layak jual.
- Payload QRIS invalid TLV atau CRC ditolak sebelum disimpan.
- Payload QR dinamis memiliki nominal yang benar dan CRC baru yang valid.
- Laporan historis tetap konsisten setelah harga katalog berubah.
- User tanpa permission tidak dapat menjalankan aksi sensitif meski memanggil endpoint secara langsung.

## 14. Keputusan yang sengaja ditunda

- Payment gateway dan webhook otomatis.
- Multi-cabang.
- Reservasi stok resep.
- Pajak kompleks dan promosi bertingkat.
- Supplier master dan hutang dagang.
- Akuntansi double-entry.
- Offline-first/PWA penuh.

Keputusan ini dapat ditambahkan setelah metrik transaksi, stok, dan kebutuhan operasional nyata tersedia; tidak menjadi bagian dari MVP.
