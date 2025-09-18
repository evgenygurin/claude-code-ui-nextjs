'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  FileText,
  Terminal,
  MessageSquare,
  Settings,
  GitBranch,
  FolderOpen,
  Code2,
  Users,
  Database,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Bell,
  User,
  LogOut,
  Palette,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  badge?: string | number;
  disabled?: boolean;
}

interface SidebarNavigationProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    children: [
      { title: 'All Projects', href: '/projects', icon: FolderOpen },
      { title: 'Recent', href: '/projects/recent', icon: FileText },
      { title: 'Favorites', href: '/projects/favorites', icon: FileText },
    ],
  },
  {
    title: 'Development',
    icon: Code2,
    children: [
      { title: 'Editor', href: '/editor', icon: Code2 },
      { title: 'Terminal', href: '/terminal', icon: Terminal },
      { title: 'Git', href: '/git', icon: GitBranch },
      { title: 'Database', href: '/database', icon: Database },
    ],
  },
  {
    title: 'AI Assistant',
    href: '/chat',
    icon: MessageSquare,
    badge: 'NEW',
  },
  {
    title: 'Team',
    icon: Users,
    children: [
      { title: 'Members', href: '/team/members', icon: Users },
      { title: 'Permissions', href: '/team/permissions', icon: Shield },
      { title: 'Activity', href: '/team/activity', icon: Zap },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function SidebarNavigation({
  className,
  isCollapsed = false,
  onToggleCollapse,
  user
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Projects', 'Development']);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          open={isExpanded && !isCollapsed}
          onOpenChange={() => !isCollapsed && toggleExpanded(item.title)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 h-9",
                level > 0 && "ml-4",
                isCollapsed && "justify-center"
              )}
              disabled={item.disabled}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2 h-9",
          level > 0 && "ml-4",
          isCollapsed && "justify-center",
          isActive && "bg-secondary"
        )}
        disabled={item.disabled}
        asChild={!!item.href}
      >
        {item.href ? (
          <Link href={item.href}>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ) : (
          <>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </>
        )}
      </Button>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Claude Code</span>
          </div>
        ) : (
          <Code2 className="h-6 w-6 text-primary" />
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 space-y-2">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" size="sm">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 py-2">
          {navigationItems.map(item => renderNavItem(item))}
        </div>
      </ScrollArea>

      {/* User Menu */}
      <div className="p-4 border-t">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 h-10",
                  isCollapsed && "justify-center"
                )}
              >
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" className="w-full" size="sm">
            <User className="h-4 w-4 mr-2" />
            {!isCollapsed ? 'Sign In' : ''}
          </Button>
        )}
      </div>
    </div>
  );
}