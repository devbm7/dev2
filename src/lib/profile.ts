import { createClient } from '@/lib/supabase-server'

export interface UserProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  organization: string | null
  account_type: 'hiring_manager' | 'interviewee'
  created_at: string
  updated_at: string
}

export interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  organization: string
  account_type: 'hiring_manager' | 'interviewee'
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone: profileData.phone,
      organization: profileData.organization,
      account_type: profileData.account_type,
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
  const supabase = await createClient()
  
  // Get user data to check if it's a Google user
  const { data: { user } } = await supabase.auth.getUser()
  
  // If it's a Google user, extract name from user metadata
  if (user?.user_metadata?.full_name) {
    const names = user.user_metadata.full_name.split(' ')
    profileData.first_name = names[0] || ''
    profileData.last_name = names.slice(1).join(' ') || ''
  }
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      first_name: profileData.first_name || '',
      last_name: profileData.last_name || '',
      phone: profileData.phone || '',
      organization: profileData.organization || '',
      account_type: profileData.account_type || 'interviewee'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

export function validateProfileData(data: ProfileFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

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