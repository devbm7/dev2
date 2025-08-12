'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface AnimatedHeadlineProps {
  text: string
  className?: string
}

export function AnimatedHeadline({ text, className = '' }: AnimatedHeadlineProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Split text into words and characters
    const words = text.split(' ')
    
    // Create the HTML structure
    const wordsHTML = words.map((word, wordIndex) => {
      const characters = word.split('').map((char, charIndex) => {
        return `<span class="char" style="display: inline-block; transform: translateY(100px); opacity: 0;">${char}</span>`
      }).join('')
      
      return `<div class="word" style="display: inline-block; overflow: hidden; margin-right: 0.5em;">${characters}</div>`
    }).join('')

    containerRef.current.innerHTML = wordsHTML

    // Animate characters with stagger
    const chars = containerRef.current.querySelectorAll('.char')
    
    gsap.fromTo(chars, 
      {
        y: 100,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        stagger: 0.05,
        delay: 0.2
      }
    )
  }, [text])

  return (
    <div 
      ref={containerRef}
      className={className}
    />
  )
}
