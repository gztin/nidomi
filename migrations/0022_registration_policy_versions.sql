PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO policy_versions(
  id,
  policy_type,
  version,
  published_at,
  effective_at,
  requires_reconsent,
  content_hash
) VALUES
(
  'policy-terms-2026-07-3',
  'terms',
  'TOS-2026-07-3',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0,
  'local-draft-terms-2026-07-3'
),
(
  'policy-privacy-2026-07-3',
  'privacy',
  'PRIVACY-2026-07-3',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0,
  'local-draft-privacy-2026-07-3'
);
