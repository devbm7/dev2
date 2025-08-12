'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleSignIn } from '@/components/GoogleSignIn'
import Link from 'next/link'
import Image from 'next/image'

export default function TestAuthPage() {
  const { user, loading, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Authentication Test</CardTitle>
            <CardDescription>
              Test Google OAuth integration and user authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading authentication state...</p>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Authenticated</h3>
                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
                    {user.user_metadata?.full_name && (
                      <p><strong>Full Name:</strong> {user.user_metadata.full_name}</p>
                    )}
                    {user.user_metadata?.avatar_url && (
                      <div>
                        <p><strong>Avatar:</strong></p>
                        <Image 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                  <Link href="/profile">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔒 Not Authenticated</h3>
                  <p className="text-sm text-yellow-700">
                    Please sign in to test the authentication system.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <GoogleSignIn
                    mode="signin"
                    onSuccess={() => {
                      console.log('Google sign-in successful')
                    }}
                    onError={(error) => {
                      console.error('Google sign-in error:', error)
                    }}
                  />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Or</p>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Sign in with Email
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Debug Information</h4>
              <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-700 overflow-auto">
                <pre>{JSON.stringify({ user, loading }, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 