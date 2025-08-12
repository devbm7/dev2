"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { createClient } from '@/lib/supabase';

import { AppNavigation } from "@/components/ui/app-navigation";
import { DarkModeWrapper } from "@/components/ui/dark-mode-wrapper";
import GlareHover from '@/components/ui/animations/GlareHover/GlareHover';

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

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "cancelled", label: "Cancelled" },
];

const RATING_OPTIONS = [
  { value: "all", label: "All Ratings" },
  { value: "excellent", label: "Excellent (8-10)" },
  { value: "good", label: "Good (6-7)" },
  { value: "average", label: "Average (4-5)" },
  { value: "poor", label: "Poor (1-3)" },
];

export default function InterviewResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const fetchSessions = useCallback(async () => {
    if (!user) {
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
      setSessions([]);
      setLoading(false);
      return;
    }

    if (!profileData?.organization_id) {
      setSessions([]);
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
      setSessions([]);
      setLoading(false);
      return;
    }

    if (!jobTemplates || jobTemplates.length === 0) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const templateIds = jobTemplates.map(template => template.template_id);

    // Then fetch interview sessions for those job templates
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
      .in('template_id', templateIds)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching interview sessions:', error);
    } else {
      setSessions(data || []);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSessions();
    }
  }, [authLoading, fetchSessions]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.job_template?.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.job_template?.job_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.session_information?.job_role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    
    let matchesRating = true;
    if (ratingFilter !== "all" && session.Interview_report?.evaluation_summary?.overall_score) {
      const score = session.Interview_report.evaluation_summary.overall_score;
      switch (ratingFilter) {
        case "excellent":
          matchesRating = score >= 8;
          break;
        case "good":
          matchesRating = score >= 6 && score < 8;
          break;
        case "average":
          matchesRating = score >= 4 && score < 6;
          break;
        case "poor":
          matchesRating = score < 4;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesRating;
  });

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
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
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
              <p className="text-gray-600">You must be signed in to view interview results.</p>
              <Button className="mt-4 w-full" onClick={() => router.push("/login")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </DarkModeWrapper>
    );
  }

  return (
    <DarkModeWrapper>
      <div className="min-h-screen bg-background">
        <AppNavigation showThemeToggle={true} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Interview Results</h1>
              <p className="text-muted-foreground">View and analyze interview sessions for your organization</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Search</Label>
                  <Input
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Sessions */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse w-full">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No interview sessions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" || ratingFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "No interview sessions have been conducted yet for your organization's jobs."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <GlareHover
                  key={session.session_id}
                  glareColor="#3b82f6"
                  glareOpacity={0.1}
                  glareAngle={-30}
                  glareSize={150}
                  transitionDuration={400}
                  playOnce={false}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer w-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground truncate">
                            {session.job_template?.template_name || session.session_information?.job_role || "Unknown Job"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.job_template?.organization?.org_name || "Unknown Organization"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/interview-results/${session.session_id}`)}>
                              View Details
                            </DropdownMenuItem>
                            {session.recording_url && (
                              <DropdownMenuItem onClick={async () => {
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
                              }}>
                                View Recording
                              </DropdownMenuItem>
                            )}
                            {session.resume_url && (
                              <DropdownMenuItem onClick={async () => {
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
                              }}>
                                View Resume
                              </DropdownMenuItem>
                            )}
                            {session.interview_report_pdf_url && (
                              <DropdownMenuItem onClick={async () => {
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
                              }}>
                                Download PDF Report
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(session.status)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          {getRatingBadge(session.Interview_report?.evaluation_summary?.overall_score || 0)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Duration:</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatDuration(session.start_time || "", session.end_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Started:</span>
                          <span className="text-sm font-medium text-foreground">
                            {session.start_time ? new Date(session.start_time).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        
                      </div>
                    </CardContent>
                  </Card>
                </GlareHover>
              ))}
            </div>
          )}
        </div>
      </div>
    </DarkModeWrapper>
  );
}
