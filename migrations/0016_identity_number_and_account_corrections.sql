PRAGMA foreign_keys = ON;

ALTER TABLE identity_verification_submissions ADD COLUMN identity_number_ciphertext TEXT;
ALTER TABLE identity_verification_submissions ADD COLUMN identity_number_iv TEXT;
ALTER TABLE identity_verification_submissions ADD COLUMN identity_number_lookup_hmac TEXT;
ALTER TABLE identity_verification_submissions ADD COLUMN identity_number_masked TEXT;

CREATE TABLE identity_verified_claims (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL UNIQUE REFERENCES identity_verification_submissions(id),
  identity_number_lookup_hmac TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX identity_submission_lookup_hmac
ON identity_verification_submissions(identity_number_lookup_hmac);
