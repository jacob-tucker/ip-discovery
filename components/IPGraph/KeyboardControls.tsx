"use client";

import React, { useState } from 'react';
import { GraphNode } from '@/types/graph';

interface KeyboardControlsProps {
  visible: boolean;
  onEscape: () => void;
  onNodeSelect: (node: GraphNode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  focusedNode: GraphNode | null;
  nodes: GraphNode[];
  focusedNodeIndex: number;
  isDarkMode: boolean;
}

/**
 * Keyboard navigation info component that shows keyboard shortcuts and focus state
 */
export default function KeyboardControls({
  visible,
  onEscape,
  onNodeSelect,
  onZoomIn,
  onZoomOut,
  onReset,
  focusedNode,
  nodes,
  focusedNodeIndex,
  isDarkMode
}: KeyboardControlsProps) {
  // Show or hide detailed help
  const [showHelp, setShowHelp] = useState(false);
  
  if (!visible) return null;
  
  // Keyboard shortcuts to display
  const keyboardShortcuts = [
    { key: 'Tab', action: 'Enter focus mode / Navigate between nodes' },
    { key: 'Esc', action: 'Exit focus mode' },
    { key: 'Enter', action: 'Select focused node' },
    { key: 'Arrow keys', action: 'Navigate between nodes' },
    { key: '+/-', action: 'Zoom in/out' },
    { key: 'R', action: 'Reset view' },
    { key: 'H', action: 'Toggle help' }
  ];
  
  return (
    <div 
      className={`keyboard-controls ${isDarkMode ? 'dark' : ''} ${showHelp ? 'expanded' : ''}`}
      role="region"
      aria-label="Keyboard navigation controls"
    >
      <div className="keyboard-controls-header">
        <h3>Keyboard Navigation {showHelp ? '' : '(Press H for help)'}</h3>
        <button 
          className="keyboard-controls-toggle"
          onClick={() => setShowHelp(!showHelp)}
          aria-label={showHelp ? 'Hide keyboard shortcuts' : 'Show keyboard shortcuts'}
        >
          {showHelp ? 'Hide' : 'Show'} Help
        </button>
      </div>
      
      {/* Current focus information */}
      <div className="keyboard-focus-info">
        <div className="focus-status">
          <span className="focus-label">Focus Mode:</span>
          <span className={`focus-value ${visible ? 'active' : ''}`}>
            {visible ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {focusedNode && (
          <div className="focused-node-info">
            <span className="focus-label">Selected Node:</span>
            <span className="focus-node-name">{focusedNode.title}</span>
            <span className="focus-node-type">({focusedNode.type})</span>
          </div>
        )}
        
        <div className="focus-navigation">
          <span>Node {focusedNodeIndex + 1} of {nodes.length}</span>
        </div>
      </div>
      
      {/* Show keyboard shortcuts if help is expanded */}
      {showHelp && (
        <div className="keyboard-shortcuts">
          <h4>Keyboard Shortcuts</h4>
          <ul>
            {keyboardShortcuts.map((shortcut, index) => (
              <li key={index} className="shortcut-item">
                <kbd>{shortcut.key}</kbd>
                <span>{shortcut.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Quick action buttons for keyboard-equivalent actions */}
      <div className="keyboard-actions">
        <button 
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="keyboard-action-button"
        >
          <span>+</span> Zoom In
        </button>
        <button 
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="keyboard-action-button"
        >
          <span>-</span> Zoom Out
        </button>
        <button 
          onClick={onReset}
          aria-label="Reset view"
          className="keyboard-action-button"
        >
          <span>R</span> Reset
        </button>
        <button 
          onClick={onEscape}
          aria-label="Exit focus mode"
          className="keyboard-action-button"
        >
          <span>Esc</span> Exit
        </button>
      </div>
    </div>
  );
}