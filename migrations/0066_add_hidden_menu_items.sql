-- Add hiddenMenuItems column to Academy for sidebar customization
ALTER TABLE Academy ADD COLUMN hiddenMenuItems TEXT DEFAULT '[]';
