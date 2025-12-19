import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../utils/cn';

export type NotificationType = 'success' | 'warning' | 'info' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after ms (0 = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    error: XCircleIcon
  };

  const colors = {
    success: {
      bg: 'from-success-500/20 to-success-500/5',
      border: 'border-success-500/30',
      icon: 'text-success-400',
      glow: 'shadow-success-500/20'
    },
    warning: {
      bg: 'from-warning-500/20 to-warning-500/5',
      border: 'border-warning-500/30',
      icon: 'text-warning-400',
      glow: 'shadow-warning-500/20'
    },
    info: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    error: {
      bg: 'from-danger-500/20 to-danger-500/5',
      border: 'border-danger-500/30',
      icon: 'text-danger-400',
      glow: 'shadow-danger-500/20'
    }
  };

  const Icon = icons[notification.type];
  const colorClass = colors[notification.type];

  return (
    <Card
      variant="cyber"
      className={cn(
        "mb-3 transition-all duration-300 transform",
        `bg-gradient-to-r ${colorClass.bg}`,
        `border ${colorClass.border}`,
        `shadow-lg ${colorClass.glow}`,
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isExiting && "scale-95"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("flex-shrink-0 mt-0.5", colorClass.icon)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-tech font-semibold text-foreground">
                  {notification.title}
                </h4>
                <p className="text-sm text-muted mt-1">
                  {notification.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="flex-shrink-0 ml-2 w-6 h-6 hover:bg-white/10"
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Button */}
            {notification.action && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={notification.action.onClick}
                  className={cn("text-xs", colorClass.icon)}
                >
                  {notification.action.label}
                </Button>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted mt-2 font-mono">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        {notification.duration && notification.duration > 0 && (
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full", colorClass.icon.replace('text-', 'bg-'))}
              style={{
                animation: `shrink ${notification.duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
  maxNotifications = 5
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const displayNotifications = notifications.slice(0, maxNotifications);

  if (displayNotifications.length === 0) return null;

  const notificationContainer = (
    <div className={cn(
      "fixed z-50 w-96 max-w-[calc(100vw-2rem)]",
      positionClasses[position]
    )}>
      {displayNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );

  return createPortal(notificationContainer, document.body);
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'success', title, message, duration: 5000, ...options });
  };

  const error = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'error', title, message, duration: 0, ...options });
  };

  const warning = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'warning', title, message, duration: 7000, ...options });
  };

  const info = (title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'info', title, message, duration: 5000, ...options });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

// CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);