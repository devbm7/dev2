'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { debugSupabaseConnection, testUserProfileCreation, getSupabaseConfig } from '@/lib/supabase-debug'

interface DebugResult {
  success: boolean
  error?: string
  message?: string
  code?: string
  details?: string
  hint?: string
  profile?: unknown
}

export default function DebugPage() {
  const { user } = useAuth()
  const [debugResults, setDebugResults] = useState<DebugResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    setDebugResults(null)
    
    try {
      const results = await debugSupabaseConnection()
      setDebugResults(results)
    } catch (error) {
      setDebugResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testProfileCreation = async () => {
    if (!user?.id) {
      setDebugResults({
        success: false,
        error: 'No user logged in'
      })
      return
    }

    setIsLoading(true)
    setDebugResults(null)
    
    try {
      const results = await testUserProfileCreation(user.id)
      setDebugResults(results)
    } catch (error) {
      setDebugResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const config = getSupabaseConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Debug Tools</h1>
          <p className="text-gray-600">Use these tools to diagnose database connection and user creation issues</p>
        </div>

        <div className="grid gap-6">
          {/* Configuration Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supabase Configuration</CardTitle>
              <CardDescription>Current environment variable status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">URL:</span>
                  <span className={config.url ? 'text-green-600' : 'text-red-600'}>
                    {config.url || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Anon Key:</span>
                  <span className={config.anonKey !== 'Not set' ? 'text-green-600' : 'text-red-600'}>
                    {config.anonKey}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User Status:</span>
                  <span className={user ? 'text-green-600' : 'text-yellow-600'}>
                    {user ? `Logged in (${user.email})` : 'Not logged in'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Actions</CardTitle>
              <CardDescription>Run diagnostic tests to identify issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={runDebug}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Running...' : 'Test Database Connection'}
                </Button>
                
                <Button
                  onClick={testProfileCreation}
                  disabled={isLoading || !user}
                  variant="outline"
                >
                  {isLoading ? 'Testing...' : 'Test Profile Creation'}
                </Button>
              </div>
              
              {!user && (
                <p className="text-sm text-yellow-600">
                  ⚠️ You need to be logged in to test profile creation
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {debugResults && (
            <Card>
              <CardHeader>
                <CardTitle className={debugResults.success ? 'text-green-600' : 'text-red-600'}>
                  Debug Results
                </CardTitle>
                <CardDescription>
                  {debugResults.success ? 'Test completed successfully' : 'Issues found'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugResults, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
              <CardDescription>Quick fixes for common database problems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ Missing Environment Variables</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If the configuration shows &quot;Not set&quot; for URL or Anon Key:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Create a <code>.env.local</code> file in your project root</li>
                    <li>Add your Supabase URL and anon key from your Supabase dashboard</li>
                    <li>Restart your development server</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ Database Connection Failed</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If the connection test fails:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Verify your Supabase project is active</li>
                    <li>Check that your anon key is correct</li>
                    <li>Ensure your IP is not blocked by Supabase</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-red-600 mb-2">❌ Profile Creation Failed</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    If profile creation fails:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Run the database setup script in your Supabase SQL editor</li>
                    <li>Check that RLS policies are properly configured</li>
                    <li>Verify the user_profiles table exists with correct schema</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-600 mb-2">💡 Next Steps</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Copy the <code>database-setup.sql</code> file content</li>
                    <li>Run it in your Supabase SQL editor</li>
                    <li>Test the connection again</li>
                    <li>Try creating a new user account</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
