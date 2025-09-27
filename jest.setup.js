import '@testing-library/jest-dom'
import React from 'react'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null
  }

  disconnect() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  observe() {
    return null
  }

  disconnect() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock DOM methods
Element.prototype.scrollIntoView = jest.fn()
HTMLElement.prototype.scrollIntoView = jest.fn()

// Mock window.scrollTo
global.scrollTo = jest.fn()

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('div', { className, ...props }, children),
    button: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('button', { className, ...props }, children),
    span: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('span', { className, ...props }, children),
    p: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('p', { className, ...props }, children),
    h1: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('h1', { className, ...props }, children),
    h2: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('h2', { className, ...props }, children),
    h3: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('h3', { className, ...props }, children),
    section: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('section', { className, ...props }, children),
    article: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('article', { className, ...props }, children),
    aside: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('aside', { className, ...props }, children),
    nav: ({ children, initial, animate, transition, exit, className, ...props }) =>
      React.createElement('nav', { className, ...props }, children),
  },
  AnimatePresence: ({ children, mode, ...props }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// Suppress console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ className, ...props }) =>
    React.createElement('div', {
      'data-testid': 'mock-icon',
      className,
      ...props
    })

  return {
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    Home: MockIcon,
    FolderOpen: MockIcon,
    FileText: MockIcon,
    MessageSquare: MockIcon,
    Terminal: MockIcon,
    GitBranch: MockIcon,
    Search: MockIcon,
    Plus: MockIcon,
    Settings: MockIcon,
    Send: MockIcon,
    Square: MockIcon,
    Stop: MockIcon,
    User: MockIcon,
    Bot: MockIcon,
    Copy: MockIcon,
    Check: MockIcon,
    MoreHorizontal: MockIcon,
    Trash: MockIcon,
    Edit: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,
    RefreshCw: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Lock: MockIcon,
    Unlock: MockIcon,
    Mail: MockIcon,
    Phone: MockIcon,
    Calendar: MockIcon,
    Clock: MockIcon,
    Star: MockIcon,
    Heart: MockIcon,
    ThumbsUp: MockIcon,
    ThumbsDown: MockIcon,
    Share: MockIcon,
    ExternalLink: MockIcon,
    Link: MockIcon,
    Unlink: MockIcon,
    Paperclip: MockIcon,
    Image: MockIcon,
    File: MockIcon,
    Folder: MockIcon,
    Archive: MockIcon,
    Package: MockIcon,
    Database: MockIcon,
    Server: MockIcon,
    Globe: MockIcon,
    Wifi: MockIcon,
    WifiOff: MockIcon,
    Signal: MockIcon,
    Battery: MockIcon,
    BatteryLow: MockIcon,
    Volume: MockIcon,
    VolumeX: MockIcon,
    Camera: MockIcon,
    Video: MockIcon,
    VideoOff: MockIcon,
    Mic: MockIcon,
    MicOff: MockIcon,
    Speaker: MockIcon,
    Headphones: MockIcon,
    Monitor: MockIcon,
    Smartphone: MockIcon,
    Tablet: MockIcon,
    Laptop: MockIcon,
    HardDrive: MockIcon,
    Cpu: MockIcon,
    MemoryStick: MockIcon,
    Zap: MockIcon,
    Activity: MockIcon,
    TrendingUp: MockIcon,
    TrendingDown: MockIcon,
    BarChart: MockIcon,
    PieChart: MockIcon,
    Info: MockIcon,
    AlertCircle: MockIcon,
    AlertTriangle: MockIcon,
    CheckCircle: MockIcon,
    X: MockIcon,
    XCircle: MockIcon,
    Help: MockIcon,
    HelpCircle: MockIcon,
    Menu: MockIcon,
    MoreVertical: MockIcon,
    Grid: MockIcon,
    List: MockIcon,
    Layout: MockIcon,
    Sidebar: MockIcon,
    PanelLeft: MockIcon,
    PanelRight: MockIcon,
    Maximize: MockIcon,
    Minimize: MockIcon,
    Move: MockIcon,
    RotateCcw: MockIcon,
    RotateCw: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon,
    Focus: MockIcon,
    Scan: MockIcon,
    Filter: MockIcon,
    Sort: MockIcon,
    ArrowUp: MockIcon,
    ArrowDown: MockIcon,
    ArrowLeft: MockIcon,
    ArrowRight: MockIcon,
    ArrowUpDown: MockIcon,
    ArrowLeftRight: MockIcon,
    ChevronsUp: MockIcon,
    ChevronsDown: MockIcon,
    ChevronsLeft: MockIcon,
    ChevronsRight: MockIcon,
    ChevronUp: MockIcon,
    ChevronDown: MockIcon,
    SkipBack: MockIcon,
    SkipForward: MockIcon,
    FastForward: MockIcon,
    Rewind: MockIcon,
    Play: MockIcon,
    Pause: MockIcon,
    StepBack: MockIcon,
    StepForward: MockIcon,
    Repeat: MockIcon,
    Repeat1: MockIcon,
    Shuffle: MockIcon,
    Code: MockIcon,
    Code2: MockIcon,
    Terminal: MockIcon,
    Command: MockIcon,
    Hash: MockIcon,
    AtSign: MockIcon,
    DollarSign: MockIcon,
    Percent: MockIcon,
    Equal: MockIcon,
    Minus: MockIcon,
    Plus: MockIcon,
    Divide: MockIcon,
    Multiply: MockIcon,
  }
})