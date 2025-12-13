'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';

interface Class {
  id: string;
  name: string;
  description: string | null;
  academy: {
    id: string;
    name: string;
  };
  videos: Array<{
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number | null;
    maxWatchTimeMultiplier: number;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    enrolledAt: string;
  }>;
}

export default function TeacherClassPage() {
  const params = useParams();
  const classId = params?.id as string;
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    maxWatchTimeMultiplier: 2.0,
    file: null as File | null,
  });

  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (classId) {
      loadClass();
      loadUser();
    }
  }, [classId]);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (result.success) setCurrentUser(result.data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadClass = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      const result = await response.json();
      if (result.success) setClassData(result.data);
    } catch (error) {
      console.error('Failed to load class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFormData.file) return alert('Please select a video file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', videoFormData.file);
      formData.append('title', videoFormData.title);
      formData.append('description', videoFormData.description);
      formData.append('classId', classId);
      formData.append('maxWatchTimeMultiplier', videoFormData.maxWatchTimeMultiplier.toString());

      const response = await fetch('/api/videos', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        setVideoFormData({ title: '', description: '', maxWatchTimeMultiplier: 2.0, file: null });
        setShowVideoForm(false);
        loadClass();
      } else {
        alert(result.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload. Please check that your file is under 100MB and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentFormData.file) return alert('Please select a document file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', documentFormData.file);
      formData.append('title', documentFormData.title);
      formData.append('description', documentFormData.description);
      formData.append('classId', classId);

      const response = await fetch('/api/documents', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.success) {
        setDocumentFormData({ title: '', description: '', file: null });
        setShowDocumentForm(false);
        loadClass();
      } else {
        alert(result.error || 'Failed to upload document');
      }
    } catch (error) {
      alert('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-gray-500">Class not found</p>
          <Link href="/dashboard/teacher" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← {classData.academy.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
          {classData.description && <p className="text-gray-500 text-sm mt-1">{classData.description}</p>}
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            <span>{classData.enrollments.length} students</span>
            <span>{classData.videos.length} videos</span>
            <span>{classData.documents.length} docs</span>
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setShowVideoForm(!showVideoForm); setShowDocumentForm(false); }}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${showVideoForm ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            + Upload Video
          </button>
          <button
            onClick={() => { setShowDocumentForm(!showDocumentForm); setShowVideoForm(false); }}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${showDocumentForm ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            + Upload Document
          </button>
        </div>

        {/* Video Upload Form */}
        {showVideoForm && (
          <form onSubmit={handleVideoUpload} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video File (MP4)</label>
                <input
                  type="file"
                  accept="video/mp4"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 100 * 1024 * 1024) {
                      alert('File size must be under 100MB');
                      e.target.value = '';
                      return;
                    }
                    setVideoFormData({ ...videoFormData, file });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 100MB</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                <textarea
                  value={videoFormData.description}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Watch Time Multiplier</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={videoFormData.maxWatchTimeMultiplier}
                  onChange={(e) => setVideoFormData({ ...videoFormData, maxWatchTimeMultiplier: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Students can watch for this many times the video duration</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={uploading} className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button type="button" onClick={() => setShowVideoForm(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Document Upload Form */}
        {showDocumentForm && (
          <form onSubmit={handleDocumentUpload} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Document File (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setDocumentFormData({ ...documentFormData, file: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={documentFormData.title}
                  onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                <textarea
                  value={documentFormData.description}
                  onChange={(e) => setDocumentFormData({ ...documentFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={uploading} className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button type="button" onClick={() => setShowDocumentForm(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Videos List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Videos ({classData.videos.length})</h2>
          
          {/* Video Player */}
          {selectedVideo && currentUser && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              {(() => {
                const video = classData.videos.find(v => v.id === selectedVideo);
                if (!video) return null;
                return (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                      )}
                    </div>
                    
                    <ProtectedVideoPlayer
                      videoUrl={`/api/video/stream/${video.id}`}
                      videoId={video.id}
                      studentId={currentUser.id}
                      maxWatchTimeMultiplier={video.maxWatchTimeMultiplier}
                      durationSeconds={video.durationSeconds || 0}
                      initialPlayState={{ totalWatchTimeSeconds: 0, sessionStartTime: null }}
                      userRole="TEACHER"
                    />
                    
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ← Back to video list
                    </button>
                  </>
                );
              })()}
            </div>
          )}
          
          {!selectedVideo && classData.videos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No videos yet</h3>
              <p className="text-gray-500 text-sm">Upload your first video to get started</p>
            </div>
          ) : !selectedVideo && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.videos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => setSelectedVideo(video.id)}
                >
                  {/* Video Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative group">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${String(Math.floor(video.durationSeconds % 60)).padStart(2, '0')}` : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
                    )}
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>Watch limit: {video.maxWatchTimeMultiplier}×</span>
                      <span>•</span>
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents ({classData.documents.length})</h2>
          {classData.documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No documents yet</h3>
              <p className="text-gray-500 text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {classData.documents.map((document) => (
                <div key={document.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{document.title}</h3>
                      {document.description && <p className="text-sm text-gray-500 mt-1">{document.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">{new Date(document.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrolled Students */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students ({classData.enrollments.length})</h2>
          {classData.enrollments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No students enrolled yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classData.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                      <p className="text-sm text-gray-500">{enrollment.student.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
