-- Add support for image content type

-- Update content_type enum to include 'image'
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'image';
