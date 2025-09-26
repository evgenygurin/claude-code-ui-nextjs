'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FolderOpen,
  FileText,
  MessageSquare,
  Terminal,
  GitBranch,
  Search,
  Plus,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'file-explorer', label: 'File Explorer', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'search', label: 'Search', icon: Search },
];

const footerItems = [
  { id: 'new-project', label: 'New Project', icon: Plus },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  isCollapsed,
  onToggle,
  activeView,
  onViewChange,
}: SidebarProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 240,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut',
      }}
      className={cn(
        'relative flex h-full flex-col border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="font-semibold text-foreground"
            >
              Claude Code UI
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigationItems.map(item => (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              activeView === item.id && 'bg-accent/80',
              isCollapsed ? 'px-2' : 'px-4'
            )}
            onClick={() => onViewChange(item.id)}
            aria-label={item.label}
          >
            <item.icon className="h-4 w-4" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="ml-3"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-border p-2">
        {footerItems.map(item => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              'w-full justify-start',
              isCollapsed ? 'px-2' : 'px-4'
            )}
            onClick={() => onViewChange(item.id)}
            aria-label={item.label}
          >
            <item.icon className="h-4 w-4" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="ml-3"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
