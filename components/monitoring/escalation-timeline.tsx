'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, XCircle, GitMerge, Bug } from 'lucide-react';

interface EscalationTimelineProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface TimelineEvent {
  id: string;
  type: 'error' | 'conflict' | 'deployment' | 'resolution';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  metadata?: {
    errorCount?: number;
    affectedUsers?: number;
    strategy?: string;
    duration?: number;
  };
}

interface TimelineData {
  events: TimelineEvent[];
  stats: {
    total: number;
    open: number;
    resolved: number;
    failed: number;
  };
}

export function EscalationTimeline({ isLoading, lastUpdate }: EscalationTimelineProps) {
  const [data, setData] = useState<TimelineData>({
    events: [],
    stats: {
      total: 0,
      open: 0,
      resolved: 0,
      failed: 0
    }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics/timeline');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch escalation timeline:', error);
      }
    }

    fetchData();
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </Card>
      </div>
    );
  }

  const getEventIcon = (type: string, status: string) => {
    if (status === 'resolved') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'in_progress') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }

    switch (type) {
      case 'error':
        return <Bug className="h-5 w-5 text-orange-500" />;
      case 'conflict':
        return <GitMerge className="h-5 w-5 text-blue-500" />;
      case 'deployment':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Resolved</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Failed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">In Progress</span>;
      case 'open':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Open</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Unknown</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            <p className="text-3xl font-bold mt-2">{data.stats.total}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Open</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{data.stats.open}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Resolved</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{data.stats.resolved}</p>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Failed</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{data.stats.failed}</p>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Event Timeline</h3>

        {data.events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No events in the timeline
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {data.events.map((event, index) => (
                <div key={event.id} className="relative pl-14">
                  {/* Timeline Dot */}
                  <div className="absolute left-4 top-1 -translate-x-1/2 bg-background border-2 border-border rounded-full p-1">
                    {getEventIcon(event.type, event.status)}
                  </div>

                  {/* Event Card */}
                  <Card className={`p-4 border-l-4 ${getPriorityColor(event.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        <span className="text-xs font-medium capitalize">{event.priority}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {event.metadata && (
                      <div className="flex gap-4 mt-3 pt-3 border-t text-xs">
                        {event.metadata.errorCount !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Errors:</span>{' '}
                            <span className="font-medium">{event.metadata.errorCount}</span>
                          </div>
                        )}
                        {event.metadata.affectedUsers !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Users:</span>{' '}
                            <span className="font-medium">{event.metadata.affectedUsers}</span>
                          </div>
                        )}
                        {event.metadata.strategy && (
                          <div>
                            <span className="text-muted-foreground">Strategy:</span>{' '}
                            <span className="font-medium">{event.metadata.strategy}</span>
                          </div>
                        )}
                        {event.metadata.duration !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Duration:</span>{' '}
                            <span className="font-medium">{event.metadata.duration}min</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
