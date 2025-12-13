'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  teacherCount: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  classCount: number;
}

interface EnrolledClass {
  id: string;
  name: string;
  academyName: string;
  videoCount: number;
}

export default function StudentDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes] = await Promise.all([
        fetch('/api/explore/academies'),
        fetch('/api/classes'),
      ]);

      const [academiesResult, classesResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
      ]);

      if (Array.isArray(academiesResult)) {
        setAcademies(academiesResult);
      }

      if (classesResult.success && Array.isArray(classesResult.data)) {
        setEnrolledClasses(classesResult.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          academyName: c.academy?.name || 'Unknown',
          videoCount: c._count?.videos || 0,
        })));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async (academyId: string) => {
    try {
      const response = await fetch(`/api/explore/academies/${academyId}/teachers`);
      const result = await response.json();

      if (Array.isArray(result)) {
        setTeachers(result.map((t: any) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          classCount: t.classCount || 0,
        })));
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const handleSelectAcademy = (academy: Academy) => {
    setSelectedAcademy(academy);
    loadTeachers(academy.id);
  };

  const handleRequestEnrollment = async (teacherId: string) => {
    if (!selectedAcademy) return;

    try {
      const response = await fetch('/api/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyId: selectedAcademy.id,
          teacherId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Request sent to teacher!');
        setShowBrowse(false);
        setSelectedAcademy(null);
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const hasClasses = enrolledClasses.length > 0;

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasClasses && !showBrowse) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join an Academy First</h2>
            <p className="text-gray-600 mb-8">
              You need to join an academy and enroll in classes to start learning.
            </p>
            <button
              onClick={() => setShowBrowse(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Academies
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showBrowse) {
    if (selectedAcademy) {
      return (
        <DashboardLayout role="STUDENT">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAcademy.name}</h1>
                <p className="text-gray-600 text-sm mt-1">Select a teacher to request enrollment</p>
              </div>
              <button
                onClick={() => setSelectedAcademy(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Academies
              </button>
            </div>

            <div className="grid gap-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{teacher.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{teacher.email}</p>
                      <p className="text-gray-500 text-sm">{teacher.classCount} classes available</p>
                    </div>
                    <button
                      onClick={() => handleRequestEnrollment(teacher.id)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                    >
                      Request to Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout role="STUDENT">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Browse Academies</h1>
            <button
              onClick={() => setShowBrowse(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>

          <div className="grid gap-4">
            {academies.map((academy) => (
              <div key={academy.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{academy.name}</h3>
                    {academy.description && (
                      <p className="text-gray-600 text-sm mb-2">{academy.description}</p>
                    )}
                    <p className="text-gray-500 text-sm">{academy.teacherCount} teachers</p>
                  </div>
                  <button
                    onClick={() => handleSelectAcademy(academy)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                  >
                    View Teachers
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-500 text-sm mt-1">Continue learning</p>
          </div>
          <button
            onClick={() => setShowBrowse(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Join More Classes
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledClasses.map((classItem) => (
            <Link
              key={classItem.id}
              href={`/dashboard/student/class/${classItem.id}`}
              className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {classItem.name.charAt(0)}
                </div>
                <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                  View →
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {classItem.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{classItem.academyName}</p>
              <p className="text-xs text-gray-400">{classItem.videoCount} videos</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
