PRAGMA foreign_keys=ON;

CREATE TABLE staff_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT,
  UNIQUE (owner_user_id, user_id)
);

CREATE INDEX idx_staff_accounts_owner_active
ON staff_accounts(owner_user_id, disabled_at);
