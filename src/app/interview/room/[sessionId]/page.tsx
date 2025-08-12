'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import InterviewRoom from '@/components/interview/InterviewRoom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SessionInfo {
  session_id: string;
  interview_topic: string;
  status: string;
  asr_model: string;
  llm_model: {
    provider: string;
    model: string;
  };
}
// const ip = "34.124.129.209"
// const baseUrl = `https://${ip}:8000`;
const baseUrl = 'http://localhost:8000';

const InterviewRoomPage: React.FC = () => {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionInfo = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
      } else {
        setError('Session not found or invalid');
      }
    } catch (error) {
      console.error('Failed to fetch session info:', error);
      setError('Failed to load session information');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionInfo();
  }, [fetchSessionInfo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading interview session...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'Failed to load session information'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionInfo.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Session Not Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This interview session is not active. Please create a new session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InterviewRoom />
    </div>
  );
};

export default InterviewRoomPage; 