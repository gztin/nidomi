PRAGMA foreign_keys = ON;

ALTER TABLE properties ADD COLUMN listing_review_status TEXT NOT NULL DEFAULT 'not_submitted'
  CHECK (listing_review_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
ALTER TABLE properties ADD COLUMN rights_verification_status TEXT NOT NULL DEFAULT 'not_submitted'
  CHECK (rights_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected'));
ALTER TABLE properties ADD COLUMN listing_reviewed_at TEXT;
ALTER TABLE properties ADD COLUMN rights_verified_at TEXT;

CREATE TABLE property_verification_events (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('listing', 'rights')),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX property_verification_events_property_idx
ON property_verification_events(property_id, created_at DESC);
