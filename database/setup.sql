-- Run this entire file in the Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- Create the guests table
CREATE TABLE IF NOT EXISTS guests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id    UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(30),
  checked_in   BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index so ticket lookups are instant even with 200+ rows
CREATE INDEX IF NOT EXISTS idx_guests_ticket_id ON guests(ticket_id);

-- Enable Row Level Security (best practice)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- The backend uses the service role key which bypasses RLS — no extra policies needed.
-- Verify the table was created:
SELECT COUNT(*) FROM guests;
