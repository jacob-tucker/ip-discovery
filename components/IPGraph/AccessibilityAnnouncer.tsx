"use client";

import React, { useEffect, useState } from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number;
}

/**
 * AccessibilityAnnouncer Component
 * 
 * A component that announces messages to screen readers using ARIA live regions.
 * Used to provide dynamic updates and context to users of assistive technology.
 * 
 * @param message - The message to announce
 * @param assertive - Whether to use 'assertive' (true) or 'polite' (false) live region
 * @param clearAfter - Time in milliseconds after which to clear the announcement (default: 5000)
 */
export default function AccessibilityAnnouncer({
  message,
  assertive = false,
  clearAfter = 5000
}: AccessibilityAnnouncerProps) {
  const [announcement, setAnnouncement] = useState<string>(message);

  // Update announcement when message changes
  useEffect(() => {
    if (!message) return;
    
    // Set the announcement for screen readers
    setAnnouncement(message);
    
    // Clear announcement after specified time (for memory cleanup)
    const timerId = setTimeout(() => {
      setAnnouncement('');
    }, clearAfter);
    
    return () => clearTimeout(timerId);
  }, [message, clearAfter]);

  // Visually hidden but accessible to screen readers
  const ariaLive = assertive ? 'assertive' : 'polite';
  
  return (
    <div 
      aria-live={ariaLive}
      aria-atomic="true"
      className="sr-only"
      // This ensures the element is not visible but still accessible to screen readers
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0'
      }}
    >
      {announcement}
    </div>
  );
}

/**
 * Global Announcer Instance for use throughout the application
 */
export function useAccessibilityAnnouncer() {
  const [message, setMessage] = useState<string>('');
  const [assertive, setAssertive] = useState<boolean>(false);
  
  const announce = (text: string, isAssertive: boolean = false) => {
    setMessage(text);
    setAssertive(isAssertive);
  };
  
  return {
    announce,
    Announcer: () => (
      <AccessibilityAnnouncer 
        message={message} 
        assertive={assertive} 
      />
    )
  };
}