"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { createClient } from '@/lib/supabase';

import { AppNavigation } from "@/components/ui/app-navigation";
import { DarkModeWrapper } from "@/components/ui/dark-mode-wrapper";
import GlareHover from '@/components/ui/animations/GlareHover/GlareHover';
import ClickSpark from '@/components/ui/animations/ClickSpark/ClickSpark';

// Utility functions to extract file paths from URLs
const getFilePath = (urlOrPath: string | null | undefined): string => {
  if (!urlOrPath) return '';
  // If it's a full URL, extract the path after the bucket name
  const match = urlOrPath.match(/\/([^\/]+\/[^\/]+)$/);
  return match ? match[1] : urlOrPath;
};

const getRecordingPath = (recordingUrl: string | null | undefined): string => {
  if (!recordingUrl) return '';
  // Extract session_id and filename from recording URL
  const match = recordingUrl.match(/interview-recordings\/([^\/]+\/[^?]+)/);
  return match ? match[1] : recordingUrl;
};

const getReportPath = (reportUrl: string | null | undefined): string => {
  if (!reportUrl) return '';
  // Extract session_id from report URL
  const match = reportUrl.match(/\/([^\/]+)\/report\.pdf$/);
  return match ? `${match[1]}/report.pdf` : reportUrl;
};

interface SessionInformation {
  job_role?: string;
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
}

interface InterviewReport {
  evaluation_summary?: {
    overall_score?: number;
    recommendation?: string;
    summary_feedback?: string;
  };
  detailed_scores?: Record<string, {
    overall_score: number;
    feedback?: string;
  }>;
  strengths?: string[];
  areas_for_improvement?: string[];
  follow_up_questions?: string[];
  evaluation_metadata?: {
    evaluated_by: string;
    evaluation_date: string;
    evaluation_version: string;
    job_relevance_score: number;
  };
}

interface InterviewSession {
  session_id: string;
  interviewee_id: string | null;
  template_id: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  session_information: SessionInformation;
  Interview_report: InterviewReport;
  recording_url: string | "";
  resume_url: string | "";
  interview_report_pdf_url: string | "";
  interview_report_pdf_generated_at: string | null;
  job_template?: {
    template_id: string;
    template_name: string;
    job_role: string;
    organization_id: string;
    organization?: {
      organization_id: string;
      org_name: string;
    };
  };
}

