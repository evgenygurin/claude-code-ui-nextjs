'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Activity,
  Users,
  Code,
  Terminal,
  GitBranch,
  MessageSquare,
  TrendingUp,
  Clock,
  FileText,
  FolderOpen,
  MoreHorizontal,
  ArrowUpRight,
  ExternalLink,
  Play,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  lastModified: Date;
  status: 'active' | 'building' | 'deployed' | 'error';
  progress?: number;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCommits: number;
  linesOfCode: number;
  aiInteractions: number;
  teamMembers: number;
}

interface DashboardOverviewProps {
  className?: string;
  stats?: DashboardStats;
  recentProjects?: Project[];
  onProjectClick?: (project: Project) => void;
  onCreateProject?: () => void;
}

const defaultStats: DashboardStats = {
  totalProjects: 12,
  activeProjects: 8,
  totalCommits: 2547,
  linesOfCode: 48392,
  aiInteractions: 156,
  teamMembers: 4
};

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Next.js e-commerce with Stripe integration',
    language: 'TypeScript',
    lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active',
    progress: 75
  },
  {
    id: '2',
    name: 'AI Chat Bot',
    description: 'Claude-powered customer support bot',
    language: 'Python',
    lastModified: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'building',
    progress: 40
  },
  {
    id: '3',
    name: 'Mobile App Backend',
    description: 'FastAPI REST service with PostgreSQL',
    language: 'Python',
    lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'deployed'
  },
  {
    id: '4',
    name: 'Dashboard Analytics',
    description: 'Real-time analytics dashboard',
    language: 'React',
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'error'
  }
];

export function DashboardOverview({
  className,
  stats = defaultStats,
  recentProjects = defaultProjects,
  onProjectClick,
  onCreateProject
}: DashboardOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'text-blue-500 bg-blue-500/10';
      case 'building':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'deployed':
        return 'text-green-500 bg-green-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Code className="h-3 w-3" />;
      case 'building':
        return <Settings className="h-3 w-3 animate-spin" />;
      case 'deployed':
        return <ExternalLink className="h-3 w-3" />;
      case 'error':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Lines</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.linesOfCode)}</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiInteractions}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              2 online now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Last {selectedPeriod}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedPeriod('24h')}>
                    Last 24 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod('7d')}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod('30d')}>
                    Last 30 days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={onCreateProject}>
                New Project
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onProjectClick?.(project)}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    getStatusColor(project.status)
                  )}>
                    {getStatusIcon(project.status)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {project.language}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {project.description}
                  </p>
                  {project.progress !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={project.progress} className="flex-1 h-1" />
                      <span className="text-xs text-muted-foreground">
                        {project.progress}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(project.lastModified)}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="h-4 w-4 mr-2" />
                      Open Project
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Terminal className="h-4 w-4 mr-2" />
                      Terminal
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Git History
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">Open Terminal</h3>
              <p className="text-sm text-muted-foreground">
                Start a new Claude Code session
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Chat with Claude for help
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">Git Operations</h3>
              <p className="text-sm text-muted-foreground">
                Manage repositories
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Missing import fix
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="m12 17 .01 0" />
  </svg>
);