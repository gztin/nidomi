PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  can_review_documents INTEGER NOT NULL DEFAULT 0 CHECK (can_review_documents IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT
);

CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  provider_user_id TEXT NOT NULL REFERENCES users(id),
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unpublished')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT NOT NULL,
  rental_scope TEXT NOT NULL,
  monthly_rent INTEGER NOT NULL CHECK (monthly_rent > 0),
  deposit_amount INTEGER NOT NULL CHECK (deposit_amount >= 0 AND deposit_amount <= monthly_rent * 2),
  payment_cycle TEXT NOT NULL,
  payment_due_rule TEXT NOT NULL,
  layout TEXT NOT NULL,
  area_ping REAL NOT NULL CHECK (area_ping > 0),
  floor_label TEXT NOT NULL,
  total_floors INTEGER NOT NULL CHECK (total_floors > 0),
  has_elevator INTEGER NOT NULL CHECK (has_elevator IN (0, 1)),
  public_location TEXT NOT NULL,
  private_address TEXT NOT NULL,
  available_from TEXT NOT NULL,
  minimum_lease_months INTEGER NOT NULL CHECK (minimum_lease_months > 0),
  electricity_billing_type TEXT NOT NULL CHECK (electricity_billing_type IN ('metered', 'non_metered', 'included')),
  electricity_calculation_rule TEXT NOT NULL,
  electricity_information_method TEXT NOT NULL,
  listing_rules_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

CREATE TABLE property_fees (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER,
  calculation_rule TEXT,
  billing_cycle TEXT NOT NULL,
  paid_by TEXT NOT NULL CHECK (paid_by IN ('provider', 'tenant', 'shared')),
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
  CHECK (amount IS NOT NULL OR length(trim(calculation_rule)) > 0)
);

CREATE TABLE property_equipment (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  condition TEXT NOT NULL,
  usage_scope TEXT NOT NULL CHECK (usage_scope IN ('private', 'shared')),
  note TEXT
);

CREATE TABLE property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  r2_object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE UNIQUE INDEX one_active_cover_per_property
ON property_images(property_id)
WHERE is_cover = 1 AND deleted_at IS NULL;

CREATE TABLE property_versions (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL REFERENCES users(id),
  change_reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (property_id, version_number)
);
