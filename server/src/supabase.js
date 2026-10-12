import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseKey.length > 20
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

/**
 * Validates whether the Supabase connection is currently active and reachable
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured || !supabase) {
    return { connected: false, message: 'Supabase credentials not configured in environment variables' };
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205') {
        return { 
          connected: true, 
          tablesPending: true,
          message: 'Connected to Supabase! Please run supabase_schema.sql in Supabase SQL Editor to create tables.' 
        };
      }
      if (error.code === 'PGRST116') {
        return { connected: true, tablesPending: false, message: 'Connected to Supabase PostgreSQL' };
      }
      return { connected: false, message: error.message };
    }
    return { connected: true, tablesPending: false, message: 'Connected to Supabase PostgreSQL (Tables verified)' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
}
