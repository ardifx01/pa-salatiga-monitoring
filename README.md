# Smartvinesa v.13 - Monitoring System

Aplikasi monitoring system yang dibangun dengan Next.js dan MySQL untuk Smartvinesa.

## Fitur

- Dashboard monitoring dengan status sistem real-time
- Autentikasi admin dengan NextAuth.js
- Panel administrator untuk mengelola sistem
- Database MySQL untuk menyimpan data pengguna dan sistem
- UI responsif dengan Tailwind CSS
- Animasi dan transisi yang smooth

## Teknologi

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MySQL
- **ORM**: mysql2

## Setup Database

1. Pastikan MySQL server berjalan di localhost
2. Import database schema:
   ```bash
   mysql -u root -p < database/init.sql
   ```

## Instalasi

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update konfigurasi database di `.env.local`

5. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

## Login Default

- **Username**: admin
- **Password**: admin123

## Struktur Database

### Tabel admin_users
- `id` - Primary key
- `username` - Username unik
- `password` - Password terenkripsi (bcrypt)
- `email` - Email pengguna
- `full_name` - Nama lengkap
- `role` - Role pengguna (default: admin)
- `created_at` - Timestamp pembuatan
- `updated_at` - Timestamp update

### Tabel monitoring_systems
- `id` - Primary key
- `name` - Nama sistem
- `description` - Deskripsi sistem
- `status` - Status sistem (active, warning, critical)
- `last_check` - Timestamp pemeriksaan terakhir
- `created_at` - Timestamp pembuatan

## Penggunaan

1. Akses aplikasi di `http://localhost:3000`
2. Login menggunakan kredensial admin
3. Dashboard utama menampilkan status semua sistem
4. Klik "Panel Admin" untuk akses panel administrator
5. Di panel admin dapat mengelola sistem monitoring

## Development

```bash
# Development mode
npm run dev

# Build production
npm run build

# Start production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```