export default function InterviewResultDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!user || !sessionId) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    
    // First get the user's organization
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      setError('Failed to load user profile');
      setLoading(false);
      return;
    }

    if (!profileData?.organization_id) {
      setError('You are not associated with any organization');
      setLoading(false);
      return;
    }

    // First get job templates for this organization
    const { data: jobTemplates, error: templatesError } = await supabase
      .from('job_templates')
      .select('template_id')
      .eq('organization_id', profileData.organization_id);

    if (templatesError) {
      console.error('Error fetching job templates:', templatesError);
      setError('Failed to load job templates');
      setLoading(false);
      return;
    }

    if (!jobTemplates || jobTemplates.length === 0) {
      setError('No job templates found for your organization');
      setLoading(false);
      return;
    }

    const templateIds = jobTemplates.map(template => template.template_id);

    // Then fetch the specific session if it belongs to one of our job templates
    const { data, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        job_template:job_templates(
          template_id,
          template_name,
          job_role,
          organization_id,
          organization:organization_details(organization_id, org_name)
        )
      `)
      .eq('session_id', sessionId)
      .in('template_id', templateIds)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      setError('Failed to load interview session');
    } else {
      setSession(data);
    }
    
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => {
    if (sessionId && !authLoading) {
      fetchSession();
    }
  }, [sessionId, authLoading, fetchSession]);

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getRatingBadge = (score: number) => {
    if (!score) return <Badge variant="secondary">No Rating</Badge>;
    
    let color = "bg-gray-100 text-gray-800";
    let label = "Unknown";
    
    if (score >= 8) {
      color = "bg-green-100 text-green-800";
      label = "Excellent";
    } else if (score >= 6) {
      color = "bg-blue-100 text-blue-800";
      label = "Good";
    } else if (score >= 4) {
      color = "bg-yellow-100 text-yellow-800";
      label = "Average";
    } else {
      color = "bg-red-100 text-red-800";
      label = "Poor";
    }
    
    return <Badge className={color}>{label} ({score}/10)</Badge>;
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!startTime || !endTime) return "N/A";
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };

  const renderScoreBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    let color = "bg-gray-300";
    
    if (percentage >= 80) color = "bg-green-500";
    else if (percentage >= 60) color = "bg-blue-500";
    else if (percentage >= 40) color = "bg-yellow-500";
    else color = "bg-red-500";
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Loading authentication...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DarkModeWrapper>
    );
  }

  if (!user) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">You must be signed in to view interview details.</p>
              <Button className="mt-4 w-full" onClick={() => router.push("/login")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </DarkModeWrapper>
    );
  }

  if (loading) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen bg-background">
          <AppNavigation showThemeToggle={true} />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </DarkModeWrapper>
    );
  }

  if (error || !session) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen bg-background">
          <AppNavigation showThemeToggle={true} />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Interview session not found</h3>
                <p className="text-muted-foreground mb-4">
                  {error || "The interview session you're looking for doesn't exist or you don't have permission to view it."}
                </p>
                <Button onClick={() => router.push("/interview-results")}>
                  Back to Interview Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DarkModeWrapper>
    );
  }

  return (
    <DarkModeWrapper>
              <div className="min-h-screen bg-background">
        <AppNavigation showThemeToggle={true} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/interview-results")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Results
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {session.job_template?.template_name || session.session_information?.job_role || "Interview Session"}
              </h1>
              <p className="text-muted-foreground">
                {session.job_template?.organization?.org_name || "Unknown Organization"}
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              {session.recording_url && (
                <ClickSpark
                  sparkCount={6}
                  sparkColor="#3b82f6"
                  sparkSize={3}
                  sparkRadius={30}
                  duration={600}
                >
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const supabase = createClient();
                      const filePath = getRecordingPath(session.recording_url);
                      const { data, error } = await supabase.storage
                        .from('interview-recordings')
                        .createSignedUrl(filePath, 60);
                      if (error || !data?.signedUrl) {
                        console.error('Error generating signed URL for recording:', error);
                        return;
                      }
                      window.open(data.signedUrl, '_blank');
                    }}
                  >
                    View Recording
                  </Button>
                </ClickSpark>
              )}
              {session.resume_url && (
                <ClickSpark
                  sparkCount={6}
                  sparkColor="#10b981"
                  sparkSize={3}
                  sparkRadius={30}
                  duration={600}
                >
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const supabase = createClient();
                      const filePath = getFilePath(session.resume_url);
                      const { data, error } = await supabase.storage
                        .from('resumes')
                        .createSignedUrl(filePath, 60);
                      if (error || !data?.signedUrl) {
                        console.error('Error generating signed URL for resume:', error);
                        return;
                      }
                      window.open(data.signedUrl, '_blank');
                      }}
                  >
                    View Resume
                  </Button>
                </ClickSpark>
              )}
              {session.interview_report_pdf_url && (
                <ClickSpark
                  sparkCount={6}
                  sparkColor="#f59e0b"
                  sparkSize={3}
                  sparkRadius={30}
                  duration={600}
                >
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const supabase = createClient();
                      const filePath = getReportPath(session.interview_report_pdf_url);
                      const { data, error } = await supabase.storage
                        .from('interview-report-pdf')
                        .createSignedUrl(filePath, 60);
                      if (error || !data?.signedUrl) {
                        console.error('Error generating signed URL for PDF report:', error);
                        return;
                      }
                      window.open(data.signedUrl, '_blank');
                    }}
                  >
                    Download PDF
                  </Button>
                </ClickSpark>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Overview */}
              <GlareHover
                glareColor="#3b82f6"
                glareOpacity={0.05}
                glareAngle={-30}
                glareSize={200}
                transitionDuration={500}
                playOnce={false}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Session Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Job Position</Label>
                        <p className="text-foreground font-medium mt-1">
                          {session.job_template?.template_name || session.session_information?.job_role || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(session.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Start Time</Label>
                        <p className="text-foreground font-medium mt-1">
                          {session.start_time ? new Date(session.start_time).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                        <p className="text-foreground font-medium mt-1">
                          {formatDuration(session.start_time || "", session.end_time)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Evaluation Summary */}
              {session.Interview_report && (
                <GlareHover
                  glareColor="#06b6d4"
                  glareOpacity={0.05}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={500}
                  playOnce={false}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Evaluation Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {session.Interview_report.evaluation_summary && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">Overall Rating</span>
                            {getRatingBadge(session.Interview_report.evaluation_summary.overall_score || 0)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Score</span>
                              <span className="text-sm font-medium">
                                {session.Interview_report.evaluation_summary.overall_score}/10
                              </span>
                            </div>
                            {renderScoreBar(session.Interview_report.evaluation_summary.overall_score || 0)}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Recommendation</Label>
                            <p className="text-foreground mt-1">
                              {session.Interview_report.evaluation_summary.recommendation || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Summary Feedback</Label>
                            <p className="text-foreground mt-1">
                              {session.Interview_report.evaluation_summary.summary_feedback || "N/A"}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </GlareHover>
              )}

              {/* Detailed Scores */}
              {session.Interview_report?.detailed_scores && (
                <GlareHover
                  glareColor="#10b981"
                  glareOpacity={0.05}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={500}
                  playOnce={false}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Detailed Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {Object.entries(session.Interview_report.detailed_scores).map(([category, data]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-foreground capitalize">
                            {category.replace(/_/g, ' ')}
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Overall Score</span>
                              <span className="text-sm font-medium">{data.overall_score}/10</span>
                            </div>
                            {renderScoreBar(data.overall_score)}
                          </div>
                          {data.feedback && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Feedback</Label>
                              <p className="text-foreground mt-1 text-sm">{data.feedback}</p>
                            </div>
                          )}
                          <Separator />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </GlareHover>
              )}

              {/* Conversation History */}
              {session.session_information?.conversation_history && (
                <GlareHover
                  glareColor="#8b5cf6"
                  glareOpacity={0.05}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={500}
                  playOnce={false}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Conversation History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {session.session_information.conversation_history.map((message, index) => (
                          <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'assistant' 
                                ? 'bg-gray-100 text-gray-900' 
                                : 'bg-blue-600 text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </GlareHover>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <GlareHover
                glareColor="#f59e0b"
                glareOpacity={0.05}
                glareAngle={-30}
                glareSize={150}
                transitionDuration={500}
                playOnce={false}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.recording_url && (
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          const supabase = createClient();
                          const filePath = getRecordingPath(session.recording_url);
                          const { data, error } = await supabase.storage
                            .from('interview-recordings')
                            .createSignedUrl(filePath, 60);
                          if (error || !data?.signedUrl) {
                            console.error('Error generating signed URL for recording:', error);
                            return;
                          }
                          window.open(data.signedUrl, '_blank');
                        }}
                      >
                        View Recording
                      </Button>
                    )}
                    {session.resume_url && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={async () => {
                          const supabase = createClient();
                          const filePath = getFilePath(session.resume_url);
                          const { data, error } = await supabase.storage
                            .from('resumes')
                            .createSignedUrl(filePath, 60);
                          if (error || !data?.signedUrl) {
                            console.error('Error generating signed URL for resume:', error);
                            return;
                          }
                          window.open(data.signedUrl, '_blank');
                        }}
                      >
                        View Resume
                      </Button>
                    )}
                    {session.interview_report_pdf_url && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={async () => {
                          const supabase = createClient();
                          const filePath = getReportPath(session.interview_report_pdf_url);
                          const { data, error } = await supabase.storage
                            .from('interview-report-pdf')
                            .createSignedUrl(filePath, 60);
                          if (error || !data?.signedUrl) {
                            console.error('Error generating signed URL for PDF report:', error);
                            return;
                          }
                          window.open(data.signedUrl, '_blank');
                        }}
                      >
                        Download PDF Report
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Strengths & Areas for Improvement */}
              {session.Interview_report && (
                <>
                  {session.Interview_report.strengths && session.Interview_report.strengths.length > 0 && (
                    <GlareHover
                      glareColor="#10b981"
                      glareOpacity={0.05}
                      glareAngle={-30}
                      glareSize={150}
                      transitionDuration={500}
                      playOnce={false}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {session.Interview_report.strengths.map((strength, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-foreground">{strength}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </GlareHover>
                  )}

                  {session.Interview_report.areas_for_improvement && session.Interview_report.areas_for_improvement.length > 0 && (
                    <GlareHover
                      glareColor="#ef4444"
                      glareOpacity={0.05}
                      glareAngle={-30}
                      glareSize={150}
                      transitionDuration={500}
                      playOnce={false}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {session.Interview_report.areas_for_improvement.map((area, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-foreground">{area}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </GlareHover>
                  )}

                  {session.Interview_report.follow_up_questions && session.Interview_report.follow_up_questions.length > 0 && (
                    <GlareHover
                      glareColor="#3b82f6"
                      glareOpacity={0.05}
                      glareAngle={-30}
                      glareSize={150}
                      transitionDuration={500}
                      playOnce={false}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Follow-up Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {session.Interview_report.follow_up_questions.map((question, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <span className="text-sm text-foreground">{question}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </GlareHover>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </DarkModeWrapper>
  );
}
