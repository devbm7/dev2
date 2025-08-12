'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SerinScene from './SerinScene'
import { SerinState } from './SerinSphere'
import MinimalControls from './MinimalControls'
import FullScreenCamera from './FullScreenCamera'

interface InterviewResponse {
  transcription: string
  response: string
  audio_response?: string
}

const CHUNK_SIZE = 512  // 32ms at 16kHz: 32ms * 16000 samples/sec = 512 samples
const SAMPLE_RATE = 16000

const BASE_URL = 'http://localhost:8000'
// const BASE_URL = 'http://34.142.208.17:8000'
const WS_URL = 'ws://localhost:8000'
// const WS_URL = 'ws://34.142.208.17:8000'

export default function InterviewRoom() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [response, setResponse] = useState('')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)
  const [audioWorkletNode, setAudioWorkletNode] = useState<AudioWorkletNode | null>(null)
  const [scriptProcessor, setScriptProcessor] = useState<ScriptProcessorNode | null>(null)
  const [audioQueue, setAudioQueue] = useState<Float32Array[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Camera and recording states
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isSessionRecording, setIsSessionRecording] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [sessionRecordingUrl, setSessionRecordingUrl] = useState<string | null>(null)
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAiSpeakingRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking
  }, [isAiSpeaking])

  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-9), `[${timestamp}] ${message}`])
    console.log(`[InterviewRoom Debug] ${message}`)
  }, [])

  // Add this function after the existing functions
  const uploadRecordingToServer = useCallback(async (recordingBlob: Blob) => {
    try {
      addDebugLog('Uploading recording to server...')
      
      const formData = new FormData()
      formData.append('recording', recordingBlob, `session_recording_${sessionId}.webm`)
      formData.append('recording_type', 'session')
      
      const response = await fetch(`${BASE_URL}/recordings/upload/${sessionId}`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      addDebugLog(`Recording uploaded successfully: ${result.file_path} (${result.file_size} bytes)`)
      
      return result
    } catch (error) {
      addDebugLog(`Error uploading recording: ${error}`)
      throw error
    }
  }, [sessionId, addDebugLog])

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      addDebugLog('Starting camera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      setVideoStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Ensure video plays
        await videoRef.current.play()
      }
      setIsCameraOn(true)
      addDebugLog('Camera started successfully')
    } catch (error) {
      addDebugLog(`Error starting camera: ${error}`)
    }
  }, [addDebugLog])

  // Update the stopCamera function to properly stop all video tracks
  const stopCamera = useCallback(() => {
    addDebugLog('Stopping camera...')
    
    // Stop all video tracks from all sources
    if (videoStream) {
      videoStream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.stop()
          addDebugLog(`Stopped video track: ${track.id}`)
        }
      })
      setVideoStream(null)
    }
    
    // Stop any remaining video tracks from session recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.stop()
          addDebugLog(`Stopped session recording video track: ${track.id}`)
        }
      })
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCameraOn(false)
    addDebugLog('Camera stopped')
  }, [videoStream, addDebugLog])

  // Update the session recording functions
  const startSessionRecording = useCallback(async () => {
    try {
      addDebugLog('Starting session recording...')
      
      // Get both audio and video streams
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      // Combine streams
      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...videoStream.getTracks()
      ])
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        
        try {
          // Upload to server
          await uploadRecordingToServer(blob)
          addDebugLog(`Session recording uploaded to server: ${blob.size} bytes`)
        } catch (error) {
          addDebugLog(`Failed to upload recording: ${error}`)
        }
        
        // Create local URL for download button
        const url = URL.createObjectURL(blob)
        setSessionRecordingUrl(url)
        setRecordedChunks(chunks)
        addDebugLog('Session recording completed')
      }
      
      recorder.start(1000) // Record in 1-second chunks
      setMediaRecorder(recorder)
      mediaRecorderRef.current = recorder
      setIsSessionRecording(true)
      addDebugLog('Session recording started')
      
    } catch (error) {
      addDebugLog(`Error starting session recording: ${error}`)
    }
  }, [addDebugLog, uploadRecordingToServer])

  const stopSessionRecording = useCallback(() => {
    addDebugLog('Stopping session recording...')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsSessionRecording(false)
    addDebugLog('Session recording stopped')
  }, [addDebugLog])
  const downloadSessionRecording = useCallback(async () => {
    if (sessionRecordingUrl) {
      try {
        // Try to download from server first
        const response = await fetch(`${BASE_URL}/recordings/${sessionId}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
          a.download = `interview-session-${sessionId}-${timestamp}.webm`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          addDebugLog('Recording downloaded from server')
        } else {
          // Fallback to local download
          const a = document.createElement('a')
          a.href = sessionRecordingUrl
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
          a.download = `interview-session-${sessionId}-${timestamp}.webm`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          addDebugLog('Recording downloaded from local storage')
        }
      } catch (error) {
        addDebugLog(`Download error: ${error}`)
        // Final fallback to local download
        const a = document.createElement('a')
        a.href = sessionRecordingUrl
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        a.download = `interview-session-${sessionId}-${timestamp}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        addDebugLog('Recording downloaded from local storage (fallback)')
      }
    }
  }, [sessionRecordingUrl, sessionId, addDebugLog])
  const sendAudioChunk = useCallback((audioChunk: Float32Array) => {
    if (isAiSpeakingRef.current) {
      return;
    }

    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    
    try {
      const int16Array = new Int16Array(audioChunk.length)
      for (let i = 0; i < audioChunk.length; i++) {
        int16Array[i] = Math.round(audioChunk[i] * 32767)
      }
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer)))
      
      const audioData = {
        type: 'audio_chunk',
        audio_data: base64Audio,
        sample_rate: SAMPLE_RATE,
        chunk_size: CHUNK_SIZE
      }
      
      websocketRef.current.send(JSON.stringify(audioData))
      addDebugLog(`Sent audio chunk: ${audioChunk.length} samples (${JSON.stringify(audioData).length} chars)`)
    } catch (error) {
      addDebugLog(`Error sending audio chunk: ${error}`)
    }
  }, [addDebugLog])

  const startRecording = useCallback(async () => {
    try {
      addDebugLog('Starting audio recording...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,  // Enable echo cancellation
          noiseSuppression: true,  // Enable noise suppression
          autoGainControl: true    // Enable auto gain control
        }
      })
      
      setMediaStream(stream)
      mediaStreamRef.current = stream
      addDebugLog('Microphone access granted')
      
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      const context = new AudioContextClass({
        sampleRate: SAMPLE_RATE
      })
      setAudioContext(context)
      audioContextRef.current = context
      
      const source = context.createMediaStreamSource(stream)
      
      try {
        await context.audioWorklet.addModule('/audio-processor.js')
        const audioWorkletNode = new AudioWorkletNode(context, 'audio-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: {
            chunkSize: CHUNK_SIZE
          }
        })
        
        setAudioWorkletNode(audioWorkletNode)
        audioWorkletNodeRef.current = audioWorkletNode
        
        audioWorkletNode.port.onmessage = (event) => {
          if (event.data.type === 'audioData') {
            const audioChunk = new Float32Array(event.data.audioData)
            addDebugLog(`AudioWorklet sent chunk: ${audioChunk.length} samples`)
            sendAudioChunk(audioChunk)
          }
        }
        
        source.connect(audioWorkletNode)
        // audioWorkletNode.connect(context.destination)  // Removed to prevent echo
        
        addDebugLog('Audio worklet setup complete')
        addDebugLog(`Using AudioWorkletNode with chunk size: ${CHUNK_SIZE}`)
      } catch (workletError) {
        addDebugLog(`Audio worklet failed, falling back to script processor: ${workletError}`)
        
        const processor = context.createScriptProcessor(CHUNK_SIZE, 1, 1)
        
        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0)
          addDebugLog(`ScriptProcessor received: ${inputData.length} samples`)
          const chunkSize = 512
          for (let i = 0; i < inputData.length; i += chunkSize) {
            const chunk = inputData.slice(i, i + chunkSize)
            if (chunk.length < chunkSize) {
              const paddedChunk = new Float32Array(chunkSize)
              paddedChunk.set(chunk)
              sendAudioChunk(paddedChunk)
            } else {
              sendAudioChunk(new Float32Array(chunk))
            }
          }
        }
        
        setScriptProcessor(processor)
        scriptProcessorRef.current = processor
        
        source.connect(processor)
        // processor.connect(context.destination)  // Removed to prevent echo
        addDebugLog(`Using ScriptProcessorNode fallback with chunk size: ${CHUNK_SIZE}`)
      }
      
      setIsRecording(true)
      addDebugLog('Recording started successfully')
    } catch (error) {
      addDebugLog(`Error starting recording: ${error}`)
    }
  }, [addDebugLog, sendAudioChunk])

  const stopRecording = useCallback(() => {
    addDebugLog('Stopping audio recording...')
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      setMediaStream(null)
      mediaStreamRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      setAudioContext(null)
      audioContextRef.current = null
    }
    
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect()
      setAudioWorkletNode(null)
      audioWorkletNodeRef.current = null
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect()
      setScriptProcessor(null)
      scriptProcessorRef.current = null
    }
    
    setIsRecording(false)
    addDebugLog('Recording stopped')
  }, [addDebugLog])

  // Leave interview function
  const leaveInterview = useCallback(() => {
    addDebugLog('Leaving interview...')
    
    // Stop all recordings and camera
    stopRecording()
    stopCamera()
    stopSessionRecording()
    
    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    
    // Navigate back
    router.push('/interview/setup')
  }, [stopRecording, stopCamera, stopSessionRecording, router])

  // Start interview automatically
  const startInterview = useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    
    addDebugLog('Starting interview automatically...')
    setIsInterviewStarted(true)
    
    // Start camera first
    await startCamera()
    
    // Start session recording
    await startSessionRecording()
    
    // Start audio recording for AI interaction
    await startRecording()
    
    addDebugLog('Interview started successfully')
  }, [startCamera, startSessionRecording, startRecording, addDebugLog])

  const playAudioResponse = useCallback(async (audioBase64: string) => {
    try {
      setIsAiSpeaking(true);
      addDebugLog('Decoding WAV audio response...');
      
      // Decode base64 to binary data
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      // Create blob from WAV data
      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element for playback
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        addDebugLog('Audio response playback finished');
        setIsAiSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      audio.onerror = (error) => {
        addDebugLog(`Audio playback error: ${error}`);
        setIsAiSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      addDebugLog('Playing WAV audio response');
      await audio.play();
      
    } catch (error) {
      addDebugLog(`Error playing audio response: ${error}`);
      setIsAiSpeaking(false);
    }
  }, [addDebugLog]);

  // Initialize WebSocket connection
  useEffect(() => {
    addDebugLog(`Component mounted for session: ${sessionId}`)
    
    const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`)
    addDebugLog(`Connecting to WebSocket: ${WS_URL}/ws/${sessionId}`)
    
    ws.onopen = () => {
      addDebugLog('WebSocket connected successfully')
      setIsConnected(true)
      setWebsocket(ws)
      websocketRef.current = ws
      
      // Start interview automatically when WebSocket connects
      startInterview()
    }
    
    ws.onmessage = (event) => {
      addDebugLog(`Received WebSocket message: ${event.data}`)
      try {
        const data: InterviewResponse = JSON.parse(event.data)
        setTranscription(data.transcription || '')
        setResponse(data.response || '')
        setIsProcessing(false)
        
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current)
          processingTimeoutRef.current = null
        }
        
        if (data.audio_response) {
          playAudioResponse(data.audio_response)
        }
      } catch (error) {
        addDebugLog(`Error parsing WebSocket message: ${error}`)
      }
    }
    
    ws.onerror = (error) => {
      addDebugLog(`WebSocket error: ${error}`)
    }
    
    ws.onclose = () => {
      addDebugLog('WebSocket disconnected')
      setIsConnected(false)
    }
    
    return () => {
      // Don't close WebSocket here, let leaveInterview handle it
    }
  }, [sessionId, addDebugLog, playAudioResponse, startInterview])

  // Determine Serin state based on current conditions
  const getSerinState = useCallback((): SerinState => {
    if (!isConnected) return 'error'
    if (isAiSpeaking) return 'speaking'
    if (isProcessing) return 'processing'
    if (isRecording) return 'listening'
    return 'idle'
  }, [isConnected, isAiSpeaking, isProcessing, isRecording])

  // Cleanup on unmount - only when component is actually unmounting
  useEffect(() => {
    return () => {
      // Only cleanup if component is unmounting (not just re-rendering)
      addDebugLog('Component unmounting, cleaning up resources')
      stopRecording()
      stopCamera()
      stopSessionRecording()
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, []) // Empty dependency array - only runs on unmount

  return (
    <div className="fixed inset-0 bg-black">
      {/* Full Screen Camera Background */}
      <FullScreenCamera
        videoStream={videoStream}
        isCameraOn={isCameraOn}
        className="absolute inset-0"
      />
      
      {/* Minimal Controls Overlay */}
      <MinimalControls
        onLeaveInterview={leaveInterview}
        onDownloadRecording={sessionRecordingUrl ? downloadSessionRecording : undefined}
        hasRecording={!!sessionRecordingUrl}
        isConnected={isConnected}
        isRecording={isRecording}
        isAiSpeaking={isAiSpeaking}
      />
      
      {/* Serin Sphere - Bottom Right Corner */}
      <div className="absolute bottom-8 right-8 w-32 h-32 z-20">
        <SerinScene
          state={getSerinState()}
          isConnected={isConnected}
          className="w-full h-full"
        />
      </div>
      
      {/* Subtle Status Text - Bottom Left */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-white text-sm font-medium">
            {getSerinState() === 'idle' && 'Ready'}
            {getSerinState() === 'listening' && 'Listening...'}
            {getSerinState() === 'processing' && 'Processing...'}
            {getSerinState() === 'speaking' && 'AI Speaking'}
            {getSerinState() === 'error' && 'Connection Error'}
          </p>
        </div>
      </div>
    </div>
  )
}
