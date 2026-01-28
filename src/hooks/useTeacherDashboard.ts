import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Academy {
  id: string;
  name: string;
  description: string | null;
}

export interface Membership {
  id: string;
  status: string;
  academyName: string;
  academyDescription: string | null;
  requestedAt: string;
}

export interface Class {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  academyName: string;
  enrollmentCount: number;
  students?: Student[];
  zoomAccountName?: string | null;
  videoCount?: number;
  documentCount?: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastActive: string | null;
  totalWatchTime?: number;
}

export interface PendingEnrollment {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
  };
  enrolledAt: string;
}

export interface RatingsData {
  overall: {
    averageRating: number | null;
    totalRatings: number;
    ratedLessons: number;
  };
  lessons: Array<{
    lessonId: string;
    lessonTitle: string;
    className: string;
    classId: string;
    averageRating: number | null;
    ratingCount: number;
  }>;
}

export function useTeacherDashboard() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [availableAcademies, setAvailableAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [academyName, setAcademyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [streamStats, setStreamStats] = useState({ total: 0, avgParticipants: 0, thisMonth: 0, totalHours: 0, totalMinutes: 0 });
  const [classWatchTime, setClassWatchTime] = useState({ hours: 0, minutes: 0 });

  const loadData = useCallback(async () => {
    try {
      const [membershipsRes, academiesRes, classesRes, pendingRes, ratingsRes, rejectedRes, streamsRes] = await Promise.all([
        apiClient('/requests/teacher'),
        apiClient('/explore/academies'),
        apiClient('/classes'),
        apiClient('/enrollments/pending'),
        apiClient('/ratings'),
        apiClient('/enrollments/rejected'),
        apiClient('/live/history'),
      ]);

      const [membershipsResult, academiesResult, classesResult, pendingResult, ratingsResult, rejectedResult, streamsResult] = await Promise.all([
        membershipsRes.json(),
        academiesRes.json(),
        classesRes.json(),
        pendingRes.json(),
        ratingsRes.json(),
        rejectedRes.json(),
        streamsRes.json(),
      ]);

      if (rejectedResult.success && rejectedResult.data) {
        setRejectedCount(rejectedResult.data.count || 0);
      }

      if (streamsResult.success && Array.isArray(streamsResult.data)) {
        const streams = streamsResult.data;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthStreams = streams.filter((s: any) => new Date(s.createdAt) >= thisMonthStart);
        
        const totalParticipants = streams.reduce((sum: number, s: any) => sum + (s.participantCount || 0), 0);
        const totalDuration = streams.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);
        const totalHours = Math.floor(totalDuration / 60);
        const totalMinutes = totalDuration % 60;
        
        setStreamStats({
          total: streams.length,
          avgParticipants: streams.length > 0 ? Math.round(totalParticipants / streams.length) : 0,
          thisMonth: thisMonthStreams.length,
          totalHours: totalHours,
          totalMinutes: totalMinutes,
        });
      }

      // Calculate total class watch time
      // Need to fetch student progress data
      const progressRes = await apiClient('/students/progress');
      const progressResult = await progressRes.json();
      if (progressResult.success && Array.isArray(progressResult.data)) {
        const totalSeconds = progressResult.data.reduce((sum: number, student: any) => sum + (student.totalWatchTime || 0), 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        setClassWatchTime({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
      }

      if (Array.isArray(membershipsResult)) {
        setMemberships(membershipsResult);
        if (membershipsResult.length > 0) {
          setAcademyName(membershipsResult[0].academyName);
        }
      }
      
      if (Array.isArray(academiesResult)) {
        setAvailableAcademies(academiesResult);
      }

      if (pendingResult.success && Array.isArray(pendingResult.data)) {
        setPendingEnrollments(pendingResult.data);
      }

      if (ratingsResult.success) {
        setRatingsData(ratingsResult.data);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        const classList = classesResult.data;
        setClasses(classList);
        
        // Fetch student progress which includes lastActive data
        const allStudents: EnrolledStudent[] = [];
        if (progressResult.success && Array.isArray(progressResult.data)) {
          // Map progress data to EnrolledStudent format
          for (const student of progressResult.data) {
            allStudents.push({
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              email: student.email,
              classId: student.classId,
              className: student.className,
              lessonsCompleted: student.lessonsCompleted || 0,
              totalLessons: student.totalLessons || 0,
              lastActive: student.lastActive || null,
              totalWatchTime: student.totalWatchTime || 0,
            });
          }
        }
        setEnrolledStudents(allStudents);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    memberships,
    availableAcademies,
    classes,
    enrolledStudents,
    pendingEnrollments,
    ratingsData,
    academyName,
    loading,
    rejectedCount,
    streamStats,
    classWatchTime,
    loadData,
  };
}
