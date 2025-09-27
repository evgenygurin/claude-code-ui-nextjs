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
  const MockIcon = ({ className, 'data-testid': testId, ...props }) => 
    React.createElement('svg', {
      className,
      'data-testid': testId,
      'aria-label': props['aria-label'] || 'icon',
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
    div: ({ children, ...props }) => React.createElement('div', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
    h1: ({ children, ...props }) => React.createElement('h1', props, children),
    h2: ({ children, ...props }) => React.createElement('h2', props, children),
    h3: ({ children, ...props }) => React.createElement('h3', props, children),
    section: ({ children, ...props }) => React.createElement('section', props, children),
    article: ({ children, ...props }) => React.createElement('article', props, children),
    aside: ({ children, ...props }) => React.createElement('aside', props, children),
    nav: ({ children, ...props }) => React.createElement('nav', props, children),
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