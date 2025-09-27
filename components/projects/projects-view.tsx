'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  Star,
  GitBranch,
  Code,
  Trash2,
  Edit,
  ExternalLink,
  Settings,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  language: string;
  lastModified: Date;
  isStarred: boolean;
  gitBranch?: string;
  status: 'active' | 'archived' | 'template';
  sessionsCount: number;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'claude-code-ui-nextjs',
    path: '/home/user/projects/claude-code-ui-nextjs',
    description: 'Modern web UI for Claude Code CLI built with Next.js',
    language: 'TypeScript',
    lastModified: new Date('2025-01-15T10:30:00'),
    isStarred: true,
    gitBranch: 'feature/modern-nextjs-ui',
    status: 'active',
    sessionsCount: 15,
  },
  {
    id: '2',
    name: 'react-dashboard',
    path: '/home/user/projects/react-dashboard',
    description: 'Analytics dashboard built with React and D3.js',
    language: 'JavaScript',
    lastModified: new Date('2025-01-12T14:15:00'),
    isStarred: false,
    gitBranch: 'main',
    status: 'active',
    sessionsCount: 8,
  },
  {
    id: '3',
    name: 'python-ml-toolkit',
    path: '/home/user/projects/python-ml-toolkit',
    description: 'Machine learning utilities and models',
    language: 'Python',
    lastModified: new Date('2025-01-10T09:45:00'),
    isStarred: true,
    gitBranch: 'develop',
    status: 'active',
    sessionsCount: 23,
  },
  {
    id: '4',
    name: 'vue-starter-template',
    path: '/home/user/projects/vue-starter-template',
    description: 'Vue.js project template with best practices',
    language: 'Vue',
    lastModified: new Date('2024-12-20T16:20:00'),
    isStarred: false,
    gitBranch: 'main',
    status: 'template',
    sessionsCount: 3,
  },
];

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'starred' | 'active' | 'archived'
  >('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified' | 'language'>(
    'lastModified'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: 'text-blue-500',
      JavaScript: 'text-yellow-500',
      Python: 'text-green-500',
      Vue: 'text-emerald-500',
      React: 'text-cyan-500',
    };
    return colors[language] || 'text-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      archived: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      template: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'starred' && project.isStarred) ||
        (filter === 'active' && project.status === 'active') ||
        (filter === 'archived' && project.status === 'archived');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'language':
          return a.language.localeCompare(b.language);
        case 'lastModified':
        default:
          return (
            new Date(b.lastModified).getTime() -
            new Date(a.lastModified).getTime()
          );
      }
    });

  const toggleStar = (projectId: string) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === projectId
          ? { ...project, isStarred: !project.isStarred }
          : project
      )
    );
  };

  const openProject = (project: Project) => {
    // TODO: Implement project opening logic
    console.log('Opening project:', project.name);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/30 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your Claude Code projects
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'starred', 'active', 'archived'].map(filterOption => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterOption as typeof filter)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lastModified">Last Modified</option>
            <option value="name">Name</option>
            <option value="language">Language</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No projects found</h3>
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first project to get started'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProjects.map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative cursor-pointer rounded-lg border bg-card p-6 transition-all hover:shadow-md"
                  onClick={() => openProject(project)}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <Code className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">
                          {project.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs',
                              getLanguageColor(project.language)
                            )}
                          >
                            {project.language}
                          </span>
                          {project.gitBranch && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <div className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {project.gitBranch}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={e => {
                          e.stopPropagation();
                          toggleStar(project.id);
                        }}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            project.isStarred
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-1 text-xs font-medium',
                        getStatusColor(project.status)
                      )}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.sessionsCount} sessions
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.lastModified)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t bg-card/30 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredProjects.length} projects
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <div className="flex items-center gap-4">
            <span>
              {projects.filter(p => p.status === 'active').length} active
            </span>
            <span>{projects.filter(p => p.isStarred).length} starred</span>
            <span>
              {projects.filter(p => p.status === 'archived').length} archived
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
