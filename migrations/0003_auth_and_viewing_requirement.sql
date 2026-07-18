PRAGMA foreign_keys = ON;

ALTER TABLE properties ADD COLUMN viewing_requirement TEXT NOT NULL DEFAULT 'email_verified'
  CHECK (viewing_requirement IN ('email_verified', 'identity_verified'));

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE email_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policy_versions (
  id TEXT PRIMARY KEY,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'member_rules', 'document_notice')),
  version TEXT NOT NULL,
  published_at TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  requires_reconsent INTEGER NOT NULL DEFAULT 0 CHECK (requires_reconsent IN (0, 1)),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (policy_type, version)
);

CREATE TABLE user_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version_id TEXT NOT NULL REFERENCES policy_versions(id),
  source TEXT NOT NULL CHECK (source IN ('registration', 'reconsent', 'document_upload')),
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  withdrawn_at TEXT
);

CREATE TABLE property_viewing_requirement_events (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  changed_by_user_id TEXT NOT NULL REFERENCES users(id),
  from_requirement TEXT NOT NULL CHECK (from_requirement IN ('email_verified', 'identity_verified')),
  to_requirement TEXT NOT NULL CHECK (to_requirement IN ('email_verified', 'identity_verified')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
