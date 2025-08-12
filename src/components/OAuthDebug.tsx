'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface DebugInfo {
  currentOrigin: string
  currentUrl: string
  userAgent: string
  supabaseUrl: string | undefined
  hasAnonKey: boolean
  redirectUrl: string
  timestamp: string
}

export function OAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const supabase = createClient()

  const getDebugInfo = () => {
    const info = {
      currentOrigin: window.location.origin,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      redirectUrl: `${window.location.origin}/auth/callback`,
      timestamp: new Date().toISOString(),
    }
    setDebugInfo(info)
    console.log('OAuth Debug Info:', info)
  }

  const testOAuthRedirect = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('OAuth test error:', error)
        alert(`OAuth Error: ${error.message}`)
      } else {
        console.log('OAuth test initiated successfully')
        alert('OAuth test initiated - check console for details')
      }
    } catch (error) {
      console.error('OAuth test exception:', error)
      alert(`OAuth Exception: ${error}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">OAuth Debug Tools</h3>
      
      <div className="space-y-2">
        <button
          onClick={getDebugInfo}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Get Debug Info
        </button>
        
        <button
          onClick={testOAuthRedirect}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm ml-2"
        >
          Test OAuth Redirect
        </button>
      </div>

      {debugInfo && (
        <div className="mt-4">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Debug Information:</h4>
          <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border dark:border-gray-600 overflow-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
