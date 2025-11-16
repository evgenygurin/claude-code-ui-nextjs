'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Download, FileText, Calendar } from 'lucide-react';

export function ReportGeneratorForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const [config, setConfig] = useState({
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    format: 'html' as 'json' | 'html' | 'markdown',
    sections: ['overview', 'sentry', 'conflicts', 'cicd'],
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedReport(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const report = await response.json();
      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReport) return;

    const blob = new Blob([generatedReport.content], {
      type: getContentType(generatedReport.format),
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-report-${generatedReport.id}.${generatedReport.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getContentType = (format: string) => {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'html':
        return 'text/html';
      case 'markdown':
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  };

  const toggleSection = (section: string) => {
    setConfig((prev) => {
      const sections = prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section];
      return { ...prev, sections };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Generate Report</h2>
        </div>

        <div className="space-y-6">
          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Time Period</label>
            <div className="grid grid-cols-3 gap-3">
              {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setConfig({ ...config, frequency: freq })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    config.frequency === freq
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Calendar className="h-4 w-4 mx-auto mb-1" />
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Output Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(['json', 'html', 'markdown'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setConfig({ ...config, format: fmt })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    config.format === fmt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sections Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Include Sections</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'sentry', label: 'Sentry Metrics' },
                { id: 'conflicts', label: 'Merge Conflicts' },
                { id: 'cicd', label: 'CI/CD Health' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'systemHealth', label: 'System Health' },
              ].map((section) => (
                <label
                  key={section.id}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={config.sections.includes(section.id)}
                    onChange={() => toggleSection(section.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{section.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || config.sections.length === 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating Report...' : 'Generate Report'}
          </button>
        </div>
      </Card>

      {/* Generated Report */}
      {generatedReport && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Report Generated</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(generatedReport.generatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Period:</span>{' '}
              <span className="font-medium">
                {generatedReport.frequency.charAt(0).toUpperCase() +
                  generatedReport.frequency.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Format:</span>{' '}
              <span className="font-medium">{generatedReport.format.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>{' '}
              <span className="font-medium">{(generatedReport.size / 1024).toFixed(2)} KB</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID:</span>{' '}
              <span className="font-medium text-xs">{generatedReport.id}</span>
            </div>
          </div>

          {/* Preview for HTML reports */}
          {generatedReport.format === 'html' && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div
                className="border rounded-lg p-4 max-h-96 overflow-auto"
                dangerouslySetInnerHTML={{ __html: generatedReport.content }}
              />
            </div>
          )}

          {/* Preview for Markdown reports */}
          {generatedReport.format === 'markdown' && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <pre className="border rounded-lg p-4 max-h-96 overflow-auto text-xs bg-muted">
                {generatedReport.content}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
