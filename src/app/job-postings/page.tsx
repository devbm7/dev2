"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function JobListingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<JobTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserProfile(user.id).then((p) => {
        setProfile(p);
      });
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    const supabase = createClient();
    
    // Fetch all job templates from all organizations
    const query = supabase
      .from('job_templates')
      .select(`
        *,
        organization:organization_details(organization_id, org_name, org_website, org_description)
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs(data || []);
    }
    
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.job_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.organization?.org_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.is_active === (statusFilter === "published");
    const matchesDifficulty = difficultyFilter === "all" || job.difficulty_level === difficultyFilter;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });



  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    
    const supabase = createClient();
    
    const { error } = await supabase
      .from('job_templates')
      .delete()
      .eq('template_id', selectedJob.template_id);
    
    if (error) {
      console.error('Error deleting job:', error);
    } else {
      setJobs(jobs.filter(job => job.template_id !== selectedJob.template_id));
      setSelectedJob(null);
      setShowDeleteDialog(false);
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
              <p className="text-gray-600">You must be signed in to view job listings.</p>
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Job Listings</h1>
              <p className="text-muted-foreground">Manage your job postings and templates</p>
            </div>
            <ClickSpark
              sparkCount={8}
              sparkColor="#3b82f6"
              sparkSize={3}
              sparkRadius={40}
              duration={800}
            >
              <Button 
                onClick={() => router.push("/job-postings/new")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Create New Job
              </Button>
            </ClickSpark>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Search</Label>
                  <Input
                    placeholder="Search jobs..."
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
                  <Label className="text-sm font-medium">Difficulty</Label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option) => (
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

          {/* Job Listings */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No job listings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" || difficultyFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "Get started by creating your first job posting."}
                </p>
                {!searchTerm && statusFilter === "all" && difficultyFilter === "all" && (
                  <Button onClick={() => router.push("/job-postings/new")}>
                    Create Your First Job
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <GlareHover
                  key={job.template_id}
                  glareColor="#3b82f6"
                  glareOpacity={0.1}
                  glareAngle={-30}
                  glareSize={150}
                  transitionDuration={400}
                  playOnce={false}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground truncate">
                            {job.template_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.organization?.org_name || "Unknown Organization"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/job-postings/${job.template_id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/job-postings/${job.template_id}/edit`)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedJob(job);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Role:</span>
                          <span className="text-sm font-medium text-foreground">{job.job_role}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(job.is_active)}
                        </div>
                        
                        {job.difficulty_level && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Difficulty:</span>
                            {getDifficultyBadge(job.difficulty_level)}
                          </div>
                        )}
                        
                        {job.estimated_duration && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Duration:</span>
                            <span className="text-sm font-medium text-foreground">
                              {job.estimated_duration} min
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Created:</span>
                          <span className="text-sm font-medium text-foreground">
                            {new Date(job.created_at).toLocaleDateString()}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job Posting</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete &quot;{selectedJob?.template_name}&quot;? This action cannot be undone.
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
