-- Add provider column to ZoomAccount to support multiple streaming providers (zoom, gotomeeting)
ALTER TABLE ZoomAccount ADD COLUMN provider TEXT DEFAULT 'zoom';
