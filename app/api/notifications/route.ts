import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';

/**
 * GET /api/notifications
 * Returns all notifications
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const unreadOnly = searchParams.get('unread') === 'true';
  const type = searchParams.get('type');
  const priority = searchParams.get('priority');

  let notifications = NotificationService.getAll();

  if (unreadOnly) {
    notifications = notifications.filter((n) => !n.read);
  }

  if (type) {
    notifications = notifications.filter((n) => n.type === type);
  }

  if (priority) {
    notifications = notifications.filter((n) => n.priority === priority);
  }

  return NextResponse.json({
    notifications,
    total: notifications.length,
    unread: NotificationService.getUnread().length,
  });
}

/**
 * POST /api/notifications
 * Creates a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, priority, title, message, metadata, actionUrl } = body;

    if (!type || !priority || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = NotificationService.add({
      type,
      priority,
      title,
      message,
      metadata,
      actionUrl,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Clears all notifications
 */
export async function DELETE() {
  NotificationService.clear();
  return NextResponse.json({ success: true });
}
