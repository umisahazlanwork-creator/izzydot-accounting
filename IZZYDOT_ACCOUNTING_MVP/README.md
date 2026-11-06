# IZZYDOT ACCOUNTING
MVP sistem akaun web untuk deploy ke Vercel dengan Supabase.

## Modul
- Dashboard ringkasan jualan, perbelanjaan dan baki bersih
- Rekod transaksi: jualan tunai, jualan QR, duit keluar
- Invois pelanggan asas
- Laporan mengikut tarikh dan eksport CSV
- Tetapan syarikat ringkas

## Stack
Next.js App Router, TypeScript, Supabase Postgres, Vercel.

## Penting sebelum deploy
Sistem ini ialah starter MVP. Tetapkan `SUPABASE_SERVICE_ROLE_KEY` hanya di Vercel Environment Variables (server-side), jangan letak dalam kod atau `NEXT_PUBLIC_` variable. Tambah `IZZYDOT_ACCESS_CODE` sebagai kod akses. Aplikasi menggunakan kod akses bersama untuk melindungi API daripada capaian biasa tanpa kod. Ini bukan sistem akaun pengguna individu atau audit log; hadkan perkongsian kod dan jangan dedahkan key Supabase.

## Setup
1. Buat repo GitHub bernama `izzydot-accounting`, upload semua fail ini.
2. Import repo di Vercel.
3. Tambah Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL project Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = service role/secret key server-side
   - `IZZYDOT_ACCESS_CODE` = kod akses pilihan
4. Run SQL dalam `supabase/schema.sql` di Supabase SQL Editor.
5. Redeploy Vercel.

## Debugging
Jika API memulangkan 500, lihat Vercel > Project > Logs / Runtime Logs. API akan memulangkan mesej error ringkas dalam JSON untuk membantu mengenal pasti punca. Jangan kongsi service role key atau screenshot yang mendedahkan key.
