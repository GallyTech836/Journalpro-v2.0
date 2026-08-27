/*
# Create trades and settings tables for JournalPRO

1. New Tables
- `trades`: stores individual trading operations (journal entries).
  - id (uuid, PK), date, time, timestamp, asset, account_type, side, type,
    setup, session, entry, stop_loss, take_profit, size, risk_amount, pnl,
    notes, screenshot_url, has_partial, partial_tp, final_tp, partial_percent,
    r_result, created_at.
- `settings`: single-row config for the app (assets, setups, sessions, accounts, starting balance).
  - id (int, PK, always 1), assets (jsonb), setups (jsonb), sessions (jsonb),
    accounts (jsonb), starting_balance (numeric), updated_at.

2. Security
- Enable RLS on both tables.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '12:00',
  timestamp bigint NOT NULL DEFAULT 0,
  asset text NOT NULL DEFAULT 'XAUUSD',
  account_type text NOT NULL DEFAULT 'Real',
  side text NOT NULL DEFAULT 'Buy',
  type text NOT NULL DEFAULT 'Win',
  setup text NOT NULL DEFAULT 'Otro',
  session text NOT NULL DEFAULT 'New York',
  entry text NOT NULL DEFAULT '',
  stop_loss text NOT NULL DEFAULT '',
  take_profit text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  risk_amount text NOT NULL DEFAULT '',
  pnl numeric,
  notes text NOT NULL DEFAULT '',
  screenshot_url text NOT NULL DEFAULT '',
  has_partial boolean NOT NULL DEFAULT false,
  partial_tp numeric NOT NULL DEFAULT 1.5,
  final_tp numeric NOT NULL DEFAULT 3.0,
  partial_percent integer NOT NULL DEFAULT 50,
  r_result numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trades" ON trades;
CREATE POLICY "anon_select_trades" ON trades FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
CREATE POLICY "anon_insert_trades" ON trades FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trades" ON trades;
CREATE POLICY "anon_update_trades" ON trades FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "anon_delete_trades" ON trades FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  assets jsonb NOT NULL DEFAULT '["XAUUSD","EURUSD","USDJPY","EURJPY"]'::jsonb,
  setups jsonb NOT NULL DEFAULT '["Fibonacci","Manipulación"]'::jsonb,
  sessions jsonb NOT NULL DEFAULT '["London","New York","Asia"]'::jsonb,
  accounts jsonb NOT NULL DEFAULT '["Real","Demo","Backtesting"]'::jsonb,
  starting_balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed default settings row
INSERT INTO settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
