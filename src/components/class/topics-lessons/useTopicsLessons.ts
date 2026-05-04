'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Lesson, Topic, TopicsLessonsListProps } from './types';
import { useStudentTimes } from './useStudentTimes';

type HookProps = Pick<TopicsLessonsListProps,
  'lessons' | 'topics' | 'classId' | 'expandTopicId' | 'highlightLessonId' |
  'paymentStatus' | 'onTopicsChange' | 'onTopicsUpdate' | 'onLessonsUpdate' | 'onLessonMove'
>;

export function useTopicsLessons(props: HookProps) {
  const {
    lessons, topics, classId, expandTopicId, highlightLessonId, paymentStatus,
    onTopicsChange, onTopicsUpdate, onLessonsUpdate, onLessonMove,
  } = props;

  const isDisabled = paymentStatus === 'NOT PAID';

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [draggedLesson, setDraggedLesson] = useState<string | null>(null);
  const [dragOverTopic, setDragOverTopic] = useState<string | null>(null);
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [topicInsertIndex, setTopicInsertIndex] = useState<number | null>(null);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const highlightCardRef = useRef<HTMLDivElement | null>(null);
  const [glowLessonId, setGlowLessonId] = useState<string | null>(null);

  const setHighlightCardRef = useCallback((el: HTMLDivElement | null) => {
    highlightCardRef.current = el;
  }, []);

  const studentTimes = useStudentTimes(isDisabled);

  // Auto-expand topic when expandTopicId prop changes
  useEffect(() => {
    if (expandTopicId) {
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(expandTopicId);
        return newSet;
      });
    }
  }, [expandTopicId]);

  // Glow & scroll when highlightLessonId changes
  useEffect(() => {
    if (!highlightLessonId) return;
    const lesson = lessons.find(l => l.id === highlightLessonId);
    if (lesson) {
      const topicKey = lesson.topicId || 'uncategorized';
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(topicKey);
        return newSet;
      });
    }
    const glowTimer = setTimeout(() => {
      setGlowLessonId(highlightLessonId);
      const scrollTimer = setTimeout(() => {
        if (highlightCardRef.current) {
          highlightCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      const clearTimer = setTimeout(() => setGlowLessonId(null), 3500);
      return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, 350);
    return () => clearTimeout(glowTimer);
  }, [highlightLessonId, lessons]);

  // Auto-scroll while dragging near viewport edges
  const handleDragScroll = useCallback((clientY: number) => {
    const container = scrollContainerRef.current;
    if (!container || (!draggedLesson && !draggedTopicId)) return;
    const scrollThreshold = 100;
    const maxScrollSpeed = 18;
    const viewportH = window.innerHeight;
    let scrollAmount = 0;
    if (clientY < scrollThreshold) {
      scrollAmount = -maxScrollSpeed * (1 - clientY / scrollThreshold);
    } else if (clientY > viewportH - scrollThreshold) {
      scrollAmount = maxScrollSpeed * (1 - (viewportH - clientY) / scrollThreshold);
    }
    if (scrollAmount !== 0) {
      container.scrollTop += scrollAmount;
    }
  }, [draggedLesson, draggedTopicId]);

  // Global drag handler for auto-scroll
  useEffect(() => {
    if (!draggedLesson && !draggedTopicId) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }
    let lastClientY = 0;
    const handleGlobalDragOver = (e: globalThis.DragEvent) => {
      lastClientY = e.clientY;
    };
    const animate = () => {
      handleDragScroll(lastClientY);
      scrollAnimationRef.current = requestAnimationFrame(animate);
    };
    document.addEventListener('dragover', handleGlobalDragOver);
    scrollAnimationRef.current = requestAnimationFrame(animate);
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [draggedLesson, draggedTopicId, handleDragScroll]);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // Group lessons by topic
  const lessonsByTopic = new Map<string | null, Lesson[]>();
  lessons.forEach(lesson => {
    const key = lesson.topicId || null;
    if (!lessonsByTopic.has(key)) {
      lessonsByTopic.set(key, []);
    }
    lessonsByTopic.get(key)!.push(lesson);
  });

  // Drag handlers
  const handleDragStart = (e: DragEvent, lessonId: string) => {
    setDraggedLesson(lessonId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLesson(null);
    setDragOverTopic(null);
  };

  const handleDragOver = (e: DragEvent, topicId: string | null) => {
    if (draggedTopicId) return; // topic drag in progress
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTopic(topicId === null ? 'uncategorized' : topicId);
  };

  const handleDrop = async (e: DragEvent, topicId: string | null) => {
    if (draggedTopicId) return; // topic drag in progress
    e.preventDefault();
    if (draggedLesson) {
      onLessonMove(draggedLesson, topicId);
    }
    setDraggedLesson(null);
    setDragOverTopic(null);
  };

  const handleTopicDragStart = (e: DragEvent, topicId: string) => {
    setDraggedTopicId(topicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTopicDragEnd = () => {
    setDraggedTopicId(null);
    setTopicInsertIndex(null);
  };

  const handleTopicDragOver = (e: DragEvent, index: number) => {
    if (!draggedTopicId) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setTopicInsertIndex(e.clientY < midpoint ? index : index + 1);
  };

  const handleTopicDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTopicId || topicInsertIndex === null) {
      setDraggedTopicId(null);
      setTopicInsertIndex(null);
      return;
    }
    const fromIdx = topics.findIndex(t => t.id === draggedTopicId);
    if (fromIdx === -1) return;
    let toIdx = topicInsertIndex;
    if (fromIdx < toIdx) toIdx--;
    if (fromIdx === toIdx) {
      setDraggedTopicId(null);
      setTopicInsertIndex(null);
      return;
    }
    const newTopics = [...topics];
    const [moved] = newTopics.splice(fromIdx, 1);
    newTopics.splice(toIdx, 0, moved);
    const sourceId = draggedTopicId;
    setDraggedTopicId(null);
    setTopicInsertIndex(null);
    if (onTopicsUpdate) {
      onTopicsUpdate(() => newTopics.map((t, i) => ({ ...t, orderIndex: i })));
    }
    try {
      const res = await apiClient(`/topics/${sourceId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrderIndex: toIdx }),
      });
      if (!res.ok) onTopicsChange();
    } catch {
      onTopicsChange();
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    const tempId = `temp-${Date.now()}`;
    const tempTopic: Topic = {
      id: tempId, name: newTopicName.trim(), classId, orderIndex: topics.length, lessonCount: 0,
    };
    if (onTopicsUpdate) {
      onTopicsUpdate(prev => [...prev, tempTopic]);
    }
    setNewTopicName('');
    setShowNewTopicInput(false);
    try {
      const res = await apiClient('/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, name: tempTopic.name }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && onTopicsUpdate) {
          onTopicsUpdate(prev => prev.map(t => t.id === tempId ? result.data : t));
        } else if (!onTopicsUpdate) {
          onTopicsChange();
        }
      } else {
        if (onTopicsUpdate) {
          onTopicsUpdate(prev => prev.filter(t => t.id !== tempId));
        }
        onTopicsChange();
      }
    } catch (error) {
      console.error('Failed to create topic:', error);
      if (onTopicsUpdate) {
        onTopicsUpdate(prev => prev.filter(t => t.id !== tempId));
      }
      onTopicsChange();
    }
    setCreatingTopic(false);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('¿Eliminar este tema? Las Clases se moverán a "Sin tema".')) return;
    if (onTopicsUpdate) {
      onTopicsUpdate(prev => prev.filter(t => t.id !== topicId));
    }
    if (onLessonsUpdate) {
      onLessonsUpdate(prev => prev.map(l => l.topicId === topicId ? { ...l, topicId: null } : l));
    }
    try {
      const res = await apiClient(`/topics/${topicId}`, { method: 'DELETE' });
      if (!res.ok) {
        onTopicsChange();
      } else if (!onTopicsUpdate) {
        onTopicsChange();
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      onTopicsChange();
    }
  };

  return {
    expandedTopics, draggedLesson, dragOverTopic, draggedTopicId, topicInsertIndex,
    showNewTopicInput, setShowNewTopicInput, newTopicName, setNewTopicName, creatingTopic,
    scrollContainerRef, setHighlightCardRef, glowLessonId,
    isDisabled, lessonsByTopic,
    toggleTopic, handleDragStart, handleDragEnd, handleDragOver, handleDrop,
    handleTopicDragStart, handleTopicDragEnd, handleTopicDragOver, handleTopicDrop,
    handleCreateTopic, handleDeleteTopic,
    ...studentTimes,
  };
}
