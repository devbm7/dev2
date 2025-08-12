'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ip = "34.124.129.209"
// const baseUrl = `https://${ip}:8000`;
const baseUrl = 'http://localhost:8000';

interface JobTemplate {
  template_id: string;
  template_name: string;
  job_role: string;
  difficulty_level: string;
  estimated_duration: number;
  description: string;
}

interface UserResume {
  user_id: string;
  first_name: string;
  last_name: string;
  resume_url: string;
  resume_filename: string;
}

interface JobTemplatesResponse {
  job_templates: JobTemplate[];
}

interface UserResumesResponse {
  user_resumes: UserResume[];
}

const InterviewSetup: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
  const [userResumes, setUserResumes] = useState<UserResume[]>([]);
  const [formData, setFormData] = useState({
    selectedJobTemplate: '',
    selectedUserResume: '',
    jobRole: '',
    userId: '',
    resumeUrl: ''
  });

  // Fetch job templates and user resumes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job templates
        const templatesResponse = await fetch(`${baseUrl}/job-templates`)
        if (templatesResponse.ok) {
          const templatesData: JobTemplatesResponse = await templatesResponse.json()
          setJobTemplates(templatesData.job_templates)
          console.log('Job templates API response:', templatesData)
        } else {
          console.error('Failed to fetch job templates')
        }

        // Only fetch user resumes if user is authenticated
        if (user?.id) {
          const resumesResponse = await fetch(`${baseUrl}/user-resumes/${user.id}`)
          if (resumesResponse.ok) {
            const resumesData: UserResumesResponse = await resumesResponse.json()
            setUserResumes(resumesData.user_resumes)
            console.log('User resumes API response:', resumesData)
          } else {
            console.error('Failed to fetch user resumes')
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    // Only fetch data if user is authenticated and not loading
    if (!authLoading && user?.id) {
      fetchData()
    }
  }, [user?.id, authLoading])

  const handleJobTemplateChange = (templateId: string) => {
    const selectedTemplate = jobTemplates.find(template => template.template_id === templateId);
    setFormData(prev => ({
      ...prev,
      selectedJobTemplate: templateId,
      jobRole: selectedTemplate?.job_role || ''
    }));
  };

  const handleUserResumeChange = (userId: string) => {
    const selectedResume = userResumes.find(resume => resume.user_id === userId);
    setFormData(prev => ({
      ...prev,
      selectedUserResume: userId,
      userId: selectedResume?.user_id || '',
      resumeUrl: selectedResume?.resume_url || ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.selectedJobTemplate || !formData.selectedUserResume) {
      alert('Please select both a job template and a user resume');
      return;
    }

    setIsLoading(true);

    try {
      // Create session
      console.log('Sending session creation request:', {
        job_role: formData.jobRole,
        user_id: formData.userId,
        resume_url: formData.resumeUrl,
        llm_provider: 'gemini',
        llm_model: 'gemini-2.5-flash',
        asr_model: 'openai/whisper-medium'
      });
      
      const sessionResponse = await fetch(`${baseUrl}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_role: formData.jobRole,
          user_id: formData.userId,
          resume_url: formData.resumeUrl,
          llm_provider: 'gemini',
          llm_model: 'gemini-2.5-flash',
          asr_model: 'openai/whisper-medium'
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.text();
        console.error('Session creation failed:', sessionResponse.status, errorData);
        throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorData}`);
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.session_id;

      // Navigate to interview room (session is ready immediately after creation)
      router.push(`/interview/room/${sessionId}`);
      
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create interview session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Authentication Required</p>
                <p className="text-muted-foreground">Please sign in to access the interview setup.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Interview Setup
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Configure your interview session before starting
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Welcome, {user.email}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="job-template">Job Template *</Label>
                <Select
                  value={formData.selectedJobTemplate}
                  onValueChange={handleJobTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job template" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTemplates.map((template) => (
                      <SelectItem key={template.template_id} value={template.template_id}>
                        {template.template_name} - {template.job_role} ({template.difficulty_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.selectedJobTemplate && (
                  <p className="text-sm text-green-600">
                    ✓ Job template selected
                  </p>
                )}
              </div>

              {/* User Resume Selection */}
              <div className="space-y-2">
                <Label htmlFor="user-resume">User Resume *</Label>
                {userResumes.length > 0 ? (
                  <>
                    <Select
                      value={formData.selectedUserResume}
                      onValueChange={handleUserResumeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {userResumes.map((resume) => (
                          <SelectItem key={resume.user_id} value={resume.user_id}>
                            {resume.first_name} {resume.last_name} - {resume.resume_filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.selectedUserResume && (
                      <p className="text-sm text-green-600">
                        ✓ User resume selected
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      No resumes found for your account. Please upload a resume first.
                    </p>
                  </div>
                )}
              </div>


              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.selectedJobTemplate || !formData.selectedUserResume}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSetup; 