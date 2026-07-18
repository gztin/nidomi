PRAGMA foreign_keys=ON;
INSERT OR IGNORE INTO policy_versions(id,policy_type,version,published_at,effective_at,content_hash) VALUES
('policy-terms-2026-07','terms','TOS-2026-07-1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'local-draft-terms-2026-07'),
('policy-privacy-2026-07','privacy','PRIVACY-2026-07-1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'local-draft-privacy-2026-07'),
('policy-member-2026-07','member_rules','MEMBER-2026-07-1',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,'local-draft-member-2026-07');
