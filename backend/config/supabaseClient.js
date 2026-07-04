import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('CRITICAL: Supabase credentials (SUPABASE_URL / SUPABASE_SECRET_KEY) are missing in environment.');
  process.exit(1);
}

// Initializing the Supabase client with the admin secret key to enable user signup/management bypasses
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
