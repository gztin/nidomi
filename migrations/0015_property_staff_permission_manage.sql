PRAGMA foreign_keys=OFF;

CREATE TABLE property_staff_new (
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

INSERT INTO property_staff_new (
  property_id,
  staff_user_id,
  permission_level,
  notice_version,
  notice_accepted_at,
  created_by_user_id,
  created_at,
  updated_at,
  disabled_at
)
SELECT
  property_id,
  staff_user_id,
  CASE permission_level WHEN 'full' THEN 'manage' ELSE permission_level END,
  notice_version,
  notice_accepted_at,
  created_by_user_id,
  created_at,
  updated_at,
  disabled_at
FROM property_staff;

DROP TABLE property_staff;
ALTER TABLE property_staff_new RENAME TO property_staff;

CREATE INDEX idx_property_staff_user_active
ON property_staff(staff_user_id, disabled_at, permission_level);

PRAGMA foreign_keys=ON;
