'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './sidebar';
import ChatInterface from '@/components/chat/chat-interface';
import { cn } from '@/lib/utils';

type ViewType =
  | 'home'
  | 'projects'
  | 'file-explorer'
  | 'chat'
  | 'terminal'
  | 'git'
  | 'search'
  | 'new-project'
  | 'settings';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('home');

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="mb-4 text-4xl font-bold text-foreground">
                  Claude Code UI
                </h1>
                <p className="mb-8 text-xl text-muted-foreground">
                  Modern web interface for Claude Code CLI and Cursor CLI
                </p>
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      title: 'Chat Interface',
                      description: 'Interact with Claude Code AI assistant',
                      view: 'chat' as ViewType,
                    },
                    {
                      title: 'File Explorer',
                      description: 'Browse and manage your project files',
                      view: 'file-explorer' as ViewType,
                    },
                    {
                      title: 'Terminal',
                      description: 'Built-in terminal for command execution',
                      view: 'terminal' as ViewType,
                    },
                    {
                      title: 'Git Integration',
                      description: 'Manage version control with Git',
                      view: 'git' as ViewType,
                    },
                    {
                      title: 'Projects',
                      description: 'Organize and manage your projects',
                      view: 'projects' as ViewType,
                    },
                    {
                      title: 'Search',
                      description: 'Search across files and content',
                      view: 'search' as ViewType,
                    },
                  ].map(feature => (
                    <motion.div
                      key={feature.view}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="cursor-pointer rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent/50"
                      onClick={() => setActiveView(feature.view)}
                    >
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 'chat':
        return <ChatInterface />;

      case 'projects':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Projects
              </h2>
              <p className="text-muted-foreground">
                Project management interface coming soon...
              </p>
            </div>
          </div>
        );

      case 'file-explorer':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                File Explorer
              </h2>
              <p className="text-muted-foreground">
                File management interface coming soon...
              </p>
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Terminal
              </h2>
              <p className="text-muted-foreground">
                Integrated terminal coming soon...
              </p>
            </div>
          </div>
        );

      case 'git':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Git Integration
              </h2>
              <p className="text-muted-foreground">
                Git management interface coming soon...
              </p>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Search
              </h2>
              <p className="text-muted-foreground">
                Global search interface coming soon...
              </p>
            </div>
          </div>
        );

      case 'new-project':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                New Project
              </h2>
              <p className="text-muted-foreground">
                Project creation wizard coming soon...
              </p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Settings
              </h2>
              <p className="text-muted-foreground">
                Application settings coming soon...
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                View Not Found
              </h2>
              <p className="text-muted-foreground">
                The requested view is not available.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={(view: string) => setActiveView(view as ViewType)}
      />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  );
}
