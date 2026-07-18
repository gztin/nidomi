PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN identity_verified_at TEXT;
ALTER TABLE profiles ADD COLUMN legal_name TEXT;

CREATE TABLE identity_verification_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'changes_requested', 'approved', 'rejected', 'revoked')),
  notice_version TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  revoked_at TEXT,
  UNIQUE (user_id, version_number)
);

CREATE UNIQUE INDEX one_active_identity_submission_per_user
ON identity_verification_submissions(user_id)
WHERE status IN ('pending', 'approved');

CREATE TABLE identity_documents (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES identity_verification_submissions(id) ON DELETE CASCADE,
  document_side TEXT NOT NULL CHECK (document_side IN ('front', 'back')),
  r2_object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  UNIQUE (submission_id, document_side)
);

CREATE TABLE identity_verification_reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES identity_verification_submissions(id),
  reviewer_user_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested', 'rejected', 'revoked')),
  reason_code TEXT NOT NULL,
  reason_detail TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE identity_document_access_logs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES identity_documents(id),
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('preview', 'download')),
  purpose TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
