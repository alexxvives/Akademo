-- Add allowDownload column to Document table
-- Controls whether students can download (open in native browser PDF viewer)
-- Default 0 = locked (custom in-app viewer, no download toolbar)
ALTER TABLE Document ADD COLUMN allowDownload INTEGER NOT NULL DEFAULT 0;
