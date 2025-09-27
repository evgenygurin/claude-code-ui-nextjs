'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  Star,
  GitBranch,
  Code,
  ExternalLink,
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
  const [filter, setFilter] = useState<'all' | 'starred' | 'active' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified' | 'language'>('lastModified');
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');

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
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
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
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
    });

  const toggleStar = (projectId: string) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId ? { ...project, isStarred: !project.isStarred } : project
    ));
  };

  const openProject = (project: Project) => {
    // TODO: Implement project opening logic
    console.log('Opening project:', project.name);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card/30 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Claude Code projects
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'starred', 'active', 'archived'].map((filterOption) => (
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
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first project to get started'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-card rounded-lg border p-6 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openProject(project)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-xs', getLanguageColor(project.language))}>
                            {project.language}
                          </span>
                          {project.gitBranch && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <div className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3 text-muted-foreground" />
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
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(project.id);
                        }}
                      >
                        <Star
                          className={cn(
                            'w-4 h-4',
                            project.isStarred
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full border',
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
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.lastModified)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t bg-card/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredProjects.length} projects
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <div className="flex items-center gap-4">
            <span>{projects.filter(p => p.status === 'active').length} active</span>
            <span>{projects.filter(p => p.isStarred).length} starred</span>
            <span>{projects.filter(p => p.status === 'archived').length} archived</span>
          </div>
        </div>
      </div>
    </div>
  );
}