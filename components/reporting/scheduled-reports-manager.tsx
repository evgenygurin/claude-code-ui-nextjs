'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Play, Trash2, Plus, Calendar } from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  config: {
    frequency: string;
    format: string;
    sections: string[];
    recipients?: string[];
  };
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export function ScheduledReportsManager() {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('/api/reports/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnable = async (id: string, currentlyEnabled: boolean) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      if (response.ok) {
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Failed to toggle report:', error);
    }
  };

  const handleExecuteNow = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${id}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Report execution started');
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Failed to execute report:', error);
      alert('Failed to execute report');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchScheduledReports();
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Scheduled Reports</h2>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Schedule
          </button>
        </div>

        {scheduledReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No scheduled reports configured</p>
            <p className="text-sm">Create a schedule to receive automated reports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledReports.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          report.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {report.enabled ? 'Active' : 'Disabled'}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                        {report.config.frequency}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                        {report.config.format.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Next run:{' '}
                        {report.nextRun
                          ? new Date(report.nextRun).toLocaleString()
                          : 'Not scheduled'}
                      </div>
                      {report.lastRun && (
                        <div>
                          Last run: {new Date(report.lastRun).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Sections: {report.config.sections.join(', ')}
                    </div>

                    {report.config.recipients && report.config.recipients.length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Recipients: {report.config.recipients.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnable(report.id, report.enabled)}
                      className="p-2 hover:bg-accent rounded transition-colors"
                      title={report.enabled ? 'Disable' : 'Enable'}
                    >
                      <input
                        type="checkbox"
                        checked={report.enabled}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                    </button>
                    <button
                      onClick={() => handleExecuteNow(report.id)}
                      className="p-2 hover:bg-accent rounded transition-colors"
                      title="Execute now"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Scheduled report creation form will be implemented here. For now, use the API directly
            or create via configuration file.
          </p>
        </Card>
      )}
    </div>
  );
}
