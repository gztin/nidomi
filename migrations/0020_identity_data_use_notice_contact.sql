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
  'policy-identity-notice-2026-07-17-v2',
  'document_notice',
  'identity-notice-2026-07-17-v2',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0,
  '1fd3dc611ba4fdf4847fe533418097c755ee8fae6352715394a69f272f5cc8d9'
);
