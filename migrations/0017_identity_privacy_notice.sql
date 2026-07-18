PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO policy_versions(id,policy_type,version,published_at,effective_at,requires_reconsent,content_hash) VALUES
('policy-privacy-2026-07-2','privacy','PRIVACY-2026-07-2',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,'local-draft-privacy-2026-07-2'),
('policy-identity-notice-2026-07-15','document_notice','identity-notice-2026-07-15',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,'identity-number-and-document-notice-2026-07-15');
