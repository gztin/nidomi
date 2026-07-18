PRAGMA foreign_keys=ON;
ALTER TABLE users ADD COLUMN disabled_reason TEXT;
ALTER TABLE users ADD COLUMN disabled_by_user_id TEXT REFERENCES users(id);

