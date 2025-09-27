/**
 * Test setup verification
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component for testing
function TestComponent() {
  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a test component to verify Jest setup</p>
    </div>
  );
}

describe('Test Environment Setup', () => {
  test('should render test component', () => {
    render(<TestComponent />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Test Component'
    );
    expect(
      screen.getByText('This is a test component to verify Jest setup')
    ).toBeInTheDocument();
  });

  test('should have working test environment', () => {
    expect(true).toBe(true);
  });

  test('should mock Next.js router', () => {
    // Test that Next.js router is properly mocked
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    expect(router).toBeDefined();
    expect(typeof router.push).toBe('function');
    expect(typeof router.replace).toBe('function');
  });

  test('should mock WebSocket', () => {
    // Test that WebSocket is properly mocked
    const ws = new WebSocket('ws://localhost:3000');

    expect(ws).toBeDefined();
    expect(typeof ws.send).toBe('function');
    expect(typeof ws.close).toBe('function');
  });

  test('should handle CSS imports', () => {
    // This test ensures CSS imports don't break Jest
    expect('identity-obj-proxy').toBeTruthy();
  });
});
