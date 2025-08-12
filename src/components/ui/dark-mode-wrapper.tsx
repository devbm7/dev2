'use client'

import { useEffect } from 'react'

interface DarkModeWrapperProps {
  children: React.ReactNode
}

export function DarkModeWrapper({ children }: DarkModeWrapperProps) {
  useEffect(() => {
    // Force dark mode for the landing page
    const root = window.document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    
    // Store the original theme to restore it when leaving the page
    const originalTheme = localStorage.getItem('theme')
    localStorage.setItem('landing-page-original-theme', originalTheme || 'system')
    
    return () => {
      // Restore the original theme when component unmounts
      const originalTheme = localStorage.getItem('landing-page-original-theme')
      if (originalTheme) {
        localStorage.setItem('theme', originalTheme)
        localStorage.removeItem('landing-page-original-theme')
        
        // Re-apply the original theme
        root.classList.remove('light', 'dark')
        if (originalTheme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(originalTheme)
        }
      }
    }
  }, [])

  return <>{children}</>
}

