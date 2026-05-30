import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

const getRequiredEnv = (keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key];

    if (value !== undefined && value.trim() !== '') {
      return value.trim();
    }
  }

  throw new Error(`${keys.join(' or ')} environment variable is required`);
};

const supabaseUrl = getRequiredEnv([
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
]);

const supabaseAnonKey = getRequiredEnv([
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]);

const supabaseServiceRoleKey = getRequiredEnv(['SUPABASE_SERVICE_ROLE_KEY']);

// Node.js 20 does not have a native WebSocket global.
// Passing the 'ws' package as the realtime transport fixes the crash:
//   "Error: Node.js 20 detected without native WebSocket support."
// Node.js 22+ has native WebSocket so this is harmless on newer runtimes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const realtimeOptions = { transport: ws as any };

export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: realtimeOptions,
});

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: realtimeOptions,
});
