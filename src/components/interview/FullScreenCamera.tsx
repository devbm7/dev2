'use client'

import React, { useRef, useEffect } from 'react'
import { Camera } from 'lucide-react'

interface FullScreenCameraProps {
  videoStream: MediaStream | null
  isCameraOn: boolean
  className?: string
}

export default function FullScreenCamera({ 
  videoStream, 
  isCameraOn, 
  className = '' 
}: FullScreenCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream
      videoRef.current.play().catch(console.error)
    }
  }, [videoStream])

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Camera Off Overlay */}
      {!isCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Camera Starting...</p>
            <p className="text-sm text-gray-400 mt-2">Please allow camera access</p>
          </div>
        </div>
      )}
      
      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
