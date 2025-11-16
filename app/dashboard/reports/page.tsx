'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGeneratorForm } from '@/components/reporting/report-generator-form';
import { ScheduledReportsManager } from '@/components/reporting/scheduled-reports-manager';
import { ReportHistory } from '@/components/reporting/report-history';
import { FileText, Calendar, History } from 'lucide-react';

/**
 * Reports Page
 *
 * Provides interface for:
 * - Generating one-time reports
 * - Managing scheduled reports
 * - Viewing report history
 */
export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate on-demand reports or schedule automated reporting
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Report History
          </TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate">
          <ReportGeneratorForm />
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled">
          <ScheduledReportsManager />
        </TabsContent>

        {/* Report History Tab */}
        <TabsContent value="history">
          <ReportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
