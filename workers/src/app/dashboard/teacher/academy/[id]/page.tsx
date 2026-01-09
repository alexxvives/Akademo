'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  memberships: Array<{
    id: string;
    status: string;
    requestedAt: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
  classes: Array<{
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    _count: {
      enrollments: number;
      videos: number;
      documents: number;
    };
  }>;
}

export default function AcademyManagePage() {
  const params = useParams();
  const academyId = params.id as string;
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classFormData, setClassFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (academyId) loadAcademy();
  }, [academyId]);

  const loadAcademy = async () => {
    try {
      const response = await fetch(`/api/academies/${academyId}`);
      const result = await response.json();
      if (result.success) setAcademy(result.data);
    } catch (error) {
      console.error('Failed to load academy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (membershipId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) loadAcademy();
      else alert(result.error || 'Failed to update membership');
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient('/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...classFormData, academyId }),
      });
      const result = await response.json();
      if (result.success) {
        setClassFormData({ name: '', description: '' });
        setShowClassForm(false);
        loadAcademy();
      } else {
        alert(result.error || 'Failed to create class');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!academy) {
    return (
      <>
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-gray-500">Academy not found</p>
          <Link href="/dashboard/teacher" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  const pendingMemberships = academy.memberships.filter((m) => m.status === 'PENDING');
  const approvedMemberships = academy.memberships.filter((m) => m.status === 'APPROVED');

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{academy.name}</h1>
            {academy.description && <p className="text-gray-500 text-sm mt-1">{academy.description}</p>}
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{approvedMemberships.length} members</span>
            <span>{academy.classes.length} classes</span>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingMemberships.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 mb-3">
              {pendingMemberships.length} pending request{pendingMemberships.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {pendingMemberships.map((membership) => (
                <div key={membership.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-lg p-3 border border-amber-100">
                  <div>
                    <p className="font-medium text-gray-900">{membership.user.firstName} {membership.user.lastName}</p>
                    <p className="text-sm text-gray-500">{membership.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReject(membership.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(membership.id, 'REJECTED')}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
            <button
              onClick={() => setShowClassForm(!showClassForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Add Class
            </button>
          </div>

          {showClassForm && (
            <form onSubmit={handleCreateClass} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name</label>
                  <input
                    type="text"
                    required
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., Introduction to JavaScript"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                  <textarea
                    value={classFormData.description}
                    onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm">
                    Create Class
                  </button>
                  <button type="button" onClick={() => setShowClassForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {academy.classes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No classes yet</h3>
              <p className="text-gray-500 text-sm">Create your first class to start teaching</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {academy.classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/dashboard/teacher/class/${classItem.slug || classItem.id}`}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {classItem.name}
                    </h4>
                    <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                      Manage →
                    </span>
                  </div>
                  {classItem.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{classItem.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{classItem._count.enrollments} students</span>
                    <span>{classItem._count.videos} videos</span>
                    <span>{classItem._count.documents} docs</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members ({approvedMemberships.length})</h2>
          {approvedMemberships.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No members yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedMemberships.map((membership) => (
                <div key={membership.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{membership.user.firstName} {membership.user.lastName}</p>
                  <p className="text-sm text-gray-500">{membership.user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
