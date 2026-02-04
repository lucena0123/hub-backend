-- Add Meta Ad Account ID to clients (Meta Ads configuration per client)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS "metaAdAccountId" TEXT;

