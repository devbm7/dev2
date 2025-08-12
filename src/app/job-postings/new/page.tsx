"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { getUserProfile, UserProfile } from "@/lib/profile-client";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function CreateJobPostingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState({
    template_name: "",
    job_role: "",
    job_description: "",
    difficulty_level: "",
    estimated_duration: "",
    is_active: true,
    status: "draft",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setProfileLoading(true);
      getUserProfile(user.id).then((p) => {
        setProfile(p);
        setProfileLoading(false);
      });
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  // Only allow hiring managers
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You must be signed in to create a job posting.</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Loading your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!profile || profile.account_type !== "hiring_manager") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authorization Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Error: Authorization required for Job Creation. Only hiring managers can create job postings.</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrgChange = (id: string | null, _name: string) => {
    setOrgId(id);
  };

  const validate = () => {
    if (!form.template_name.trim()) return "Job Title is required.";
    if (!form.job_role.trim()) return "Job Role is required.";
    if (!form.job_description.trim()) return "Job Description is required.";
    if (!orgId) return "Organization is required.";
    if (!form.status) return "Status is required.";
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
    const { error: insertError } = await supabase
      .from('job_templates')
      .insert({
        template_name: form.template_name,
        job_role: form.job_role,
        difficulty_level: form.difficulty_level || null,
        estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : null,
        created_at: null, // let DB default
        is_active: form.is_active,
        initial_json_schema: null,
        final_json_schema: null,
        organization_id: orgId,
        description: null, // not collected
        created_by: user.id,
      });
    if (insertError) {
      setError(insertError.message || 'Failed to create job posting.');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
    setForm({
      template_name: "",
      job_role: "",
      job_description: "",
      difficulty_level: "",
      estimated_duration: "",
      is_active: true,
      status: "draft",
    });
    setOrgId(null);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Job Posting Created!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">Your job posting has been created.</p>
            <Button className="w-full" onClick={() => setSuccess(false)}>Create Another</Button>
            <Button variant="outline" className="w-full mt-2" onClick={() => router.push("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create Job Posting</CardTitle>
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
                <Label>Job Description *</Label>
                <Textarea
                  value={form.job_description}
                  onChange={(e) => handleChange("job_description", e.target.value)}
                  placeholder="Describe the job responsibilities, requirements, and expectations."
                  required
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
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => handleChange("is_active", v)} />
              </div>
              <div className="space-y-2">
                <OrganizationSelector
                  value={orgId}
                  onChange={handleOrgChange}
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white" disabled={submitting}>
                {submitting ? "Creating..." : "Create Job Posting"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
