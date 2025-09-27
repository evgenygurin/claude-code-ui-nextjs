'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  RotateCcw,
  Copy,
  Download,
  Settings,
  Maximize2,
  Minimize2,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  isActive: boolean;
}

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', title: 'bash', cwd: '~/project', isActive: true },
  ]);
  const [output, setOutput] = useState<string[]>([
    '$ Welcome to Claude Code Terminal',
    '$ Connected to project directory',
    '$ Type commands to interact with Claude Code CLI',
    '',
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add command to output
    const prompt = `~/project$ ${command}`;
    setOutput(prev => [...prev, prompt]);
    setCurrentInput('');
    setIsRunning(true);

    // Simulate command execution
    setTimeout(
      () => {
        let response = '';

        switch (command.toLowerCase()) {
          case 'ls':
          case 'ls -la':
            response =
              'src/\ncomponents/\npublic/\npackage.json\nREADME.md\ntsconfig.json';
            break;
          case 'pwd':
            response = '/home/user/project';
            break;
          case 'claude':
            response =
              'Claude Code CLI v2.1.0\nType "claude help" for available commands';
            break;
          case 'claude help':
            response = `Available commands:
  claude chat        - Start interactive chat
  claude project     - Manage projects
  claude files       - File operations
  claude tools       - Tool management
  claude --version   - Show version`;
            break;
          case 'clear':
            setOutput([]);
            setIsRunning(false);
            return;
          case 'whoami':
            response = 'claude-user';
            break;
          case 'date':
            response = new Date().toString();
            break;
          default:
            if (command.startsWith('echo ')) {
              response = command.substring(5);
            } else if (command.startsWith('claude ')) {
              response = `Executing Claude Code command: ${command}`;
            } else {
              response = `command not found: ${command}`;
            }
        }

        setOutput(prev => [...prev, response, '']);
        setIsRunning(false);
      },
      500 + Math.random() * 1000
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleCommand(currentInput);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex] || '');
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex =
            historyIndex === commandHistory.length - 1 ? -1 : historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentInput(
            newIndex === -1 ? '' : commandHistory[newIndex] || ''
          );
        }
        break;
      case 'Tab':
        e.preventDefault();
        // TODO: Implement autocomplete
        break;
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          if (isRunning) {
            setIsRunning(false);
            setOutput(prev => [...prev, '^C', '']);
          }
        }
        break;
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          setOutput([]);
        }
        break;
    }
  };

  const addTab = () => {
    const newTab: TerminalTab = {
      id: Date.now().toString(),
      title: 'bash',
      cwd: '~/project',
      isActive: false,
    };
    setTabs(prev =>
      prev
        .map(tab => ({ ...tab, isActive: false }))
        .concat({ ...newTab, isActive: true })
    );
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (filtered.length === 0) {
        return [
          {
            id: Date.now().toString(),
            title: 'bash',
            cwd: '~/project',
            isActive: true,
          },
        ];
      }

      const closingActiveTab = prev.find(tab => tab.id === tabId)?.isActive;
      if (closingActiveTab && filtered.length > 0 && filtered[0]) {
        filtered[0].isActive = true;
      }

      return filtered;
    });
  };

  const switchTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: tab.id === tabId })));
  };

  const copyOutput = () => {
    const text = output.join('\n');
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div
      className={cn(
        'flex flex-col bg-background',
        isMaximized ? 'fixed inset-0 z-50' : 'h-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card/30 backdrop-blur-sm">
        {/* Tabs */}
        <div className="flex items-center">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={cn(
                'group flex cursor-pointer items-center gap-2 border-r px-4 py-2',
                tab.isActive ? 'bg-background' : 'hover:bg-accent/50'
              )}
              onClick={() => switchTab(tab.id)}
            >
              <TerminalIcon className="h-4 w-4" />
              <span className="text-sm">{tab.title}</span>
              <span className="text-xs text-muted-foreground">{tab.cwd}</span>
              {tabs.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100"
                  onClick={e => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="m-1 h-8 w-8"
            onClick={addTab}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyOutput}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="custom-scrollbar terminal flex-1 overflow-y-auto p-4 font-mono text-sm"
        style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
      >
        {output.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="whitespace-pre-wrap"
          >
            {line}
          </motion.div>
        ))}

        {/* Current Input */}
        <div className="flex items-center">
          <span className="text-green-400">~/project$ </span>
          <input
            type="text"
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="ml-1 flex-1 border-none bg-transparent text-white outline-none"
            style={{ caretColor: '#d4d4d4' }}
            disabled={isRunning}
            autoFocus
          />
          {isRunning && (
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-2 text-yellow-400"
            >
              ●
            </motion.div>
          )}
        </div>

        {/* Cursor */}
        {!isRunning && (
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-1 inline-block h-4 w-2 bg-white"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t bg-card/30 px-4 py-2 text-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Connected to Claude Code CLI
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-green-500">Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Lines: {output.length}</span>
          <span>|</span>
          <span>History: {commandHistory.length}</span>
        </div>
      </div>
    </div>
  );
}
