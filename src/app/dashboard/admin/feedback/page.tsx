'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';

interface Academy {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  academyId: string;
}

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedAcademy, setSelectedAcademy] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/classes')
      ]);
      
      const [academiesResult, classesResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json()
      ]);
      
      if (academiesResult.success && Array.isArray(academiesResult.data)) {
        setAcademies(academiesResult.data);
      }
      
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setAllClasses(classesResult.data);
      }
      
      await loadFeedback();
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await apiClient('/ratings/teacher');
      const result = await res.json();
      
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    let result = classes;
    
    if (selectedAcademy !== 'all') {
      result = result.filter(c => c.academyId === selectedAcademy);
    }
    
    if (selectedClass !== 'all') {
      result = result.filter(c => c.id === selectedClass);
    }
    
    return result;
  }, [classes, selectedAcademy, selectedClass]);

  const filteredClassOptions = useMemo(() => {
    if (selectedAcademy === 'all') return [];
    return allClasses.filter(c => c.academyId === selectedAcademy);
  }, [allClasses, selectedAcademy]);

  const totalRatings = filteredClasses.reduce((sum, c) => sum + (c.totalRatings || 0), 0);
  const avgRating = filteredClasses.length > 0
    ? filteredClasses.reduce((sum, c) => sum + (c.averageRating || 0) * (c.totalRatings || 0), 0) / (totalRatings || 1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feedback de Estudiantes</h1>
          <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
        </div>
        
        {/* Filters as dropdown */}
        <div className="flex gap-3">
          {selectedAcademy !== 'all' && filteredClassOptions.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {filteredClassOptions.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          )}
          
          <select
            value={selectedAcademy}
            onChange={(e) => {
              setSelectedAcademy(e.target.value);
              setSelectedClass('all');
            }}
            className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
            <option value="all">Todas las academias</option>
            {academies.map(academy => (
              <option key={academy.id} value={academy.id}>{academy.name}</option>
            ))}
          </select>
        </div>
      </div>

      <FeedbackView classes={filteredClasses} loading={loading} showClassFilter={false} />
    </div>
  );
}
