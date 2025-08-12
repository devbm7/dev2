'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Download } from 'lucide-react'

interface MinimalControlsProps {
  onLeaveInterview: () => void
  onDownloadRecording?: () => void
  hasRecording?: boolean
  isConnected: boolean
  isRecording: boolean
  isAiSpeaking: boolean
}

export default function MinimalControls({
  onLeaveInterview,
  onDownloadRecording,
  hasRecording = false,
  isConnected,
  isRecording,
  isAiSpeaking
}: MinimalControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {/* Connection Status */}
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-white text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Recording Status */}
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-white text-sm font-medium">
          {isRecording ? 'Recording' : 'Not Recording'}
        </span>
      </div>

      {/* AI Speaking Status */}
      {isAiSpeaking && (
        <div className="flex items-center gap-2 bg-blue-500/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-white text-sm font-medium">AI Speaking</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {hasRecording && onDownloadRecording && (
          <Button
            onClick={onDownloadRecording}
            variant="outline"
            size="sm"
            className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}

        <Button
          onClick={onLeaveInterview}
          variant="destructive"
          size="sm"
          className="bg-red-600/80 backdrop-blur-sm hover:bg-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </div>
    </div>
  )
}
