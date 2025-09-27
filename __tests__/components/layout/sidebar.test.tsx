import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/layout/sidebar';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, exit, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, initial, animate, transition, exit, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right">ChevronRight</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  FolderOpen: () => <div data-testid="folder-open-icon">FolderOpen</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  MessageSquare: () => <div data-testid="message-square-icon">MessageSquare</div>,
  Terminal: () => <div data-testid="terminal-icon">Terminal</div>,
  GitBranch: () => <div data-testid="git-branch-icon">GitBranch</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

describe('Sidebar', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
    activeView: 'home',
    onViewChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with all navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Claude Code UI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /file explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /terminal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /git/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('should call onToggle when toggle button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);
    
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onViewChange when navigation item is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    
    const projectsButton = screen.getByRole('button', { name: /projects/i });
    fireEvent.click(projectsButton);
    
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('projects');
  });

  it('should highlight active view', () => {
    render(<Sidebar {...defaultProps} activeView="chat" />);
    
    const chatButton = screen.getByRole('button', { name: /chat/i });
    expect(chatButton).toHaveClass('bg-accent/80');
  });

  it('should handle collapsed state', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    // When collapsed, text should not be visible
    expect(screen.queryByText('Claude Code UI')).not.toBeInTheDocument();
    // Check that navigation labels are not visible when collapsed
    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toBeInTheDocument();
    // Icons should still be visible, but text labels should be hidden
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });

  it('should render footer actions', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('should call onViewChange for footer actions', () => {
    render(<Sidebar {...defaultProps} />);
    
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    fireEvent.click(newProjectButton);
    
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('new-project');
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('settings');
  });
});