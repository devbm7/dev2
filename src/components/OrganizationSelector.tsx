'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getOrganizations, createOrganization, searchOrganizations, type Organization, type CreateOrganizationData, validateOrganizationData } from '@/lib/organization-client'
import { Search, Plus, Building2 } from 'lucide-react'

interface OrganizationSelectorProps {
  value: string | null
  onChange: (organizationId: string | null, organizationName: string) => void
  disabled?: boolean
}

export function OrganizationSelector({ value, onChange, disabled = false }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Organization[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFormData, setCreateFormData] = useState<CreateOrganizationData>({
    org_name: '',
    org_website: '',
    org_phone: '',
    org_description: '',
    org_domain: ''
  })
  const [createErrors, setCreateErrors] = useState<string[]>([])

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const orgs = await getOrganizations()
      setOrganizations(orgs)
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchOrganizations(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching organizations:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCreateOrganization = async () => {
    const validation = validateOrganizationData(createFormData)
    if (!validation.isValid) {
      setCreateErrors(validation.errors)
      return
    }

    setCreateErrors([])
    setIsCreating(true)

    try {
      const newOrg = await createOrganization(createFormData)
      if (newOrg) {
        // Add to organizations list
        setOrganizations(prev => [...prev, newOrg].sort((a, b) => a.org_name.localeCompare(b.org_name)))
        
        // Select the new organization
        onChange(newOrg.organization_id, newOrg.org_name)
        
        // Reset form and close dialog
        setCreateFormData({
          org_name: '',
          org_website: '',
          org_phone: '',
          org_description: '',
          org_domain: ''
        })
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      setCreateErrors(['Failed to create organization. Please try again.'])
    } finally {
      setIsCreating(false)
    }
  }

  const getSelectedOrganizationName = () => {
    if (!value) return ''
    const org = organizations.find(o => o.organization_id === value)
    return org?.org_name || ''
  }

  const filteredOrganizations = searchQuery.trim() ? searchResults : organizations

  return (
    <div className="space-y-2">
      <Label>Organization</Label>
      
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={disabled}
            className="pl-10"
          />
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {createErrors.length > 0 && (
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
                          {createErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name *</Label>
                <Input
                  id="org_name"
                  value={createFormData.org_name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, org_name: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_website">Website</Label>
                <Input
                  id="org_website"
                  type="url"
                  value={createFormData.org_website}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, org_website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_phone">Phone</Label>
                <Input
                  id="org_phone"
                  type="tel"
                  value={createFormData.org_phone}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, org_phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_domain">Domain</Label>
                <Input
                  id="org_domain"
                  value={createFormData.org_domain}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, org_domain: e.target.value }))}
                  placeholder="example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_description">Description</Label>
                <Textarea
                  id="org_description"
                  value={createFormData.org_description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, org_description: e.target.value }))}
                  placeholder="Brief description of the organization"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization List */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
        {isSearching ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Searching...
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No organizations found' : 'No organizations available'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrganizations.map((org) => (
              <button
                key={org.organization_id}
                type="button"
                onClick={() => onChange(org.organization_id, org.org_name)}
                disabled={disabled}
                className={`w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors ${
                  value === org.organization_id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {org.org_name}
                    </p>
                    {org.org_domain && (
                      <p className="text-xs text-gray-500 truncate">
                        {org.org_domain}
                      </p>
                    )}
                  </div>
                  {value === org.organization_id && (
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Organization Display */}
      {value && getSelectedOrganizationName() && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Selected: {getSelectedOrganizationName()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 