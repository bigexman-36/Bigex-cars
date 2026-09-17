-- Bigex Cars database schema
-- Run this in the Supabase SQL editor after creating your project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  name text not null,
  year integer not null,
  type text not null,
  fuel text not null,
  price numeric not null,
  mileage integer not null default 0,
  location text not null,
  description text default '',
  image_url text default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected','sold')),
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;

-- Helper: admin status is decided server-side from the profile row, not localStorage.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "public can view approved listings"
on public.listings for select
using (status = 'approved' or seller_id = auth.uid() or public.is_admin());

create policy "signed in sellers can create listings"
on public.listings for insert
to authenticated
with check (seller_id = auth.uid() or public.is_admin());

create policy "owners and admins can update listings"
on public.listings for update
to authenticated
using (seller_id = auth.uid() or public.is_admin())
with check (seller_id = auth.uid() or public.is_admin());

create policy "owners and admins can delete listings"
on public.listings for delete
to authenticated
using (seller_id = auth.uid() or public.is_admin());

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "users can create own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "users manage own favorites"
on public.favorites for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- IMPORTANT: set the designated admin role only after the Google account has authenticated.
-- Replace the email below only if the administrator account changes.
update public.profiles
set role = 'admin'
where lower(email) = lower('igetobiloluwa36@gmail.com');
