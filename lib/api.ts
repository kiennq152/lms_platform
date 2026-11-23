import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import type { Category } from './types';

/** Columns needed to render a course card, with instructor + category joined. */
export const COURSE_CARD_SELECT =
  'course_id, title, short_description, price, thumbnail_url, rating, total_enrollments, total_lessons, duration_hours, level, status, created_at, updated_at, category_id, instructor_id, rejection_reason, ' +
  'instructor:users!courses_instructor_id_fkey(id, first_name, last_name, avatar_url), category:categories(name)';

export const COURSE_DETAIL_SELECT =
  '*, instructor:users!courses_instructor_id_fkey(id, first_name, last_name, avatar_url, bio, degree, experience_years), category:categories(name)';

export const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';

let categoriesCache: Category[] | null = null;
export async function fetchCategories(force = false): Promise<Category[]> {
  if (categoriesCache && !force) return categoriesCache;
  const { data } = await supabase.from('categories').select('category_id, name, slug, description').order('name');
  categoriesCache = (data as Category[]) ?? [];
  return categoriesCache;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Lets the user pick an image and uploads it to a public bucket under <uid>/...
 * Returns the public URL, or null if the user cancelled.
 */
export async function pickAndUploadImage(bucket: 'avatars' | 'thumbnails', aspect: [number, number] = [16, 9]): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
    base64: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Bạn cần đăng nhập để tải ảnh lên.');

  const mime = asset.mimeType ?? 'image/jpeg';
  const ext = (mime.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const body = asset.base64 ? base64ToBytes(asset.base64) : await (await fetch(asset.uri)).arrayBuffer();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: mime, upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
