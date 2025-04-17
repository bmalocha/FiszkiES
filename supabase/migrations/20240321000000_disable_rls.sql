-- Migration: Disable RLS
-- Description: Disables Row Level Security and drops related policies
-- Author: AI Assistant
-- Date: 2024-03-21

-- Drop RLS policies for flashcards table
drop policy if exists "Allow authenticated users to SELECT their own flashcards" on public.flashcards;
drop policy if exists "Allow authenticated users to INSERT flashcards for themselves" on public.flashcards;
drop policy if exists "Allow authenticated users to DELETE their own flashcards" on public.flashcards;

-- Disable RLS on flashcards table
alter table public.flashcards disable row level security; 