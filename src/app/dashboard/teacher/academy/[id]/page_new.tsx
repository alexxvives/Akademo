'use client';

import { useEffect, useState } from 'react';
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
  const [classFormData, setClassFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (academyId) {
      loadAcademy();
    }
  }, [academyId]);

  const loadAcademy = async () => {
    try {
      const response = await fetch(`/api/academies/${academyId}`);
      const result = await response.json();

      if (result.success) {
        setAcademy(result.data);
      }
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

      if (result.success) {
        alert(`✅ Student ${status.toLowerCase()} successfully!`);
        loadAcademy();
      } else {
        alert(result.error || 'Failed to update membership');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...classFormData,
          academyId: academyId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Class created successfully!');
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
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading academy...</p>
          </div>
        </div>
      </>
    );
  }

  if (!academy) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Academy not found</h3>
            <p className="text-gray-600 mb-6">The academy you're looking for doesn't exist.</p>
            <Link
              href="/dashboard/teacher"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  const pendingMemberships = academy.memberships.filter((m) => m.status === 'PENDING');
  const approvedMemberships = academy.memberships.filter((m) => m.status === 'APPROVED');

  return (
    <>
      <div className="space-y-8">
        {/* Academy Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                  {academy.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{academy.name}</h1>
                  {academy.description && (
                    <p className="text-indigo-100 text-lg">{academy.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                  <span className="font-semibold">{approvedMemberships.length} Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                  </svg>
                  <span className="font-semibold">{academy.classes.length} Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                  </svg>
                  <span className="font-semibold">
                    {academy.classes.reduce((sum, c) => sum + c._count.videos, 0)} Videos
                  </span>
                </div>
                {pendingMemberships.length > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-semibold">{pendingMemberships.length} Pending</span>
                  </div>
                )}
              </div>
            </div>
            
            <Link
              href="/dashboard/teacher"
              className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 font-bold transition-all"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Pending Membership Requests */}
        {pendingMemberships.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending Requests ({pendingMemberships.length})
                </h2>
                <p className="text-gray-600">Review and approve student membership requests</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex justify-between items-center p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {membership.user.firstName[0]}{membership.user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {membership.user.firstName} {membership.user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{membership.user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        🕒 Requested: {new Date(membership.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveReject(membership.id, 'APPROVED')}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(membership.id, 'REJECTED')}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Classes ({academy.classes.length})
              </h2>
              <p className="text-gray-600 mt-1">Manage your courses and content</p>
            </div>
            <button
              onClick={() => setShowClassForm(!showClassForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Create Class
            </button>
          </div>

          {/* Create Class Form */}
          {showClassForm && (
            <form onSubmit={handleCreateClass} className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Class</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={classFormData.name}
                    onChange={(e) =>
                      setClassFormData({ ...classFormData, name: e.target.value })
                    }
                    placeholder="e.g., Introduction to React"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={classFormData.description}
                    onChange={(e) =>
                      setClassFormData({
                        ...classFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Describe what students will learn..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg transition-all"
                  >
                    Create Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClassForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Classes List */}
          {academy.classes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
              <p className="text-gray-600">Create your first class to start sharing content with students!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {academy.classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/dashboard/teacher/class/${classItem.id}`}
                  className="group block p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {classItem.name.charAt(0)}
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Active
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">
                    {classItem.name}
                  </h3>
                  {classItem.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {classItem.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="font-bold text-blue-600">{classItem._count.enrollments}</p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="font-bold text-purple-600">{classItem._count.videos}</p>
                      <p className="text-xs text-gray-600">Videos</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="font-bold text-green-600">{classItem._count.documents}</p>
                      <p className="text-xs text-gray-600">Docs</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                    Manage Class
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members List */}
        {approvedMemberships.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Active Members ({approvedMemberships.length})
                </h2>
                <p className="text-gray-600">Students enrolled in your academy</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {approvedMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {membership.user.firstName[0]}{membership.user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {membership.user.firstName} {membership.user.lastName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{membership.user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
