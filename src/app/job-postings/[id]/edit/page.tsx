"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from '@/lib/supabase';
import { getUserProfile, UserProfile } from "@/lib/profile-client";
import { AppNavigation } from "@/components/ui/app-navigation";
import { DarkModeWrapper } from "@/components/ui/dark-mode-wrapper";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import ClickSpark from '@/components/ui/animations/ClickSpark/ClickSpark';

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

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

export default function EditJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<JobTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState({
    template_name: "",
    job_role: "",
    job_description: "",
    difficulty_level: "",
    estimated_duration: "",
    is_active: true,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setForm({
        template_name: data.template_name || "",
        job_role: data.job_role || "",
        job_description: data.user_job_description || "",
        difficulty_level: data.difficulty_level || "",
        estimated_duration: data.estimated_duration?.toString() || "",
        is_active: data.is_active,
      });
      setOrgId(data.organization_id);
    }
    
    setLoading(false);
  };

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrgChange = (id: string | null, _name: string) => {
    setOrgId(id);
  };

  const validate = () => {
    if (!form.template_name.trim()) return "Job Title is required.";
    if (!form.job_role.trim()) return "Job Role is required.";
    if (!orgId) return "Organization is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('job_templates')
      .update({
        template_name: form.template_name,
        job_role: form.job_role,
        user_job_description: form.job_description,
        difficulty_level: form.difficulty_level || null,
        estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : null,
        is_active: form.is_active,
        organization_id: orgId,
      })
      .eq('template_id', jobId);
    if (updateError) {
      setError(updateError.message || 'Failed to update job posting.');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
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
              <p className="text-gray-600">You must be signed in to edit job postings.</p>
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
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
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
          <div className="max-w-2xl mx-auto px-4 py-12 pt-24">
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Job not found</h3>
                <p className="text-muted-foreground mb-4">
                  {error || "The job posting you're looking for doesn't exist or you don't have permission to edit it."}
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

  if (success) {
    return (
      <DarkModeWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Job Updated!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">Your job posting has been updated successfully.</p>
              <Button className="w-full mb-2" onClick={() => router.push(`/job-postings/${jobId}`)}>
                View Job
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/job-postings")}>
                Back to Listings
              </Button>
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
        
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/job-postings/${jobId}`)}
              className="text-muted-foreground hover:text-foreground mb-4"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Job Details
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Job Posting</h1>
            <p className="text-muted-foreground">Update your job posting details</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Edit Job Posting</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={form.template_name}
                    onChange={(e) => handleChange("template_name", e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Role *</Label>
                  <Input
                    value={form.job_role}
                    onChange={(e) => handleChange("job_role", e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <Textarea
                    value={form.job_description}
                    onChange={(e) => handleChange("job_description", e.target.value)}
                    placeholder="Describe the job responsibilities, requirements, and expectations."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select
                    value={form.difficulty_level}
                    onValueChange={(v) => handleChange("difficulty_level", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.estimated_duration}
                    onChange={(e) => handleChange("estimated_duration", e.target.value)}
                    placeholder="e.g. 60"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label>Active</Label>
                  <Switch checked={form.is_active} onCheckedChange={(v) => handleChange("is_active", v)} />
                </div>
                <div className="space-y-2">
                  <Label>Organization *</Label>
                  <OrganizationSelector
                    value={orgId}
                    onChange={handleOrgChange}
                    disabled={submitting}
                  />
                </div>
                <ClickSpark
                  sparkCount={10}
                  sparkColor="#3b82f6"
                  sparkSize={4}
                  sparkRadius={50}
                  duration={1000}
                >
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white" disabled={submitting}>
                    {submitting ? "Updating..." : "Update Job Posting"}
                  </Button>
                </ClickSpark>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DarkModeWrapper>
  );
}
