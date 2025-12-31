-- Add slug column to Class table (without UNIQUE constraint initially)
ALTER TABLE Class ADD COLUMN slug TEXT;

-- Generate slugs from existing class names
-- Convert to lowercase, replace spaces with hyphens
UPDATE Class SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(name, ' ', '-'),
  'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ñ', 'n'
));

-- For any duplicates, append a number suffix
UPDATE Class 
SET slug = slug || '-' || CAST((
  SELECT COUNT(*) 
  FROM Class c2 
  WHERE c2.slug = Class.slug 
  AND c2.ROWID < Class.ROWID
) AS TEXT)
WHERE EXISTS (
  SELECT 1 FROM Class c1
  WHERE c1.slug = Class.slug 
  AND c1.ROWID <> Class.ROWID
);

-- Create unique index on slug
CREATE UNIQUE INDEX idx_class_slug ON Class(slug);
