'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

export type SerinState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface SerinSphereProps {
  state: SerinState
  isConnected: boolean
  className?: string
}

const STATE_CONFIG = {
  idle: {
    color: '#64748b', // Neutral Slate Gray
    scale: 1,
    distortion: 0.1,
    speed: 0.5,
    intensity: 0.3
  },
  listening: {
    color: '#06b6d4', // Electric Blue
    scale: 1.2,
    distortion: 0.3,
    speed: 2,
    intensity: 0.8
  },
  processing: {
    color: '#f59e0b', // Warning Amber
    scale: 1.1,
    distortion: 0.5,
    speed: 3,
    intensity: 0.6
  },
  speaking: {
    color: '#3b82f6', // Bright Blue
    scale: 1.3,
    distortion: 0.4,
    speed: 1.5,
    intensity: 1
  },
  error: {
    color: '#dc2626', // Error Red
    scale: 0.8,
    distortion: 0.8,
    speed: 4,
    intensity: 0.9
  }
}

export default function SerinSphere({ state, isConnected }: SerinSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  
  const config = STATE_CONFIG[state]
  
  // Create color with connection state consideration
  const sphereColor = useMemo(() => {
    if (!isConnected) return '#dc2626' // Red when disconnected
    return config.color
  }, [isConnected, config.color])

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Rotate the sphere
    meshRef.current.rotation.x = Math.sin(time * config.speed * 0.5) * 0.1
    meshRef.current.rotation.y = time * config.speed * 0.3
    
    // Pulse effect
    const pulse = 1 + Math.sin(time * config.speed * 2) * 0.1
    meshRef.current.scale.setScalar(config.scale * pulse)
    
    // Update material properties
    if (materialRef.current) {
      materialRef.current.distort = config.distortion
      materialRef.current.speed = config.speed
    }
  })

  return (
    <group>
      {/* Main Sphere */}
      <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          ref={materialRef}
          color={sphereColor}
          transparent
          opacity={0.8}
          distort={config.distortion}
          speed={config.speed}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Glow Effect */}
      <Sphere args={[1.2, 16, 16]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={sphereColor}
          transparent
          opacity={0.1}
        />
      </Sphere>
      
      {/* State-specific particle effects */}
      <StateParticles state={state} color={sphereColor} />
    </group>
  )
}

// Unified particle system for all states
function StateParticles({ color }: { state: SerinState; color: string }) {
  const particlesRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!particlesRef.current) return
    const time = state.clock.getElapsedTime()
    
    particlesRef.current.children.forEach((particle, index) => {
      const particleMesh = particle as THREE.Mesh
      const erraticX = Math.sin(time * 5 + index) * 2
      const erraticY = Math.cos(time * 3 + index * 0.5) * 2
      const erraticZ = Math.sin(time * 7 + index * 0.3) * 1
      
      particleMesh.position.set(erraticX, erraticY, erraticZ)
      ;(particleMesh.material as any).opacity = 0.3 + Math.sin(time * 8 + index) * 0.4
    })
  })
  
  return (
    <group ref={particlesRef}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Sphere key={i} args={[0.05, 4, 4]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
          />
        </Sphere>
      ))}
    </group>
  )
}
