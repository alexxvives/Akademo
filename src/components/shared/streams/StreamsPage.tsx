'use client';

import { useState } from 'react';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import type { StreamsPageProps } from './types';
import { useStreamsData } from './useStreamsData';
import { StreamsFilters } from './StreamsFilters';
import { StreamsTable } from './StreamsTable';

export function StreamsPage({ role }: StreamsPageProps) {
  const data = useStreamsData(role);
  const [searchQuery, setSearchQuery] = useState('');

  const lowerSearch = searchQuery.trim().toLowerCase();
  const displayedStreams = lowerSearch
    ? data.filteredStreams.filter(s =>
        s.title?.toLowerCase().includes(lowerSearch) ||
        s.className?.toLowerCase().includes(lowerSearch) ||
        s.teacherName?.toLowerCase().includes(lowerSearch)
      )
    : data.filteredStreams;

  return (
    <div className="space-y-6">
      <StreamsFilters
        role={role}
        academyName={data.academyName}
        isAcademy={data.isAcademy}
        isTeacher={data.isTeacher}
        isAdmin={data.isAdmin}
        classes={data.classes}
        academies={data.academies}
        selectedClass={data.selectedClass}
        setSelectedClass={data.setSelectedClass}
        selectedAcademy={data.selectedAcademy}
        setSelectedAcademy={data.setSelectedAcademy}
        filteredClassOptions={data.filteredClassOptions}
        activePeriodId={data.activePeriodId}
        isClassInPeriod={data.isClassInPeriod}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {data.loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <StreamsTable
          streams={displayedStreams}
          role={role}
          dashboardBase={data.dashboardBase}
          isDemo={data.isDemo}
          editingTitleId={data.editingTitleId}
          editingTitleValue={data.editingTitleValue}
          setEditingTitleValue={data.setEditingTitleValue}
          deletingStreamId={data.deletingStreamId}
          glowId={data.glowId}
          highlightRef={data.setHighlightRef}
          onEditTitle={data.handleEditTitle}
          onSaveTitle={data.handleSaveTitle}
          onCancelEdit={data.handleCancelEdit}
          onDeleteStream={data.handleDeleteStream}
        />
      )}
    </div>
  );
}
