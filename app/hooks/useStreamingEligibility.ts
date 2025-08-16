import { useState, useEffect } from 'react';

interface StreamingSession {
  roomId: string;
  role: 'host' | 'viewer';
  duration: number | null;
  completedAt: string;
}

interface StreamingStats {
  eligible: boolean;
  latestSession: StreamingSession | null;
}

export function useStreamingEligibility(userId: string | null) {
  const [stats, setStats] = useState<StreamingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEligibility = async () => {
    if (!userId) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/streaming-stats?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch streaming stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching streaming eligibility:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch eligibility on mount and when userId changes
  useEffect(() => {
    fetchEligibility();
  }, [userId]);

  // Refresh eligibility (useful after user completes a stream)
  const refreshEligibility = () => {
    fetchEligibility();
  };

  return {
    eligible: stats?.eligible ?? false,
    latestSession: stats?.latestSession ?? null,
    loading,
    error,
    refreshEligibility
  };
}
