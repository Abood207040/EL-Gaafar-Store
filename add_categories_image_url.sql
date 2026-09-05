-- Add the image_url column to your categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS image_url TEXT;
