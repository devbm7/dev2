'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface LandingPageNavigationProps {
  showThemeToggle?: boolean
}

export function LandingPageNavigation({ showThemeToggle = true }: LandingPageNavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">BlinkHire</span>
            </Link>
          </div>

          {/* Primary Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#analytics" className="text-foreground/80 hover:text-foreground transition-colors">
              Analytics
            </Link>
            <Link href="#about" className="text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

        </div>
      </div>
    </nav>
  )
}
