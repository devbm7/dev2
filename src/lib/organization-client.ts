import { createClient } from '@/lib/supabase'

export interface Organization {
  organization_id: string
  org_name: string
  org_website: string | null
  org_phone: string | null
  org_description: string | null
  org_domain: string | null
  created_at: string
  last_login: string | null
}

export interface CreateOrganizationData {
  org_name: string
  org_website?: string
  org_phone?: string
  org_description?: string
  org_domain?: string
}

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_details')
    .select('*')
    .order('org_name')

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data || []
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_details')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data
}

export async function createOrganization(orgData: CreateOrganizationData): Promise<Organization | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_details')
    .insert({
      org_name: orgData.org_name,
      org_website: orgData.org_website || null,
      org_phone: orgData.org_phone || null,
      org_description: orgData.org_description || null,
      org_domain: orgData.org_domain || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating organization:', error)
    return null
  }

  return data
}

export async function searchOrganizations(query: string): Promise<Organization[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('organization_details')
    .select('*')
    .or(`org_name.ilike.%${query}%,org_domain.ilike.%${query}%`)
    .order('org_name')
    .limit(10)

  if (error) {
    console.error('Error searching organizations:', error)
    return []
  }

  return data || []
}

export function validateOrganizationData(data: CreateOrganizationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.org_name?.trim()) {
    errors.push('Organization name is required')
  }

  if (data.org_name && data.org_name.length > 200) {
    errors.push('Organization name must be less than 200 characters')
  }

  if (data.org_website && !isValidUrl(data.org_website)) {
    errors.push('Please enter a valid website URL')
  }

  if (data.org_phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.org_phone.replace(/\s/g, ''))) {
    errors.push('Please enter a valid phone number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
} 