import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL belum ditetapkan di Vercel Environment Variables');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum ditetapkan di Vercel Environment Variables');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
