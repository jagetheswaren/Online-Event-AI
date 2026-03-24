import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseEnabled } from '../config.js';

export const supabase = isSupabaseEnabled()
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })
  : null;
