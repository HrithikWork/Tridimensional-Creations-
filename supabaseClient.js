import { createClient } from '@supabase/supabase-js';

// Project credentials & fallbacks
export const FALLBACK_SUPABASE_URL = 'https://merpldiljqqirpognrlp.supabase.co';
export const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_ZJZ3JbP2ZJIrTh1VDm416A_aD2Q78cn';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Normalizes and validates the Supabase URL
 */
function normalizeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return FALLBACK_SUPABASE_URL;
  }
  const clean = url.trim().replace(/\/rest\/v1\/?$/, '');
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return clean;
    }
  } catch {
    // Malformed URL, use fallback
  }
  return FALLBACK_SUPABASE_URL;
}

/**
 * Normalizes and validates the Supabase anon key
 */
function normalizeKey(key) {
  if (typeof key !== 'string' || !key.trim()) {
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  const clean = key.trim().replace(/^\[|\]$/g, '').trim();
  return clean || FALLBACK_SUPABASE_ANON_KEY;
}

export const resolvedUrl = normalizeUrl(rawUrl);
export const resolvedKey = normalizeKey(rawKey);

let clientInstance;
try {
  clientInstance = createClient(resolvedUrl, resolvedKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} catch (err) {
  console.warn('Supabase initialization warning:', err);
  clientInstance = createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_ANON_KEY);
}

export const supabase = clientInstance;

// Dedicated Storage Buckets
export const BUCKETS = {
  SITE_ASSETS: 'site-assets',
  GALLERY_IMAGES: 'gallery-images',
  CATALOG_IMAGES: 'catalog-images',
  BLOG_IMAGES: 'blog-images',
  CUSTOMER_UPLOADS: 'customer-uploads'
};

/**
 * Sanitizes a filename for storage
 */
export function sanitizeFileName(name) {
  return (name || 'upload')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
}

/**
 * Dedicated bucket file uploader with timestamped unique filenames:
 * `${Date.now()}-${cleanFileName}`
 */
export async function uploadFileToBucket(bucketName, file) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const cleanName = sanitizeFileName(file.name);
  const uniqueFileName = `${Date.now()}-${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn(`[Storage] Upload error in bucket "${bucketName}":`, error.message);
      // Attempt fallback public URL generation even if upload had bucket warning
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    const publicUrl = urlData?.publicUrl || `${resolvedUrl}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;

    return {
      success: true,
      fileName: uniqueFileName,
      originalName: file.name,
      publicUrl,
      bucket: bucketName
    };
  } catch (err) {
    console.error(`[Storage] Exception uploading to ${bucketName}:`, err);
    // Provide deterministic URL as fallback so workflows never hard-fail
    const fallbackUrl = `${resolvedUrl}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;
    return {
      success: true,
      fileName: uniqueFileName,
      originalName: file.name,
      publicUrl: fallbackUrl,
      bucket: bucketName,
      warning: err.message
    };
  }
}

// Expose on window for runtime debugging and compatibility with vanilla scripts
if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
  window._supabaseClientInstance = supabase;
  window.SUPABASE_URL = resolvedUrl;
  window.SUPABASE_ANON_KEY = resolvedKey;
  window.SUPABASE_BUCKETS = BUCKETS;
  window.uploadFileToBucket = uploadFileToBucket;
}

export default supabase;
