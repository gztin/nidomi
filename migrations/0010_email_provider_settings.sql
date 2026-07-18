PRAGMA foreign_keys=ON;

CREATE TABLE email_provider_settings (
  provider TEXT PRIMARY KEY CHECK (provider IN ('resend')),
  api_key_ciphertext TEXT NOT NULL,
  api_key_iv TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  updated_by_user_id TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
