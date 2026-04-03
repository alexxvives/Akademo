'use client';

import type { CalendarPageProps, EventType } from './calendar-types';
import { EVENT_COLORS, WEEKDAYS, VIEW_LABELS } from './calendar-types';
import { useCalendarData } from './useCalendarData';
import { useCalendarActions } from './useCalendarActions';
import { CalendarEventPopup } from './CalendarEventPopup';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { CalendarAddEventModal } from '../CalendarAddEventModal';

export function CalendarPage({ role }: CalendarPageProps) {
  const state = useCalendarData(role);
  const actions = useCalendarActions(state, role);

  const {
    currentDate, setCurrentDate, viewMode, setViewMode,
    classes, selectedClass, setSelectedClass,
    adminAcademies, selectedAdminAcademy, setSelectedAdminAcademy,
    loading, setSelectedDay, addEventDate, setAddEventDate,
    academyName, isDemo, dragOverDate, setDragOverDate,
    editingEvent, setEditingEvent, popupEvent, setPopupEvent,
    dayViewScrollRef, canCreateEvents, activePeriodId, isClassInPeriod,
    eventsByDate, calendarDays, navigate, goToday, headerLabel, setEvents,
  } = state;

  const {
    handleEventAdded, handleDeleteEvent, handleDragStart,
    handleDragOver, handleDrop, handleEditEvent, navigateToEvent, handleEventClick,
  } = actions;

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-52" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="h-8 bg-gray-200 rounded w-28" />
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="flex items-center gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-16" />)}
            </div>
          </div>
          <div className="grid grid-cols-7 px-6 pt-4 pb-2">
            {WEEKDAYS.map(d => <div key={d} className="h-4 bg-gray-100 rounded mx-1" />)}
          </div>
          <div className="grid grid-cols-7 gap-1 px-6 pb-6">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {popupEvent && (
        <CalendarEventPopup
          popupEvent={popupEvent}
          setPopupEvent={setPopupEvent}
          canCreateEvents={canCreateEvents}
          isDemo={isDemo}
          navigateToEvent={navigateToEvent}
          handleEditEvent={handleEditEvent}
          handleDeleteEvent={handleDeleteEvent}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Calendario</h1>
              {canCreateEvents && (
                <button onClick={() => setAddEventDate(currentDate)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Añadir evento
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || 'AKADEMO'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {classes.length > 0 && !isDemo && (role !== 'ADMIN' || selectedAdminAcademy !== 'all') && (
              <ClassSearchDropdown
                classes={(() => {
                  const byPeriod = activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate));
                  if (role === 'ADMIN' && selectedAdminAcademy !== 'all') {
                    return byPeriod.filter(c => c.academyId === selectedAdminAcademy);
                  }
                  return byPeriod;
                })()}
                value={selectedClass}
                onChange={setSelectedClass}
                allLabel="Todas las asignaturas"
                className="w-full sm:w-56"
              />
            )}
            {role === 'ADMIN' && adminAcademies.length > 0 && (
              <AcademySearchDropdown
                academies={adminAcademies}
                value={selectedAdminAcademy}
                onChange={(value) => { setSelectedAdminAcademy(value); setSelectedClass('all'); }}
                allLabel="Todas las academias"
                allValue="all"
                className="w-full sm:w-56"
              />
            )}
          </div>
        </div>

        {/* Calendar controls */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 relative">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['month', 'week', 'day'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {VIEW_LABELS[mode]}
                </button>
              ))}
            </div>

            <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base font-semibold text-gray-900 min-w-[180px] text-center capitalize">
                {headerLabel}
              </h2>
              <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Hoy
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {([['lesson','Clase'],['assignment','Ejercicio'],['stream','Stream']] as [EventType,string][]).map(([type, label]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[type].dot}`} />
                  <span className="text-[11px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {viewMode === 'month' && (
              <CalendarMonthView
                calendarDays={calendarDays} currentDate={currentDate}
                eventsByDate={eventsByDate} dragOverDate={dragOverDate}
                canCreateEvents={canCreateEvents} isDemo={isDemo}
                setDragOverDate={setDragOverDate} setCurrentDate={setCurrentDate}
                setViewMode={setViewMode} setSelectedDay={setSelectedDay}
                setAddEventDate={setAddEventDate}
                handleDragStart={handleDragStart} handleDragOver={handleDragOver}
                handleDrop={handleDrop} handleEventClick={handleEventClick}
              />
            )}
            {viewMode === 'week' && (
              <CalendarWeekView
                calendarDays={calendarDays} eventsByDate={eventsByDate}
                canCreateEvents={canCreateEvents} isDemo={isDemo}
                setAddEventDate={setAddEventDate} handleEventClick={handleEventClick}
              />
            )}
            {viewMode === 'day' && (
              <CalendarDayView
                calendarDays={calendarDays} eventsByDate={eventsByDate}
                canCreateEvents={canCreateEvents} isDemo={isDemo}
                dayViewScrollRef={dayViewScrollRef}
                setAddEventDate={setAddEventDate} handleEventClick={handleEventClick}
              />
            )}
          </div>
        </div>

        {addEventDate && (
          <CalendarAddEventModal
            date={addEventDate}
            classes={classes}
            disabled={isDemo}
            editEvent={editingEvent ? {
              id: editingEvent.id, title: editingEvent.title, type: editingEvent.type,
              classId: editingEvent.classId, extra: editingEvent.extra,
              location: editingEvent.location, startTime: editingEvent.startTime,
              zoomLink: editingEvent.zoomLink, zoomMeetingId: editingEvent.zoomMeetingId,
            } : undefined}
            onClose={() => { setAddEventDate(null); setEditingEvent(null); }}
            onSaved={(ev) => {
              if (editingEvent) {
                const updatedClassName = ev.classId ? (classes.find(c => c.id === ev.classId)?.name || '') : '';
                setEvents(prev => prev.map(e =>
                  e.id === editingEvent.id
                    ? { ...e, title: ev.title, type: ev.type as EventType, date: ev.eventDate, classId: ev.classId || '', className: updatedClassName, extra: ev.notes || undefined, startTime: ev.startTime || undefined, location: ev.location || undefined, zoomLink: ev.zoomLink || undefined, zoomMeetingId: ev.zoomMeetingId || undefined }
                    : e
                ));
                setEditingEvent(null);
              } else {
                handleEventAdded(ev);
              }
              setAddEventDate(null);
            }}
          />
        )}
      </div>
    </>
  );
}
