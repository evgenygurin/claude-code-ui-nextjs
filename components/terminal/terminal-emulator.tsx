'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Terminal,
  Settings,
  Copy,
  Download,
  RefreshCw,
  X,
  Plus,
  Maximize2,
  Minimize2,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalSession {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
  history: TerminalLine[];
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error';
  timestamp: Date;
}

interface TerminalEmulatorProps {
  className?: string;
  initialSessions?: TerminalSession[];
  onCommand?: (command: string, sessionId: string) => void;
  onSessionCreate?: () => void;
  onSessionClose?: (sessionId: string) => void;
  isConnected?: boolean;
}

export function TerminalEmulator({
  className,
  initialSessions = [],
  onCommand,
  onSessionCreate,
  onSessionClose,
  isConnected = false
}: TerminalEmulatorProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id || null
  );
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    // Auto scroll to bottom when new content is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.history]);

  useEffect(() => {
    // Focus input when terminal is clicked
    const handleTerminalClick = () => {
      inputRef.current?.focus();
    };

    const terminalElement = terminalRef.current;
    if (terminalElement) {
      terminalElement.addEventListener('click', handleTerminalClick);
      return () => terminalElement.removeEventListener('click', handleTerminalClick);
    }
  }, []);

  const addLine = (content: string, type: TerminalLine['type']) => {
    if (!activeSessionId) return;

    const newLine: TerminalLine = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };

    setSessions(prev =>
      prev.map(session =>
        session.id === activeSessionId
          ? { ...session, history: [...session.history, newLine] }
          : session
      )
    );
  };

  const handleCommand = (command: string) => {
    if (!command.trim() || !activeSessionId) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add input line to terminal
    addLine(`$ ${command}`, 'input');

    // Execute command
    onCommand?.(command, activeSessionId);

    // Simulate command output (in real implementation, this would come from WebSocket)
    setTimeout(() => {
      if (command === 'clear') {
        setSessions(prev =>
          prev.map(session =>
            session.id === activeSessionId
              ? { ...session, history: [] }
              : session
          )
        );
      } else if (command === 'pwd') {
        addLine(activeSession?.path || '/Users/laptop/project', 'output');
      } else if (command.startsWith('echo ')) {
        addLine(command.slice(5), 'output');
      } else if (command === 'ls') {
        addLine('package.json  src/  docs/  README.md  node_modules/', 'output');
      } else {
        addLine(`Command executed: ${command}`, 'output');
      }
    }, 100);

    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Implement tab completion
    }
  };

  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: Date.now().toString(),
      name: `Terminal ${sessions.length + 1}`,
      path: '/Users/laptop/project',
      isActive: true,
      history: [{
        id: 'welcome',
        content: 'Welcome to Claude Code Terminal',
        type: 'output',
        timestamp: new Date()
      }]
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    onSessionCreate?.();
  };

  const closeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions[0]?.id || null);
    }
    
    onSessionClose?.(sessionId);
  };

  const copyTerminalContent = () => {
    if (!activeSession) return;
    
    const content = activeSession.history
      .map(line => line.content)
      .join('\n');
    
    navigator.clipboard.writeText(content);
  };

  const getLineClassName = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-cyan-400 font-medium';
      case 'error':
        return 'text-red-400';
      case 'output':
      default:
        return 'text-green-400';
    }
  };

  if (sessions.length === 0) {
    return (
      <Card className={cn("flex flex-col h-full", className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No terminal sessions</p>
            <Button onClick={createNewSession}>
              <Plus className="h-4 w-4 mr-2" />
              New Terminal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className, isMaximized && "fixed inset-4 z-50")}>
      <CardHeader className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-sm">Terminal</CardTitle>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={createNewSession}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Terminal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyTerminalContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Session Tabs */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-1 pt-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-md text-sm cursor-pointer",
                  session.id === activeSessionId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
                onClick={() => setActiveSessionId(session.id)}
              >
                <span>{session.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 p-0">
        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto"
        >
          {activeSession?.history.map(line => (
            <div
              key={line.id}
              className={cn("mb-1", getLineClassName(line.type))}
            >
              {line.content}
            </div>
          ))}
          
          {/* Current Input Line */}
          <div className="flex items-center text-cyan-400">
            <span className="mr-2">$</span>
            <Input
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-cyan-400 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Type command..."
              autoFocus
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}