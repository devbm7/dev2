'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase'
import { Upload, FileText, X, Download, Eye } from 'lucide-react'

interface ResumeUploadProps {
  userId: string
  currentResumeUrl?: string | null
  currentResumeFilename?: string | null
  onResumeUpdate: (url: string | null, filename: string | null) => void
  disabled?: boolean
}

export function ResumeUpload({ 
  userId, 
  currentResumeUrl, 
  currentResumeFilename, 
  onResumeUpdate, 
  disabled = false 
}: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const supabase = createClient()
      
      // Create a unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const filename = `resume_${timestamp}.${fileExtension}`
      const filePath = `${userId}/${filename}`

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get the file path (store this in DB/profile)
      // No need to get public URL
      // const filePath = `${userId}/${filename}`

      // Delete old resume if it exists
      if (currentResumeUrl) {
        await deleteCurrentResume()
      }

      // Update the profile with new resume info (store file path, not URL)
      onResumeUpdate(filePath, file.name)

    } catch (error) {
      console.error('Error uploading resume:', error)
      setError('Failed to upload resume. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Utility to extract file path from either a full URL or a file path
  function getFilePath(resumeUrlOrPath: string | null | undefined): string {
    if (!resumeUrlOrPath) return '';
    // If it's a full URL, extract the path after /resumes/
    const match = resumeUrlOrPath.match(/resumes\/(.*)$/);
    return match ? match[1] : resumeUrlOrPath;
  }

  const deleteCurrentResume = async () => {
    if (!currentResumeUrl) return

    try {
      const supabase = createClient()
      const filePath = getFilePath(currentResumeUrl)

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('resumes')
        .remove([filePath])

      if (deleteError) {
        console.error('Error deleting old resume:', deleteError)
      }
    } catch (error) {
      console.error('Error deleting old resume:', error)
    }
  }

  const handleDeleteResume = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await deleteCurrentResume()
      onResumeUpdate(null, null)
    } catch (error) {
      console.error('Error deleting resume:', error)
      setError('Failed to delete resume. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (currentResumeUrl) {
      const supabase = createClient()
      const filePath = getFilePath(currentResumeUrl)
      // Generate signed URL for download
      const { data: downloadData, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60) // 60 seconds validity
      if (error || !downloadData?.signedUrl) {
        setError('Failed to generate download link.')
        return
      }
      const link = document.createElement('a')
      link.href = downloadData.signedUrl
      link.download = currentResumeFilename || 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleView = async () => {
    if (currentResumeUrl) {
      const supabase = createClient()
      const filePath = getFilePath(currentResumeUrl)
      // Generate signed URL for view
      const { data: viewData, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60) // 60 seconds validity
      if (error || !viewData?.signedUrl) {
        setError('Failed to generate view link.')
        return
      }
      window.open(viewData.signedUrl, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      <Label>Resume</Label>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {currentResumeUrl ? (
        <div className="border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentResumeFilename || 'Resume.pdf'}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleView}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={disabled}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteResume}
                disabled={disabled || isDeleting}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload your resume
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PDF files only, max 10MB
                </span>
              </label>
              <input
                id="resume-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={disabled || isUploading}
                className="sr-only"
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!currentResumeUrl && (
        <div className="text-xs text-gray-500">
          <p>• Only PDF files are accepted</p>
          <p>• Maximum file size: 10MB</p>
          <p>• Your resume will be stored securely</p>
        </div>
      )}
    </div>
  )
}
