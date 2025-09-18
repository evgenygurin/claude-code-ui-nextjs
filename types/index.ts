// Core application types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  displayName?: string;
  path: string;
  description?: string;
  type: 'claude' | 'cursor' | 'mixed';
  language: string;
  framework?: string;
  lastAccessed: Date;
  sessionCount: number;
  isActive: boolean;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  autoSave: boolean;
  wordWrap: boolean;
  fontSize: number;
  tabSize: number;
  theme: 'light' | 'dark' | 'system';
  enabledTools: string[];
  aiProvider: 'claude' | 'cursor' | 'openai';
  model: string;
}

export interface Session {
  id: string;
  projectId: string;
  name?: string;
  provider: 'claude' | 'cursor';
  model?: string;
  status: 'active' | 'completed' | 'error' | 'aborted';
  messageCount: number;
  startedAt: Date;
  lastMessageAt?: Date;
  completedAt?: Date;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  executionTime?: number;
  errorMessage?: string;
  userAgent?: string;
  version?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'code' | 'file' | 'image' | 'error';
  metadata: MessageMetadata;
  timestamp: Date;
}

export interface MessageMetadata {
  language?: string;
  filePath?: string;
  fileSize?: number;
  imageUrl?: string;
  codeBlocks?: CodeBlock[];
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  streaming?: boolean;
  error?: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
  startLine?: number;
  endLine?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'document';
  url: string;
  size: number;
  mimeType: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  executionTime?: number;
}

// File system types
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  permissions?: string;
  children?: FileItem[];
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
  encoding: string;
  size: number;
  modified: Date;
  readOnly: boolean;
}

// Git types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFile[];
  unstaged: GitFile[];
  untracked: string[];
  conflicts: string[];
  isClean: boolean;
}

export interface GitFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  shortHash: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  lastCommit?: GitCommit;
}

// Terminal types
export interface TerminalSession {
  id: string;
  projectId: string;
  cwd: string;
  shell: string;
  provider: 'claude' | 'cursor' | 'plain';
  status: 'running' | 'completed' | 'error';
  startedAt: Date;
  endedAt?: Date;
  exitCode?: number;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  id?: string;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface ChatMessage extends WebSocketMessage {
  type: 'chat-message';
  data: {
    sessionId: string;
    message: string;
    provider: 'claude' | 'cursor';
    model?: string;
    attachments?: Attachment[];
  };
}

export interface TerminalMessage extends WebSocketMessage {
  type: 'terminal-data' | 'terminal-resize' | 'terminal-init';
  data: {
    sessionId: string;
    content?: string;
    rows?: number;
    cols?: number;
    cwd?: string;
    shell?: string;
  };
}

// UI state types
export interface UIState {
  sidebar: {
    isOpen: boolean;
    width: number;
    activeTab: 'projects' | 'sessions' | 'files' | 'git';
  };
  chat: {
    isStreaming: boolean;
    selectedSessionId?: string;
  };
  editor: {
    openFiles: FileContent[];
    activeFileIndex: number;
  };
  terminal: {
    isOpen: boolean;
    height: number;
    activeSessionId?: string;
  };
  theme: 'light' | 'dark' | 'system';
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Settings types
export interface AppSettings {
  general: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoSave: boolean;
    autoUpdate: boolean;
  };
  editor: {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
  };
  terminal: {
    fontSize: number;
    fontFamily: string;
    shell: string;
    scrollback: number;
  };
  ai: {
    defaultProvider: 'claude' | 'cursor' | 'openai';
    claudeModel: string;
    cursorModel: string;
    openaiModel: string;
    temperature: number;
    maxTokens: number;
  };
  security: {
    enabledTools: string[];
    allowFileWrite: boolean;
    allowShellAccess: boolean;
    allowNetworkAccess: boolean;
  };
  performance: {
    maxSessions: number;
    maxFileSize: number;
    enableCodeCompletion: boolean;
    enableSyntaxHighlighting: boolean;
  };
}

// Error types
export interface AppError extends Error {
  code: string;
  type: 'validation' | 'authorization' | 'network' | 'internal' | 'external';
  details?: Record<string, any>;
  retryable?: boolean;
}

// Event types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: 'user' | 'system' | 'ai';
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Re-export common types
export type { ClassValue } from 'clsx';