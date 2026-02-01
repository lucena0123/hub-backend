-- Add business metrics configuration to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avg_client_lifetime_months DECIMAL(6,1) DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avg_monthly_revenue_per_client DECIMAL(12,2) DEFAULT NULL;
