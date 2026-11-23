import {createClient, SupabaseClient} from '@supabase/supabase-js';

function cleanEnvValue(value?: string): string {
  return (value || '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function normalizeSupabaseUrl(raw?: string): string {
  const cleaned = cleanEnvValue(raw);
  if (!cleaned) return '';

  const withProtocol = /^https?:\/\//i.test(cleaned)
    ? cleaned
    : `https://${cleaned}`;

  try {
    const parsed = new URL(withProtocol);

    // Handle accidental Supabase Dashboard URLs: https://supabase.com/dashboard/project/<ref>
    if (
      (parsed.hostname === 'supabase.com' ||
        parsed.hostname === 'app.supabase.com' ||
        parsed.hostname === 'supabase.io') &&
      /\/project\/([a-z0-9-]+)/i.test(parsed.pathname)
    ) {
      const match = parsed.pathname.match(/\/project\/([a-z0-9-]+)/i);
      if (match?.[1]) {
        return `https://${match[1]}.supabase.co`;
      }
    }

    // Standard Supabase cloud projects must use only the root origin (no /rest/v1, /auth/v1, etc.)
    if (
      parsed.hostname.endsWith('.supabase.co') ||
      parsed.hostname.endsWith('.supabase.in') ||
      parsed.hostname.endsWith('.supabase.net')
    ) {
      return parsed.origin;
    }

    // Strip accidental API subpaths on custom domains
    const strippedPath = parsed.pathname
      .replace(/\/(auth|rest|storage|realtime|functions|graphql)\/v1\/?.*$/i, '')
      .replace(/\/+$/, '');
    return `${parsed.origin}${strippedPath}`;
  } catch {
    return '';
  }
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = cleanEnvValue(rawAnonKey);

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10,
);

export const supabaseConfigMessage = !isSupabaseConfigured
  ? 'Configure VITE_SUPABASE_URL (ex.: https://seu-projeto.supabase.co) e VITE_SUPABASE_ANON_KEY para usar o banco e login do Supabase.'
  : null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      },
    })
  : null;
