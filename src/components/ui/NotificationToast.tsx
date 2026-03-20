/**
 * cocoro — NotificationToast
 * Floating notification banners with slide-in/out animation
 */

import { useEngineStore } from '@/store/useEngineStore';

export function NotificationToast() {
  const notifications = useEngineStore(s => s.notifications);
  const dismiss = useEngineStore(s => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`notification-toast notification-${n.type}`}
          onClick={() => dismiss(n.id)}
        >
          <span className="notification-emoji">{n.emoji}</span>
          <div className="notification-content">
            <span className="notification-title">{n.title}</span>
            <span className="notification-message">{n.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
