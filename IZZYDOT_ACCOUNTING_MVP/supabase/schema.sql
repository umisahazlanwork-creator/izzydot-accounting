create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  kind text not null check (kind in ('sales_cash','sales_qr','expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Umum',
  description text not null default '',
  customer text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions(date desc);
create index if not exists transactions_kind_idx on public.transactions(kind);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  invoice_date date not null default current_date,
  customer text not null,
  description text not null default '',
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'Belum Bayar' check (status in ('Belum Bayar','Sudah Bayar','Batal')),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
-- API uses server-side service role key; never expose this key in browser code.
