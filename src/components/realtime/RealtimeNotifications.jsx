
import React, { useState } from 'react';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const RealtimeNotifications = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  showToasts = true,
  maxToasts = 3
}) => {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (showToasts && notifications.length > 0) {
      const latestNotifications = notifications.slice(0, maxToasts);
      latestNotifications.forEach(notification => {
        if (!notification.read) {
          toast.info(notification.message, {
            toastId: notification.id,
            onClose: () => onMarkAsRead(notification.id)
          });
        }
      });
    }
  }, [notifications, showToasts, maxToasts, onMarkAsRead]);


  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20">
          <div className="p-3 font-bold border-b">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">No new notifications</p>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className={`p-3 border-b text-sm ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <p>{notification.message}</p>
                  <button onClick={() => onMarkAsRead(notification.id)} className="text-xs text-blue-500 hover:underline">Mark as read</button>
                </div>
              ))
            )}
          </div>
          <div className="p-2 flex justify-between bg-gray-50 rounded-b-lg">
            <button onClick={onMarkAllAsRead} className="text-xs text-blue-500 hover:underline">Mark all as read</button>
            <button onClick={onClearNotifications} className="text-xs text-red-500 hover:underline">
                <Trash2 className="h-3 w-3 inline-block mr-1"/> Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;
