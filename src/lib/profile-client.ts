import { createClient } from '@/lib/supabase'

export interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  organization: string | null
  organization_id: string | null
  account_type: 'hiring_manager' | 'interviewee'
  resume_url: string | null
  resume_filename: string | null
  username: string
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  organization: string
  organization_id: string | null
  account_type: 'hiring_manager' | 'interviewee'
  resume_url?: string | null
  resume_filename?: string | null
  username?: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, profileData: ProfileFormData): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone: profileData.phone,
      organization: profileData.organization,
      organization_id: profileData.organization_id,
      account_type: profileData.account_type,
      resume_url: profileData.resume_url || null,
      resume_filename: profileData.resume_filename || null,
      username: profileData.username,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(userId: string, profileData: Partial<ProfileFormData> = {}): Promise<UserProfile | null> {
  const supabase = createClient()
  
  try {
    // Get user data to check if it's a Google user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user data:', userError)
      return null
    }
    
    // If it's a Google user, extract name from user metadata
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ')
      profileData.first_name = names[0] || ''
      profileData.last_name = names.slice(1).join(' ') || ''
    } else if (user?.user_metadata?.name) {
      const names = user.user_metadata.name.split(' ')
      profileData.first_name = names[0] || ''
      profileData.last_name = names.slice(1).join(' ') || ''
    }
    
    // Generate a unique username if not provided
    let username = profileData.username
    if (!username) {
      if (user?.email) {
        // Use email prefix as username, fallback to user ID
        username = user.email.split('@')[0] || `user_${userId.substring(0, 8)}`
      } else {
        username = `user_${userId.substring(0, 8)}`
      }
    }

    // Prepare the insert data with proper defaults
    const insertData = {
      user_id: userId,
      username: username,
      first_name: profileData.first_name || '',
      last_name: profileData.last_name || '',
      phone: profileData.phone || '',
      organization: profileData.organization || '',
      organization_id: profileData.organization_id || null,
      account_type: profileData.account_type || 'interviewee',
      resume_url: profileData.resume_url || null,
      resume_filename: profileData.resume_filename || null
    }
    
    console.log('Creating user profile with data:', insertData)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      // If the error is due to a duplicate user_id, try to get the existing profile
      if (error.code === '23505') { // Unique violation error
        console.log('Profile already exists, fetching existing profile')
        return await getUserProfile(userId)
      }
      return null
    }

    console.log('Successfully created user profile:', data)
    return data
  } catch (error) {
    console.error('Unexpected error in createUserProfile:', error)
    return null
  }
}

export function validateProfileData(data: ProfileFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.username?.trim()) {
    errors.push('Username is required')
  } else if (!/^[a-zA-Z0-9_-]{3,20}$/.test(data.username)) {
    errors.push('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens')
  }

  if (!data.first_name?.trim()) {
    errors.push('First name is required')
  }

  if (!data.last_name?.trim()) {
    errors.push('Last name is required')
  }

  if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('Please enter a valid phone number')
  }

  if (!data.organization?.trim()) {
    errors.push('Organization is required')
  }

  if (!['hiring_manager', 'interviewee'].includes(data.account_type)) {
    errors.push('Please select a valid account type')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 