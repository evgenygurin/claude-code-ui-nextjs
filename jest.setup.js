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

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = React.forwardRef(({ className, 'data-testid': testId, ...props }, ref) => 
    React.createElement('svg', {
      ref,
      className,
      'data-testid': testId,
      'aria-label': props['aria-label'] || 'icon',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props
    })
  )
  
  MockIcon.displayName = 'MockIcon'
  
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
    Copy: MockIcon,
    MoreVertical: MockIcon,
    User: MockIcon,
    Bot: MockIcon,
    Code: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,
    Trash2: MockIcon,
    Edit: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
  }
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => React.createElement('div', { ref, ...props }, children)),
    button: React.forwardRef(({ children, ...props }, ref) => React.createElement('button', { ref, ...props }, children)),
    span: React.forwardRef(({ children, ...props }, ref) => React.createElement('span', { ref, ...props }, children)),
    p: React.forwardRef(({ children, ...props }, ref) => React.createElement('p', { ref, ...props }, children)),
    h1: React.forwardRef(({ children, ...props }, ref) => React.createElement('h1', { ref, ...props }, children)),
    h2: React.forwardRef(({ children, ...props }, ref) => React.createElement('h2', { ref, ...props }, children)),
    h3: React.forwardRef(({ children, ...props }, ref) => React.createElement('h3', { ref, ...props }, children)),
    section: React.forwardRef(({ children, ...props }, ref) => React.createElement('section', { ref, ...props }, children)),
    article: React.forwardRef(({ children, ...props }, ref) => React.createElement('article', { ref, ...props }, children)),
    aside: React.forwardRef(({ children, ...props }, ref) => React.createElement('aside', { ref, ...props }, children)),
    nav: React.forwardRef(({ children, ...props }, ref) => React.createElement('nav', { ref, ...props }, children)),
  },
  AnimatePresence: ({ children }) => children,
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