const API_BASE_URL = 'https://your-nextjs-app.vercel.app'; // Replace with your actual Vercel app URL

export interface InterviewSession {
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewResponse {
  message: string;
  session_id?: string;
  data?: any;
}

export class InterviewClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${API_BASE_URL}/api/interview`;
  }

  async createSession(jobDescription?: string): Promise<InterviewResponse> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  async getSession(sessionId: string): Promise<InterviewSession> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  async sendMessage(sessionId: string, message: string): Promise<InterviewResponse> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadResume(sessionId: string, file: File): Promise<InterviewResponse> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${this.baseUrl}/session/${sessionId}/resume`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload resume: ${response.statusText}`);
    }

    return response.json();
  }

  async endSession(sessionId: string): Promise<InterviewResponse> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to end session: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionResults(sessionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/results`);

    if (!response.ok) {
      throw new Error(`Failed to get session results: ${response.statusText}`);
    }

    return response.json();
  }

  // WebSocket connection for real-time communication
  createWebSocketConnection(sessionId: string): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws') + `/ws/${sessionId}`;
    return new WebSocket(wsUrl);
  }
}

// Export a default instance
export const interviewClient = new InterviewClient();
