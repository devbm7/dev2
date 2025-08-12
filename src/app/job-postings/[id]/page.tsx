"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from '@/lib/supabase';
import { getUserProfile, UserProfile } from "@/lib/profile-client";
import { AppNavigation } from "@/components/ui/app-navigation";
import { DarkModeWrapper } from "@/components/ui/dark-mode-wrapper";
import GlareHover from '@/components/ui/animations/GlareHover/GlareHover';
import ClickSpark from '@/components/ui/animations/ClickSpark/ClickSpark';

interface JobTemplate {
  template_id: string;
  template_name: string;
  job_role: string;
  difficulty_level: string | null;
  estimated_duration: number | null;
  is_active: boolean;
  created_at: string;
  organization_id: string;
  created_by: string;
  description: string | null;
  user_job_description: string | null;
  organization?: {
    organization_id: string;
    org_name: string;
    org_website: string | null;
    org_description: string | null;
  };
}

export default function JobDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<JobTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      getUserProfile(user.id).then((p) => {
        setProfile(p);
      });
    }
  }, [user]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, user]);

  const fetchJob = async () => {
    if (!user || !jobId) return;
    
    setLoading(true);
    const supabase = createClient();
    
    // Fetch the job from any organization
    const { data, error } = await supabase
      .from('job_templates')
      .select(`
        *,
        organization:organization_details(organization_id, org_name, org_website, org_description)
      `)
      .eq('template_id', jobId)
      .single();
    
    if (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
    } else {
      setJob(data);
    }
    
    setLoading(false);
  };



  const handleDeleteJob = async () => {
    if (!job) return;
    
    const supabase = createClient();
    
    const { error } = await supabase
      .from('job_templates')
      .delete()
      .eq('template_id', job.template_id);
    
    if (error) {
      console.error('Error deleting job:', error);
    } else {
      router.push('/job-postings');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
    ) : (
      <Badge variant="secondary">Draft</Badge>
    );
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    if (!difficulty) return null;
    
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800", 
      hard: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };

  if (!user) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">You must be signed in to view job details.</p>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  if (error || !job) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen bg-background">
          <AppNavigation showThemeToggle={true} />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Job not found</h3>
                <p className="text-muted-foreground mb-4">
                  {error || "The job posting you're looking for doesn't exist or you don't have permission to view it."}
                </p>
                <Button onClick={() => router.push("/job-postings")}>
                  Back to Job Listings
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
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/job-postings")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Listings
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{job.template_name}</h1>
              <p className="text-muted-foreground">{job.organization?.org_name || "Unknown Organization"}</p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <ClickSpark
                sparkCount={6}
                sparkColor="#3b82f6"
                sparkSize={3}
                sparkRadius={30}
                duration={600}
              >
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/job-postings/${job.template_id}/edit`)}
                >
                  Edit
                </Button>
              </ClickSpark>
              <ClickSpark
                sparkCount={6}
                sparkColor="#dc2626"
                sparkSize={3}
                sparkRadius={30}
                duration={600}
              >
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </Button>
              </ClickSpark>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Overview */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                      Job Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                        <p className="text-foreground font-medium mt-1">{job.template_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Job Role</Label>
                        <p className="text-foreground font-medium mt-1">{job.job_role}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                        <p className="text-foreground font-medium mt-1">{job.organization?.org_name || "Unknown"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                        <p className="text-foreground font-medium mt-1">
                          {new Date(job.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Job Details */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Job Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Difficulty Level</Label>
                        <div className="mt-1">
                          {getDifficultyBadge(job.difficulty_level) || (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Estimated Duration</Label>
                        <p className="text-foreground font-medium mt-1">
                          {job.estimated_duration ? `${job.estimated_duration} minutes` : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Organization Info */}
              {job.organization?.org_description && (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Organization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{job.organization.org_description}</p>
                    </CardContent>
                  </Card>
                </GlareHover>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
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
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                      {getStatusBadge(job.is_active)}
                    </div>
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Quick Actions */}
              <GlareHover
                glareColor="#8b5cf6"
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
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      onClick={() => router.push(`/job-postings/${job.template_id}/edit`)}
                    >
                      Edit Job
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/interview/setup?jobId=${job.template_id}`)}
                    >
                      Start Interview
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/job-postings/${job.template_id}/duplicate`)}
                    >
                      Duplicate
                    </Button>
                  </CardContent>
                </Card>
              </GlareHover>

              {/* Job Statistics */}
              <GlareHover
                glareColor="#06b6d4"
                glareOpacity={0.05}
                glareAngle={-30}
                glareSize={150}
                transitionDuration={500}
                playOnce={false}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Interviews</span>
                      <span className="text-foreground font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Candidates</span>
                      <span className="text-foreground font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                      <span className="text-foreground font-medium">0%</span>
                    </div>
                  </CardContent>
                </Card>
              </GlareHover>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job Posting</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete &quot;{job.template_name}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteJob}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DarkModeWrapper>
  );
}
