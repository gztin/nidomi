CREATE TRIGGER property_images_limit_active_insert
BEFORE INSERT ON property_images
WHEN NEW.deleted_at IS NULL AND (
  SELECT COUNT(*) FROM property_images
  WHERE property_id=NEW.property_id AND deleted_at IS NULL
) >= 10
BEGIN
  SELECT RAISE(ABORT, 'property_image_limit');
END;

CREATE TRIGGER property_images_limit_active_restore
BEFORE UPDATE OF deleted_at,property_id ON property_images
WHEN NEW.deleted_at IS NULL
  AND (OLD.deleted_at IS NOT NULL OR OLD.property_id <> NEW.property_id)
  AND (
    SELECT COUNT(*) FROM property_images
    WHERE property_id=NEW.property_id AND deleted_at IS NULL
  ) >= 10
BEGIN
  SELECT RAISE(ABORT, 'property_image_limit');
END;
