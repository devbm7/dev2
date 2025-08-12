'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingPageNavigation } from '@/components/ui/navigation'
import DarkVeil from '@/components/blocks/Backgrounds/DarkVeil/DarkVeil'
import { AnimatedHeadline } from '@/components/ui/animated-headline'
import GlareHover from '@/components/ui/animations/GlareHover/GlareHover'
import ClickSpark from '@/components/ui/animations/ClickSpark/ClickSpark'
import { DarkModeWrapper } from '@/components/ui/dark-mode-wrapper'

export default function BlinkHireLanding() {
  return (
    <DarkModeWrapper>
      <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <LandingPageNavigation showThemeToggle={false} />

      {/* Hero Section */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* DarkVeil Background Animation */}
        <div 
          className="absolute inset-0 z-0 w-screen"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <DarkVeil />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-4xl">
            <AnimatedHeadline 
              text="Hire Talent, Intelligently"
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight mb-8"
            />
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl">
              AI-driven Interview & Assessment platform that helps you find, attract, and hire the best talent with data-driven insights.
            </p>
            <ClickSpark
              sparkCount={10}
              sparkColor="#ffffff"
              sparkSize={4}
              sparkRadius={50}
              duration={1000}
            >
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-4 h-auto">
                  Try it out
                </Button>
              </Link>
            </ClickSpark>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg 
              className="w-6 h-6 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Powerful Analytics for Smart Hiring
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get deep insights into your hiring funnel, candidate behavior, and recruitment performance with our AI-powered analytics platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto justify-items-center">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {/* Feature 1 */}
                <GlareHover
                  glareColor="#ffffff"
                  glareOpacity={0.2}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={600}
                  playOnce={false}
                >
                  <div className="bg-background rounded-lg p-8 border border-border hover:shadow-lg transition-shadow cursor-pointer min-w-0 break-words">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4 break-words">AI-Powered Interviews</h3>
                    <p className="text-muted-foreground break-words">
                      Conduct intelligent video interview with AI-driven Q. generation, real-time analysis, and assessment.
                    </p>
                  </div>
                </GlareHover>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {/* Feature 2 */}
                <GlareHover
                  glareColor="#ffffff"
                  glareOpacity={0.2}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={600}
                  playOnce={false}
                >
                  <div className="bg-background rounded-lg p-8 border border-border hover:shadow-lg transition-shadow cursor-pointer min-w-0 break-words">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4 break-words">Smart Assessment</h3>
                    <p className="text-muted-foreground break-words">
                      Candidate evaluation with behavioral analysis, skill assessment, and personality insights powered by AI.
                    </p>
                  </div>
                </GlareHover>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {/* Feature 3 */}
                <GlareHover
                  glareColor="#ffffff"
                  glareOpacity={0.2}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={600}
                  playOnce={false}
                >
                  <div className="bg-background rounded-lg p-8 border border-border hover:shadow-lg transition-shadow cursor-pointer min-w-0 break-words">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4 break-words">Real-time Analytics</h3>
                    <p className="text-muted-foreground break-words">
                      Comprehensive interview analytics with performance metrics, candidate scoring, and detailed evaluation reports.
                    </p>
                  </div>
                </GlareHover>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of companies using BlinkHire to make smarter hiring decisions with data-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </DarkModeWrapper>
  )
}
