-- =========================================================================
-- TLORA Studio Database Schema Optimization Migration
-- Run this in your Supabase SQL Editor to clean up redundancies,
-- fix foreign key cascading behaviors, and optimize database indexes.
-- =========================================================================

-- 1. DROP REDUNDANT TABLES
DROP TABLE IF EXISTS public.tlora_license_keys CASCADE;
DROP TABLE IF EXISTS public.tlora_admin_users CASCADE;
DROP TABLE IF EXISTS public.user_drive_accounts CASCADE;

-- 2. DROP REDUNDANT COLUMNS
ALTER TABLE public.posts DROP COLUMN IF EXISTS cover_url;
ALTER TABLE public.customer_galleries DROP COLUMN IF EXISTS customer_id;
ALTER TABLE public.customer_galleries DROP COLUMN IF EXISTS studio_order_id;

-- 3. FIX UNIQUE CONSTRAINTS FOR MULTI-TENANT BLOG POSTS
-- Remove direct unique constraint on slug to allow matching slugs in different studios
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_slug_key;

-- Create unique index per studio (non-null studio)
DROP INDEX IF EXISTS public.posts_studio_slug_unique_idx;
CREATE UNIQUE INDEX posts_studio_slug_unique_idx
  ON public.posts(studio_id, lower(slug)) WHERE studio_id IS NOT NULL;

-- Create unique index for platform posts (null studio)
DROP INDEX IF EXISTS public.posts_null_studio_slug_unique_idx;
CREATE UNIQUE INDEX posts_null_studio_slug_unique_idx
  ON public.posts(lower(slug)) WHERE studio_id IS NULL;

-- 4. OPTIMIZE UNIQUE CONSTRAINTS FOR WEDDING INVITATIONS
DROP INDEX IF EXISTS public.wedding_invitations_studio_slug_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS wedding_invitations_studio_slug_uidx
  ON public.wedding_invitations(studio_id, slug) WHERE studio_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wedding_invitations_null_studio_slug_uidx
  ON public.wedding_invitations(slug) WHERE studio_id IS NULL;

-- 5. RE-DEFINE FOREIGN KEY CONSTRAINTS WITH CASCADE/SET-NULL BEHAVIORS

-- public.profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_default_studio_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_default_studio_id_fkey 
  FOREIGN KEY (default_studio_id) REFERENCES public.studios(id) ON DELETE SET NULL;

-- public.customer_galleries
ALTER TABLE public.customer_galleries DROP CONSTRAINT IF EXISTS customer_galleries_studio_id_fkey;
ALTER TABLE public.customer_galleries ADD CONSTRAINT customer_galleries_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.customer_galleries DROP CONSTRAINT IF EXISTS customer_galleries_created_by_fkey;
ALTER TABLE public.customer_galleries ADD CONSTRAINT customer_galleries_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- public.posts
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_studio_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

-- public.albums & public.album_photos
ALTER TABLE public.albums DROP CONSTRAINT IF EXISTS albums_customer_id_fkey;
ALTER TABLE public.albums ADD CONSTRAINT albums_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.albums DROP CONSTRAINT IF EXISTS albums_studio_id_fkey;
ALTER TABLE public.albums ADD CONSTRAINT albums_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.album_photos DROP CONSTRAINT IF EXISTS album_photos_album_id_fkey;
ALTER TABLE public.album_photos ADD CONSTRAINT album_photos_album_id_fkey 
  FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;

-- public.ai_requests & public.wallet_transactions
ALTER TABLE public.ai_requests DROP CONSTRAINT IF EXISTS ai_requests_user_id_fkey;
ALTER TABLE public.ai_requests ADD CONSTRAINT ai_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_requests DROP CONSTRAINT IF EXISTS ai_requests_studio_id_fkey;
ALTER TABLE public.ai_requests ADD CONSTRAINT ai_requests_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_studio_id_fkey;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

-- public.devices
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_license_id_fkey;
ALTER TABLE public.devices ADD CONSTRAINT devices_license_id_fkey 
  FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE;

ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_user_id_fkey;
ALTER TABLE public.devices ADD CONSTRAINT devices_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.studio_payment_orders
ALTER TABLE public.studio_payment_orders DROP CONSTRAINT IF EXISTS studio_payment_orders_studio_id_fkey;
ALTER TABLE public.studio_payment_orders ADD CONSTRAINT studio_payment_orders_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE SET NULL;

ALTER TABLE public.studio_payment_orders DROP CONSTRAINT IF EXISTS studio_payment_orders_license_id_fkey;
ALTER TABLE public.studio_payment_orders ADD CONSTRAINT studio_payment_orders_license_id_fkey 
  FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE SET NULL;

ALTER TABLE public.studio_payment_orders DROP CONSTRAINT IF EXISTS studio_payment_orders_owner_user_id_fkey;
ALTER TABLE public.studio_payment_orders ADD CONSTRAINT studio_payment_orders_owner_user_id_fkey 
  FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- public.license_renewal_orders
ALTER TABLE public.license_renewal_orders DROP CONSTRAINT IF EXISTS license_renewal_orders_license_id_fkey;
ALTER TABLE public.license_renewal_orders ADD CONSTRAINT license_renewal_orders_license_id_fkey 
  FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE;

ALTER TABLE public.license_renewal_orders DROP CONSTRAINT IF EXISTS license_renewal_orders_user_id_fkey;
ALTER TABLE public.license_renewal_orders ADD CONSTRAINT license_renewal_orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- public.wedding_invitations
ALTER TABLE public.wedding_invitations DROP CONSTRAINT IF EXISTS wedding_invitations_studio_id_fkey;
ALTER TABLE public.wedding_invitations ADD CONSTRAINT wedding_invitations_studio_id_fkey 
  FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE CASCADE;

ALTER TABLE public.wedding_invitations DROP CONSTRAINT IF EXISTS wedding_invitations_created_by_fkey;
ALTER TABLE public.wedding_invitations ADD CONSTRAINT wedding_invitations_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
