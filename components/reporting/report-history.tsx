'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Download, Trash2, Clock, Calendar, Filter } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  frequency: string;
  format: string;
  size: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  scheduledReport?: {
    id: string;
    name: string;
  };
}

interface ReportHistoryProps {
  limit?: number;
}

export function ReportHistory({ limit = 20 }: ReportHistoryProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    frequency: '',
    format: '',
  });

  useEffect(() => {
    fetchReports();
  }, [page, filters]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(filters.frequency && { frequency: filters.frequency }),
        ...(filters.format && { format: filters.format }),
      });

      const response = await fetch(`/api/reports/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(`/api/reports/history/${report.id}/download`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/history/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <select
            value={filters.frequency}
            onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="one-time">One-time</option>
          </select>
          <select
            value={filters.format}
            onChange={(e) => setFilters({ ...filters, format: e.target.value })}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">All Formats</option>
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </Card>

      {/* Report List */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Report History</h2>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No reports found</p>
            <p className="text-sm">Generate your first report to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                        {report.frequency}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                        {report.format.toUpperCase()}
                      </span>
                      {report.scheduledReport && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
                          Scheduled: {report.scheduledReport.name}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Period: {new Date(report.periodStart).toLocaleDateString()} -{' '}
                        {new Date(report.periodEnd).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Generated: {formatDate(report.createdAt)}
                      </div>
                      <div>Size: {formatSize(report.size)}</div>
                      <div>ID: {report.id.substring(0, 8)}...</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 hover:bg-accent rounded transition-colors"
                      title="Download report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
