import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://ibnsjeoemngngkqnnjdz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibnNqZW9lbW5nbmdrcW5uamR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDk4MTEsImV4cCI6MjA2OTI4NTgxMX0.iR8d0XxR-UOPPrK74IIV6Z7gVPP2rHS2b1ZCKwGOSqQ',
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  )
} 