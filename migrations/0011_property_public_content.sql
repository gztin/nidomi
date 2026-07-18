PRAGMA foreign_keys = ON;

ALTER TABLE properties ADD COLUMN rental_conditions_text TEXT NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN known_conditions_text TEXT NOT NULL DEFAULT '';
ALTER TABLE properties ADD COLUMN nearby_text TEXT NOT NULL DEFAULT '';
