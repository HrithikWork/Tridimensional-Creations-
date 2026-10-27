import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const formattedUrl = typeof supabaseUrl === 'string'
  ? supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '')
  : '';

const formattedKey = typeof supabaseAnonKey === 'string'
  ? supabaseAnonKey.trim().replace(/^\[|\]$/g, '')
  : '';

export const supabase = createClient(formattedUrl || supabaseUrl || '', formattedKey || supabaseAnonKey || '');

export default supabase;
