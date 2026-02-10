import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Stream {
  id: string;
  title: string;
  classId: string;
  classSlug?: string;
  className: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  zoomMeetingId: string | null;
  zoomStartUrl?: string;
  zoomLink?: string;
  recordingId: string | null;
  participantCount?: number | null;
  participantsFetchedAt?: string | null;
  bunnyStatus?: number | null;
}

export interface Class {
  id: string;
  name: string;
}

export function useStreamsData() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadAcademyName = useCallback(async () => {
    try {
      const response = await apiClient('/requests/teacher');
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        setAcademyName(result[0].academyName);
      }
    } catch (error) {
      console.error('Error loading academy name:', error);
    }
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      const response = await apiClient('/classes');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }, []);

  const loadStreams = useCallback(async () => {
    try {
      const response = await apiClient('/live/history');
      const result = await response.json();
      if (result.success) {
        setStreams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRecordingAvailability = useCallback(async () => {
    const endedWithoutRecording = streams.filter(
      s => s.status === 'ended' && !s.recordingId && s.zoomMeetingId
    );

    if (endedWithoutRecording.length === 0) return;

    try {
      const checks = endedWithoutRecording.map(async (stream) => {
        const response = await apiClient(`/live/${stream.id}/check-recording`);
        const result = await response.json();
        
        if (result.success && result.recordingId) {
          setStreams(prev => prev.map(s => 
            s.id === stream.id 
              ? { ...s, recordingId: result.recordingId, bunnyStatus: result.bunnyStatus }
              : s
          ));
        }
      });

      await Promise.all(checks);
    } catch (error) {
      console.error('Error checking recording availability:', error);
    }
  }, [streams]);

  useEffect(() => {
    loadStreams();
    loadAcademyName();
    loadClasses();
    
    const pollInterval = setInterval(() => {
      loadStreams();
      checkRecordingAvailability();
    }, 10000);
    
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    streams,
    setStreams,
    classes,
    academyName,
    loading,
    loadStreams,
  };
}
