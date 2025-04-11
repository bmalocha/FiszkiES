-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema for FiszkiES application
-- Tables: flashcards, action_logs
-- Types: action_enum
-- Author: AI Assistant
-- Date: 2024-03-20

-- Create custom enum type for action logging
create type public.action_enum as enum (
    'GENERATE',     -- Wygenerowanie propozycji fiszek
    'ADD',          -- Dodanie fiszki do bazy użytkownika
    'DELETE',       -- Usunięcie fiszki przez użytkownika
    'START_SESSION', -- Rozpoczęcie sesji powtarzania
    'END_SESSION'   -- Zakończenie sesji powtarzania
);

-- Create flashcards table
create table public.flashcards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    polish_word varchar(100) not null,
    spanish_word varchar(100) not null,
    example_sentence varchar(300) not null,
    created_at timestamptz not null default now(),

    -- Constraint to prevent duplicate flashcards for the same user
    constraint unique_flashcard_content_for_user unique (user_id, polish_word, spanish_word, example_sentence)
);

-- Add comments for flashcards table
comment on table public.flashcards is 'Stores user-created flashcards with Polish word, Spanish word, and example sentence.';
comment on column public.flashcards.id is 'Primary key for the flashcard.';
comment on column public.flashcards.user_id is 'Foreign key referencing the user who owns the flashcard (from auth.users).';
comment on column public.flashcards.polish_word is 'The word or phrase in Polish.';
comment on column public.flashcards.spanish_word is 'The corresponding word or phrase in Spanish.';
comment on column public.flashcards.example_sentence is 'An example sentence using the Spanish word/phrase.';
comment on column public.flashcards.created_at is 'Timestamp when the flashcard was created.';

-- Create action_logs table
create table public.action_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    action_type public.action_enum not null,
    created_at timestamptz not null default now(),
    related_flashcard_id uuid references public.flashcards(id) on delete set null,
    input_text_length integer null,
    cards_count integer null
);

-- Add comments for action_logs table
comment on table public.action_logs is 'Logs key user actions within the application for future analysis.';
comment on column public.action_logs.id is 'Primary key for the log entry.';
comment on column public.action_logs.user_id is 'Foreign key referencing the user who performed the action (from auth.users).';
comment on column public.action_logs.action_type is 'The type of action performed (e.g., GENERATE, ADD, DELETE).';
comment on column public.action_logs.created_at is 'Timestamp when the action occurred.';
comment on column public.action_logs.related_flashcard_id is 'Optional foreign key linking the action to a specific flashcard (e.g., for ADD, DELETE actions).';
comment on column public.action_logs.input_text_length is 'Length of the input text used in a GENERATE action.';
comment on column public.action_logs.cards_count is 'Number of cards involved in the action (e.g., generated in GENERATE, included in START_SESSION).';

-- Create indexes
create index idx_flashcards_user_id on public.flashcards (user_id);
create index idx_action_logs_user_id on public.action_logs (user_id);
create index idx_action_logs_related_flashcard_id on public.action_logs (related_flashcard_id);
create index idx_action_logs_created_at on public.action_logs (created_at);

-- Enable Row Level Security (RLS)
alter table public.flashcards enable row level security;

-- RLS Policies for flashcards table
create policy "Allow authenticated users to SELECT their own flashcards"
    on public.flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Allow authenticated users to INSERT flashcards for themselves"
    on public.flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Allow authenticated users to DELETE their own flashcards"
    on public.flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant usage on type public.action_enum to authenticated;
grant select, insert, delete on table public.flashcards to authenticated;
grant select, insert on table public.action_logs to authenticated; 