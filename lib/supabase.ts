import { createClient } from '@supabase/supabase-js';

// Retrieve secure variables from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export the initialized client so any file in your project can read/write data
export const supabase = createClient(supabaseUrl, supabaseAnonKey);