import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured =
	supabaseUrl &&
	supabaseAnonKey &&
	supabaseUrl.startsWith('https://') &&
	!supabaseUrl.includes('your-supabase');

export const supabase = createClient(
	isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
	isConfigured ? supabaseAnonKey : 'placeholder',
	{ auth: { persistSession: true, autoRefreshToken: true } }
);

/** True once real Supabase credentials are in .env */
export const supabaseReady = isConfigured;
