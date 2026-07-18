PRAGMA foreign_keys=ON;

CREATE TABLE property_staff (
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  staff_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('booking', 'manage')),
  notice_version TEXT NOT NULL,
  notice_accepted_at TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT,
  PRIMARY KEY (property_id, staff_user_id)
);

CREATE INDEX idx_property_staff_user_active
ON property_staff(staff_user_id, disabled_at, permission_level);
