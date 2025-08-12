'use client'

import React, { useState } from 'react'
import SerinScene from '@/components/interview/SerinScene'
import { SerinState } from '@/components/interview/SerinSphere'

export default function TestSerinPage() {
  const [currentState, setCurrentState] = useState<SerinState>('idle')
  const [isConnected, setIsConnected] = useState(true)

  const states: SerinState[] = ['idle', 'listening', 'processing', 'speaking', 'error']

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Serin Sphere Test</h1>
        
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => setCurrentState(state)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentState === state
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isConnected}
                onChange={(e) => setIsConnected(e.target.checked)}
                className="w-4 h-4"
              />
              Connected
            </label>
          </div>
        </div>

        {/* Serin Sphere Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {states.map((state) => (
            <div key={state} className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {state.charAt(0).toUpperCase() + state.slice(1)} State
              </h3>
              <div className="w-32 h-32 mx-auto">
                <SerinScene
                  state={state}
                  isConnected={isConnected}
                  className="w-full h-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Current State Display */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current State</h2>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <SerinScene
                state={currentState}
                isConnected={isConnected}
                className="w-full h-full"
              />
            </div>
            <div className="text-white">
              <p><strong>State:</strong> {currentState}</p>
              <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
