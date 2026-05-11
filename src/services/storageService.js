import { supabase } from './authService.js';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function sanitizeFileName(name) {
  return String(name || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uploadProductImage(file) {
  if (!file) {
    throw new Error('Please choose an image file before uploading.');
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Unsupported file type. Please upload JPG, PNG, or WEBP.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large. Maximum allowed size is 2MB.');
  }

  const safeName = sanitizeFileName(file.name) || 'product-image';
  const path = `products/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    const msg = String(uploadError.message || '').toLowerCase();
    if (msg.includes('bucket') && msg.includes('not')) {
      throw new Error(
        'Storage bucket "product-images" was not found. Create it in Supabase Storage and allow admin upload access.'
      );
    }
    throw new Error(uploadError.message || 'Image upload failed.');
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  const publicUrl = data?.publicUrl;
  if (!publicUrl) {
    throw new Error('Image uploaded but public URL could not be generated.');
  }

  return publicUrl;
}
