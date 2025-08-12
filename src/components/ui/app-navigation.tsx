'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'

interface AppNavigationProps {
  showThemeToggle?: boolean
}

export function AppNavigation({ showThemeToggle = true }: AppNavigationProps) {
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">BlinkHire</span>
            </Link>
          </div>

          {/* Primary Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/job-postings" className="text-foreground/80 hover:text-foreground transition-colors">
              Job Listings
            </Link>
            <Link href="/interview-results" className="text-foreground/80 hover:text-foreground transition-colors">
              Interview Results
            </Link>
            <Link href="/interview/setup" className="text-foreground/80 hover:text-foreground transition-colors">
              Start Interview
            </Link>
          </div>

          {/* Right side - Theme toggle, user info, and auth buttons */}
          <div className="flex items-center space-x-4">
            {showThemeToggle && <ThemeToggle />}
            
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.email}
                </span>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                </Link>
                <Button 
                  onClick={signOut}
                  variant="outline" 
                  size="sm"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
