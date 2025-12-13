'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';

interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  maxWatchTimeMultiplier: number;
  playStates: Array<{
    totalWatchTimeSeconds: number;
    sessionStartTime: string | null;
  }>;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  upload: {
    fileName: string;
    storagePath: string;
  };
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academy: {
    name: string;
  };
}

export default function ClassPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [userRes, videosRes, docsRes, classRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/videos?classId=${classId}`),
        fetch(`/api/documents?classId=${classId}`),
        fetch(`/api/classes/${classId}`),
      ]);

      const [userResult, videosResult, docsResult, classResult] = await Promise.all([
        userRes.json(),
        videosRes.json(),
        docsRes.json(),
        classRes.json(),
      ]);

      if (userResult.success) {
        setUser(userResult.data);
      }

      if (videosResult.success) {
        setVideos(videosResult.data);
      }

      if (docsResult.success) {
        setDocuments(docsResult.data);
      }

      if (classResult.success) {
        setClassData(classResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading class...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <Link href="/dashboard/student" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          {classData && (
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
              {classData.description && (
                <p className="text-gray-600 mt-1">{classData.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{classData.academy.name}</p>
            </div>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Video Player */}
        {selectedVideo && user && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedVideo.title}</h2>
              {selectedVideo.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>
              )}
            </div>
            
            <ProtectedVideoPlayer
              videoUrl={`/api/video/stream/${selectedVideo.id}`}
              videoId={selectedVideo.id}
              studentId={user.id}
              maxWatchTimeMultiplier={selectedVideo.maxWatchTimeMultiplier}
              durationSeconds={selectedVideo.durationSeconds || 0}
              initialPlayState={selectedVideo.playStates?.[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}              userRole={user.role}            />
            
            <button
              onClick={() => setSelectedVideo(null)}
              className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to video list
            </button>
          </div>
        )}

        {/* Documents Section */}
        {!selectedVideo && documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Documents</h2>
            <div className="space-y-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-gray-500 truncate">{doc.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{doc.upload.fileName}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Video List */}
        {!selectedVideo && (
          <div>
            {videos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No videos available in this class yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => {
                  const playState = video.playStates?.[0];
                  const maxWatchTime = (video.durationSeconds || 0) * video.maxWatchTimeMultiplier;
                  const watchProgress = playState && maxWatchTime > 0
                    ? (playState.totalWatchTimeSeconds / maxWatchTime) * 100
                    : 0;

                  return (
                    <div
                      key={video.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors p-4 cursor-pointer"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {video.title}
                      </h3>
                      
                      {video.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      {/* Watch Time Progress */}
                      {playState && playState.totalWatchTimeSeconds > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Watch time used</span>
                            <span>{Math.round(watchProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(watchProgress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.floor(playState.totalWatchTimeSeconds / 60)}min / {Math.floor(maxWatchTime / 60)}min
                          </p>
                        </div>
                      )}

                      {!playState && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">Not started</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
