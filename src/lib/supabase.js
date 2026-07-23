import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wtmcfgyjpyxghnjkqbio.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bWNmZ3lqcHl4Z2huamtxYmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDY5NzIsImV4cCI6MjEwMDM4Mjk3Mn0.2__IlVZ410kP1P6ZY6XqPevWu_cndIHHruXG689X6zE';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
