'use client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {
    classId?: string;
    liveStreamId?: string;
    zoomLink?: string;
    className?: string;
    teacherName?: string;
  } | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onJoinLiveClass: (notification: Notification) => void;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onJoinLiveClass,
}: NotificationPanelProps) {
  return (
    <div className="fixed inset-x-0 lg:right-0 lg:left-auto lg:w-96 top-4 bg-white border border-gray-200 lg:rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto lg:m-4">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-medium text-gray-900">Notificaciones</span>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-brand-600 hover:text-brand-700"
            >
              Marcar todas
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No hay notificaciones
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 ${!notification.isRead ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-2">
                {notification.type === 'live_class' && (
                  <span className="text-red-500 animate-pulse">🔴</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title.replace('🔴 ', '')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notification.message}
                  </p>
                  {notification.type === 'live_class' && notification.data?.zoomLink && (
                    <button
                      onClick={() => onJoinLiveClass(notification)}
                      className="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Unirse a la clase →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
