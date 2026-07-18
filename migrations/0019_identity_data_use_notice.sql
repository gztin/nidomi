PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO policy_versions(
  id,
  policy_type,
  version,
  published_at,
  effective_at,
  requires_reconsent,
  content_hash
) VALUES (
  'policy-identity-notice-2026-07-17',
  'document_notice',
  'identity-notice-2026-07-17',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0,
  '1db9f5163eaf0e4b9d0bb16172e3cb0b5ac847e207a39677fc9dd2150496626c'
);
