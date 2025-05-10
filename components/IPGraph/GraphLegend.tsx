"use client";

import React, { useState, useCallback } from 'react';
import { InfoIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useGraphFilters } from '@/lib/hooks/useGraphFilters';
import { getNodeColor, getLinkColor } from '@/lib/utils/graph/graph-transform';
import { NodeType, LinkType, RelationshipType } from '@/types/graph';
import { cn } from '@/lib/utils';

interface GraphLegendProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
  closable?: boolean;
  title?: string;
  compact?: boolean;
}

/**
 * GraphLegend Component
 * 
 * Displays a legend explaining the node types, edge types, and color coding
 * used in the Derivative Galaxy graph.
 */
export default function GraphLegend({
  className = '',
  position = 'bottom-left',
  onClose,
  closable = false,
  title = 'Legend',
  compact = false
}: GraphLegendProps) {
  // Get view preferences from Zustand store
  const { viewPreferences } = useGraphFilters();
  
  // Local state for section visibility
  const [showNodeTypes, setShowNodeTypes] = useState(true);
  const [showLinkTypes, setShowLinkTypes] = useState(true);
  const [showRelationshipTypes, setShowRelationshipTypes] = useState(!compact);
  
  // Toggle section visibility handlers
  const toggleNodeTypes = useCallback(() => {
    setShowNodeTypes(prev => !prev);
  }, []);
  
  const toggleLinkTypes = useCallback(() => {
    setShowLinkTypes(prev => !prev);
  }, []);
  
  const toggleRelationshipTypes = useCallback(() => {
    setShowRelationshipTypes(prev => !prev);
  }, []);
  
  // Handle close button click
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // Get node type display data
  const nodeTypeData = [
    { type: NodeType.ROOT, label: 'Root IP', description: 'The central IP being viewed' },
    { type: NodeType.ANCESTOR, label: 'Ancestor', description: 'IPs that the root derives from' },
    { type: NodeType.DERIVATIVE, label: 'Derivative', description: 'IPs derived from the root' },
    { type: NodeType.SIBLING, label: 'Sibling', description: 'IPs with the same ancestor' },
    { type: NodeType.RELATED, label: 'Related', description: 'IPs with indirect relationships' },
    { type: NodeType.DISPUTED, label: 'Disputed', description: 'IPs with contested relationships' }
  ];

  // Get link type display data
  const linkTypeData = [
    { type: LinkType.DERIVES_FROM, label: 'Derives From', description: 'Target is derived from source' },
    { type: LinkType.DERIVED_BY, label: 'Derived By', description: 'Source has been derived by target' },
    { type: LinkType.COMMON_ANCESTOR, label: 'Common Ancestor', description: 'Nodes share an ancestor' },
    { type: LinkType.RELATED, label: 'Related', description: 'General relationship' }
  ];

  // Get relationship type display data (for the deeper categorization)
  const relationshipTypeData = [
    { type: RelationshipType.REMIX, label: 'Remix', description: 'Creative derivative work' },
    { type: RelationshipType.ADAPTATION, label: 'Adaptation', description: 'Adapted for different medium' },
    { type: RelationshipType.TRANSLATION, label: 'Translation', description: 'Translated to different language' },
    { type: RelationshipType.SEQUEL, label: 'Sequel', description: 'Continuation of original' },
    { type: RelationshipType.PREQUEL, label: 'Prequel', description: 'Story set before original' },
    { type: RelationshipType.SPINOFF, label: 'Spinoff', description: 'Story branched from original' },
    { type: RelationshipType.INSPIRATION, label: 'Inspiration', description: 'Inspired by original' }
  ];

  // Get position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div 
      className={cn(
        'graph-legend',
        'rounded-md border shadow-sm overflow-hidden transition-all',
        'max-w-xs z-10',
        viewPreferences.darkMode 
          ? 'bg-slate-800 border-slate-700 text-white' 
          : 'bg-white border-slate-200 text-slate-900',
        positionClasses[position],
        className
      )}
      style={{
        position: 'absolute',
        maxHeight: compact ? '300px' : '400px',
        maxWidth: compact ? '220px' : '280px',
        overflow: 'auto'
      }}
      aria-label="Graph legend"
    >
      {/* Header */}
      <div className={cn(
        'p-2 flex justify-between items-center',
        'border-b',
        viewPreferences.darkMode ? 'border-slate-700' : 'border-slate-200'
      )}>
        <h3 className="text-sm font-medium flex items-center">
          <InfoIcon className="h-3.5 w-3.5 mr-1" />
          {title}
        </h3>
        
        {closable && (
          <button
            onClick={handleClose}
            className={cn(
              'p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700',
              'transition-colors duration-200'
            )}
            aria-label="Close legend"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Legend content */}
      <div className="p-2 space-y-3">
        {/* Node Types */}
        <div>
          <button
            onClick={toggleNodeTypes}
            className="flex justify-between items-center w-full text-left mb-1"
          >
            <span className="text-xs font-medium">Node Types</span>
            {showNodeTypes ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          
          {showNodeTypes && (
            <div className="space-y-1.5 mt-1">
              {nodeTypeData.map(({ type, label, description }) => {
                const color = getNodeColor({ type } as any);
                
                return (
                  <div key={type} className="flex items-start">
                    <div 
                      className="h-3.5 w-3.5 rounded-full mt-0.5 flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="ml-2">
                      <div className="text-xs font-medium">{label}</div>
                      {!compact && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Link Types */}
        <div>
          <button
            onClick={toggleLinkTypes}
            className="flex justify-between items-center w-full text-left mb-1"
          >
            <span className="text-xs font-medium">Link Types</span>
            {showLinkTypes ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          
          {showLinkTypes && (
            <div className="space-y-1.5 mt-1">
              {linkTypeData.map(({ type, label, description }) => {
                const color = getLinkColor({ type } as any);
                
                return (
                  <div key={type} className="flex items-start">
                    <div className="flex-shrink-0 mt-1.5">
                      <div 
                        className="h-0.5 w-6 rounded-sm" 
                        style={{ 
                          backgroundColor: color,
                          borderStyle: type === LinkType.RELATED ? 'dashed' : 'solid'
                        }}
                      />
                    </div>
                    <div className="ml-2">
                      <div className="text-xs font-medium">{label}</div>
                      {!compact && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Relationship Types - only shown if not compact */}
        {!compact && (
          <div>
            <button
              onClick={toggleRelationshipTypes}
              className="flex justify-between items-center w-full text-left mb-1"
            >
              <span className="text-xs font-medium">Relationship Types</span>
              {showRelationshipTypes ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            
            {showRelationshipTypes && (
              <div className="space-y-1.5 mt-1">
                {relationshipTypeData.map(({ type, label, description }) => (
                  <div key={type} className="flex items-start">
                    <div 
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] rounded-sm flex-shrink-0",
                        "font-medium mt-0.5",
                        viewPreferences.darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      )}
                    >
                      {type.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="ml-2">
                      <div className="text-xs font-medium">{label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with additional info */}
      {!compact && (
        <div className={cn(
          'p-2 text-[10px] text-slate-500 dark:text-slate-400 border-t',
          viewPreferences.darkMode ? 'border-slate-700' : 'border-slate-200'
        )}>
          <p>
            <strong>Interaction:</strong> Click a node to select it. Hover for details. 
            Use controls to filter or search the graph.
          </p>
        </div>
      )}
    </div>
  );
}