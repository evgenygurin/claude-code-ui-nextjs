/**
 * Notification Service
 *
 * Manages real-time notifications for alerts, escalations, and system events
 * Uses Server-Sent Events (SSE) for push notifications
 */

export type NotificationType = 'alert' | 'escalation' | 'report' | 'system';
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
}

class NotificationServiceClass {
  private notifications: Notification[] = [];
  private subscribers: Set<(notification: Notification) => void> = new Set();
  private maxNotifications = 100;

  /**
   * Add a new notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const fullNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(fullNotification);

    // Keep only the most recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Notify subscribers
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(fullNotification);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });

    return fullNotification;
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  /**
   * Get notifications by type
   */
  getByType(type: NotificationType): Notification[] {
    return this.notifications.filter((n) => n.type === type);
  }

  /**
   * Get notifications by priority
   */
  getByPriority(priority: NotificationPriority): Notification[] {
    return this.notifications.filter((n) => n.priority === priority);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach((n) => {
      n.read = true;
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = [];
  }

  /**
   * Delete a specific notification
   */
  delete(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Create notification for critical alert
   */
  alertCritical(title: string, message: string, metadata?: Record<string, any>): Notification {
    return this.add({
      type: 'alert',
      priority: 'critical',
      title,
      message,
      metadata,
    });
  }

  /**
   * Create notification for escalation
   */
  escalation(title: string, message: string, actionUrl?: string, metadata?: Record<string, any>): Notification {
    return this.add({
      type: 'escalation',
      priority: 'high',
      title,
      message,
      actionUrl,
      metadata,
    });
  }

  /**
   * Create notification for report completion
   */
  reportReady(title: string, message: string, actionUrl?: string): Notification {
    return this.add({
      type: 'report',
      priority: 'info',
      title,
      message,
      actionUrl,
    });
  }

  /**
   * Create notification for system event
   */
  systemInfo(title: string, message: string): Notification {
    return this.add({
      type: 'system',
      priority: 'info',
      title,
      message,
    });
  }
}

// Singleton instance
export const NotificationService = new NotificationServiceClass();

/**
 * Helper to send browser notifications (if permitted)
 */
export async function sendBrowserNotification(notification: Notification): Promise<void> {
  if (typeof window === 'undefined') return;

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  // Send notification if permitted
  if (Notification.permission === 'granted') {
    const browserNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'critical',
    });

    // Handle click - navigate to action URL if available
    if (notification.actionUrl) {
      browserNotif.onclick = () => {
        window.location.href = notification.actionUrl!;
        browserNotif.close();
      };
    }
  }
}
