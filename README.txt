EL CARAMELO PHOTOBOOTH
======================

FITUR
- Halaman pembuka dengan tombol START PHOTOBOOTH.
- Pilihan layout 1 foto, 2 foto (strip), dan 4 foto (kolase).
- Kamera webcam dengan hitung mundur 3 detik untuk setiap jepretan.
- Bingkai warna caramel, logo El Caramelo, dan dua gambar dekorasi.
- Preview, download langsung, dan QR Code untuk mengunduh dari HP.
- Foto disimpan di folder photos pada komputer/server.

CARA MENJALANKAN
1. Ekstrak ZIP.
2. Install Node.js dari https://nodejs.org/ jika belum ada.
3. Buka folder project ini di VS Code.
4. Buka Terminal, jalankan:
      npm install
      npm start
5. Buka Chrome: http://localhost:3000
6. Izinkan akses kamera.

PENGGUNAAN QR DENGAN HP
Agar QR dapat dibuka dari HP:
1. Sambungkan komputer dan HP ke Wi-Fi yang sama.
2. Cari alamat IPv4 komputer (Windows: buka CMD, ketik ipconfig, lihat IPv4 Address).
3. Buka di HP: http://ALAMAT-IP-KOMPUTER:3000 untuk memastikan bisa diakses.
4. Jika QR yang muncul masih memakai localhost, jalankan server dengan PUBLIC_BASE_URL.

Windows PowerShell:
   $env:PUBLIC_BASE_URL="http://192.168.1.10:3000"; npm start

Ganti 192.168.1.10 dengan IPv4 komputer kamu.
Pastikan firewall Windows mengizinkan Node.js pada jaringan Private.
Untuk akses dari internet atau perangkat beda jaringan, deploy ke hosting HTTPS.

CATATAN
- QR Code membutuhkan koneksi internet saat library QR dimuat dari CDN.
- Browser hanya mengizinkan kamera pada localhost atau halaman HTTPS.
- Foto yang tersimpan berada di folder photos. Hapus secara berkala jika tidak ingin menyimpan foto lama.
- Ini versi lokal satu komputer; untuk penggunaan event banyak perangkat, gunakan hosting/server yang selalu online.

QR CODE LEBIH BESAR
- QR Code pada panel hasil kini diperbesar (180 px; tampilan mobile 140 px).
- Pastikan QR terlihat jelas di layar dan jangan memperkecil tampilan browser terlalu jauh.
- Untuk scan paling mudah, tingkatkan brightness layar dan arahkan kamera HP tegak lurus ke QR.
