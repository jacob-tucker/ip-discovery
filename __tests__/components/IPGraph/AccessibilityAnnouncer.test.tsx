import React from 'react';
import { render, screen, waitFor, act } from '../../../test-utils';
import AccessibilityAnnouncer, { useAccessibilityAnnouncer } from '@/components/IPGraph/AccessibilityAnnouncer';

// Mock timer functions
jest.useFakeTimers();

describe('AccessibilityAnnouncer Component', () => {
  it('renders with correct ARIA attributes', () => {
    const { container } = render(
      <AccessibilityAnnouncer message="Test announcement" />
    );
    
    // Get the announcer element
    const announcer = container.firstChild;
    
    // Check ARIA attributes
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
    
    // Should have sr-only style
    expect(announcer).toHaveClass('sr-only');
    
    // Should contain the message
    expect(announcer).toHaveTextContent('Test announcement');
  });
  
  it('uses assertive politeness when specified', () => {
    const { container } = render(
      <AccessibilityAnnouncer message="Important announcement" assertive={true} />
    );
    
    // Get the announcer element
    const announcer = container.firstChild;
    
    // Should have assertive politeness
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });
  
  it('clears announcement after specified time', async () => {
    const { container, rerender } = render(
      <AccessibilityAnnouncer message="Test announcement" clearAfter={1000} />
    );
    
    // Initially has the message
    expect(container.firstChild).toHaveTextContent('Test announcement');
    
    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force a re-render to see the effect of the timeout
    rerender(<AccessibilityAnnouncer message="Test announcement" clearAfter={1000} />);
    
    // Wait for state update
    await waitFor(() => {
      expect(container.firstChild).toHaveTextContent('');
    });
  });
  
  it('updates announcement when message changes', () => {
    const { container, rerender } = render(
      <AccessibilityAnnouncer message="First announcement" />
    );
    
    // Initially has the first message
    expect(container.firstChild).toHaveTextContent('First announcement');
    
    // Update with new message
    rerender(<AccessibilityAnnouncer message="Second announcement" />);
    
    // Should have the updated message
    expect(container.firstChild).toHaveTextContent('Second announcement');
  });
});

describe('useAccessibilityAnnouncer Hook', () => {
  it('provides announce function and Announcer component', () => {
    // Component to test the hook
    const TestComponent = () => {
      const { announce, Announcer } = useAccessibilityAnnouncer();
      
      return (
        <div>
          <button onClick={() => announce('Button clicked')}>
            Announce
          </button>
          <button onClick={() => announce('Important message', true)}>
            Announce Important
          </button>
          <Announcer />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Initial state - no announcement
    const announcer = screen.getByRole('generic', { hidden: true });
    expect(announcer).toHaveTextContent('');
    
    // Click the announce button
    act(() => {
      screen.getByText('Announce').click();
    });
    
    // Should update the announcement
    expect(announcer).toHaveTextContent('Button clicked');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    
    // Click the important announce button
    act(() => {
      screen.getByText('Announce Important').click();
    });
    
    // Should update the announcement with assertive politeness
    expect(announcer).toHaveTextContent('Important message');
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });
});