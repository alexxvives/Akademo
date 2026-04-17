-- Add isPublished flag to Class table.
-- Classes without a price configured will be imported with isPublished = 0
-- and won't be visible/enrollable by students until the academy sets a price.
ALTER TABLE Class ADD COLUMN isPublished INTEGER NOT NULL DEFAULT 1;

-- Back-fill: existing classes with no price are unpublished
UPDATE Class SET isPublished = 0 WHERE monthlyPrice IS NULL AND oneTimePrice IS NULL;
