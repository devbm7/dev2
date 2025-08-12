// Environment configuration for different deployment environments
export const config = {
  // OAuth redirect URLs for different environments
  oauth: {
    redirectUrl: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL || 
                 (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'),
  },
  
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // App configuration
  app: {
    name: 'Project Polaris Interview Agent',
    version: '1.0.0',
  },
}

// Helper function to get the correct redirect URL
export function getOAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  return '/auth/callback'
}

// Helper function to validate environment variables
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
