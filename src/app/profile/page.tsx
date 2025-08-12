'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { getUserProfile, updateUserProfile, createUserProfile, validateProfileData, type UserProfile, type ProfileFormData } from '@/lib/profile-client'
import { OrganizationSelector } from '@/components/OrganizationSelector'
import { ResumeUpload } from '@/components/ResumeUpload'
import { ClientOnly } from '@/components/ClientOnly'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    organization: '',
    organization_id: null,
    account_type: 'interviewee',
    resume_url: null,
    resume_filename: null,
    username: ''
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return
    
    try {
      let userProfile = await getUserProfile(user.id)
      
      if (!userProfile) {
        // Create a new profile if one doesn't exist
        userProfile = await createUserProfile(user.id)
      }
      
      if (userProfile) {
        setProfile(userProfile)
        setFormData({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
          organization: userProfile.organization || '',
          organization_id: userProfile.organization_id,
          account_type: userProfile.account_type,
          resume_url: userProfile.resume_url,
          resume_filename: userProfile.resume_filename,
          username: userProfile.username || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && !authLoading) {
      loadUserProfile()
    } else if (!authLoading && !user) {
      setIsLoading(false)
    }
  }, [user, authLoading, loadUserProfile])

  const handleSave = async () => {
    if (!user?.id) return
    
    // Validate form data
    const validation = validateProfileData(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors([])
    setIsSaving(true)
    
    try {
      const updatedProfile = await updateUserProfile(user.id, formData)
      
      if (updatedProfile) {
        setProfile(updatedProfile)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        organization: profile.organization || '',
        organization_id: profile.organization_id,
        account_type: profile.account_type,
        resume_url: profile.resume_url,
        resume_filename: profile.resume_filename,
        username: profile.username || ''
      })
    }
    setIsEditing(false)
    setValidationErrors([])
  }

  // Show loading state while auth is being determined
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Polaris Interview Agent
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and account settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">Email address cannot be changed</p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your username"
                />
                <p className="text-sm text-gray-500">Username must be unique</p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your last name"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Organization */}
              <OrganizationSelector
                value={formData.organization_id}
                onChange={(organizationId, organizationName) => {
                  setFormData(prev => ({
                    ...prev,
                    organization_id: organizationId,
                    organization: organizationName
                  }))
                }}
                disabled={!isEditing}
              />

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type</Label>
                <select
                  id="account_type"
                  value={formData.account_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    account_type: e.target.value as 'hiring_manager' | 'interviewee' 
                  }))}
                  disabled={!isEditing}
                  className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="interviewee">Interviewee</option>
                  <option value="hiring_manager">Hiring Manager</option>
                </select>
              </div>

              {/* Resume Upload */}
              {user && (
                <ResumeUpload
                  userId={user.id}
                  currentResumeUrl={formData.resume_url}
                  currentResumeFilename={formData.resume_filename}
                  onResumeUpdate={(url, filename) => {
                    setFormData(prev => ({
                      ...prev,
                      resume_url: url,
                      resume_filename: filename
                    }))
                  }}
                  disabled={!isEditing}
                />
              )}

              {/* Last Updated */}
              {profile && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>
        </main>
      </div>
    </ClientOnly>
  )
} 