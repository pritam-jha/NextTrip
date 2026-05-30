import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

// ── WebSocket polyfill for Node.js < 22 ──────────────────────────────────────
// Node 22+ has a native WebSocket global; older versions need the 'ws' package.
// We detect the version at runtime and pass 'ws' as the realtime transport when
// needed. This makes the code work on both Node 20 and Node 22.

function getRealtimeOptions(): Record<string, unknown> {
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 22) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws') as unknown;
    return { transport: ws };
  }
  return {};
}

const realtimeOptions = getRealtimeOptions();

export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: realtimeOptions as any,
});

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  realtime: realtimeOptions as any,
});
