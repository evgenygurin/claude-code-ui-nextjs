'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Square, Copy, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hello! I'm Claude Code, your AI assistant. I can help you with coding tasks, file management, and various development workflows. What would you like to work on today?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateResponse = (userMessage: string): string => {
    const responses = [
      `I understand you want to "${userMessage}". Let me help you with that. Here's what I can do to assist you with this task.`,
      `Great question about "${userMessage}". This is a common development task that I can help you solve step by step.`,
      `Thanks for asking about "${userMessage}". I'll provide you with a comprehensive solution and explanation.`,
      `I see you're working on "${userMessage}". This is definitely something I can help you with. Let me break it down for you.`,
    ];
    const index = Math.floor(Math.random() * responses.length);
    return responses[index] as string;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(
      () => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: simulateResponse(userMessage.content),
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      },
      1500 + Math.random() * 1000
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <h1 className="text-xl font-semibold text-foreground">
          Claude Code Chat
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered assistant for coding and development tasks
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="custom-scrollbar h-full overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'group flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    'message-bubble max-w-[80%] rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.content}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => copyToClipboard(message.content)}
                      aria-label="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Claude is thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Ctrl+Enter to send)"
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '200px',
                height: 'auto',
              }}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12"
            aria-label={isLoading ? 'Stop' : 'Send message'}
          >
            {isLoading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Press Ctrl+Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
