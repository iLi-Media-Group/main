-- Create table for secure service onboarding links
CREATE TABLE IF NOT EXISTS service_onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  service_type text,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_onboarding_tokens_email ON service_onboarding_tokens(email);
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tokens_token ON service_onboarding_tokens(token); 