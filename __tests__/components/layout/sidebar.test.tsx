import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/layout/sidebar';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="mock-icon">
      <title>Mock Icon</title>
    </svg>
  );
  
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
  };
});

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
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Git')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
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
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('should render footer actions', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
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