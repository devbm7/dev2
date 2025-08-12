import { createClient } from '@/lib/supabase'

export async function debugSupabaseConnection() {
  const supabase = createClient()
  
  console.log('🔍 Debugging Supabase connection...')
  
  // Check environment variables
  console.log('Environment variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error)
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    console.log('✅ Database connection successful')
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('⚠️ Auth check error (this might be normal if not logged in):', authError.message)
    } else {
      console.log('✅ Auth system working')
      if (user) {
        console.log('👤 Current user:', user.email)
      } else {
        console.log('👤 No user logged in')
      }
    }
    
    return {
      success: true,
      message: 'Supabase connection and configuration are working correctly'
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testUserProfileCreation(userId: string) {
  const supabase = createClient()
  
  console.log('🧪 Testing user profile creation for user:', userId)
  
  try {
    // First, check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Error checking existing profile:', fetchError)
      return {
        success: false,
        error: fetchError.message,
        code: fetchError.code
      }
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile)
      return {
        success: true,
        message: 'Profile already exists',
        profile: existingProfile
      }
    }
    
    // Try to create a new profile
    const testProfile = {
      user_id: userId,
      username: `test_user_${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      phone: '',
      organization: 'Test Organization',
      organization_id: null,
      account_type: 'interviewee' as const,
      resume_url: null,
      resume_filename: null
    }
    
    console.log('📝 Attempting to create profile with data:', testProfile)
    
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return {
        success: false,
        error: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint
      }
    }
    
    console.log('✅ Profile created successfully:', newProfile)
    return {
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in profile creation test:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
      'Not set'
  }
}
