-- Run this once in Supabase SQL Editor.
alter table public.listings
  add column if not exists seller_name text default '',
  add column if not exists phone text default '',
  add column if not exists email text default '';

-- Seller contact details are shown only for approved listings.
