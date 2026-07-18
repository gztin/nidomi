PRAGMA foreign_keys=ON;
ALTER TABLE email_deliveries ADD COLUMN failure_code TEXT;
