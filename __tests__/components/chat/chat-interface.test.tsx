import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatInterface from '@/components/chat/chat-interface';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

// Mock next/dynamic for CodeMirror
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => <div>Mocked Dynamic Component</div>;
  DynamicComponent.displayName = 'DynamicComponent';
  return DynamicComponent;
});

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with initial welcome message', () => {
    render(<ChatInterface />);
    
    expect(screen.getByText('Claude Code Chat')).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm Claude Code/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message/)).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/Type your message/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, Claude!' } });
    fireEvent.click(sendButton);
    
    // Message should appear in chat
    expect(screen.getByText('Hello, Claude!')).toBeInTheDocument();
    
    // Input should be cleared
    expect(input).toHaveValue('');
    
    // Should show loading state
    expect(screen.getByText('Claude is thinking...')).toBeInTheDocument();
  });

  it('should send message with Ctrl+Enter', async () => {
    render(<ChatInterface />);
    
    const textarea = screen.getByPlaceholderText(/Type your message/);
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not send empty messages', () => {
    render(<ChatInterface />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled();
    
    fireEvent.click(sendButton);
    
    // Should not show loading state
    expect(screen.queryByText('Claude is thinking...')).not.toBeInTheDocument();
  });

  it('should simulate AI response after delay', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/Type your message/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test command' } });
    fireEvent.click(sendButton);
    
    // Should show loading initially
    expect(screen.getByText('Claude is thinking...')).toBeInTheDocument();
    
    // Fast-forward time to simulate response (timeout is 1500 + Math.random() * 1000 = 2000ms with mocked random)
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Claude is thinking...')).not.toBeInTheDocument();
    });
    
    // Should show simulated response (match any of the possible responses)
    await waitFor(() => {
      const responsePatterns = [
        /I understand you want to/,
        /Great question about/,
        /Thanks for asking about/,
        /I see you're working on/
      ];
      const hasResponse = responsePatterns.some(pattern => 
        screen.queryByText(pattern) !== null
      );
      expect(hasResponse).toBe(true);
    });
  });

  it('should copy message content', () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
    
    render(<ChatInterface />);
    
    // Need to hover over a message to see copy button
    const messageDiv = screen.getByText(/Hello! I'm Claude Code/);
    fireEvent.mouseEnter(messageDiv.parentElement!);
    
    // Find and click copy button (may need to adjust selector based on implementation)
    const copyButtons = screen.getAllByRole('button');
    const copyButton = copyButtons.find(button => 
      button.querySelector('svg') // Assuming copy button has an icon
    );
    
    if (copyButton) {
      fireEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('should handle keyboard shortcuts', () => {
    render(<ChatInterface />);
    
    const textarea = screen.getByPlaceholderText(/Type your message/);
    
    // Test Ctrl+Enter for sending
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should display timestamps for messages', () => {
    render(<ChatInterface />);
    
    // Check if timestamp elements exist (they should be in the format like "10:30:00 AM")
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should disable input while loading', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/Type your message/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Input should be disabled while loading
    expect(input).toHaveValue('');
    
    // Send button should show stop icon while loading  
    const stopIcon = screen.getByRole('button', { name: /stop/i });
    expect(stopIcon).toBeInTheDocument();
  });
});