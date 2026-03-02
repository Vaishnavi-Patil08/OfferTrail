-- Enable Row Level Security (RLS) on all public tables.
-- Run this once in Supabase Dashboard → SQL Editor.
--
-- Your app uses Prisma with the database connection string; that role (e.g. postgres)
-- has BYPASSRLS in Supabase, so Prisma will continue to work. Enabling RLS only
-- restricts access for other roles (e.g. anon key), which is what Supabase warns about.

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ApplicationAnswer" ENABLE ROW LEVEL SECURITY;
