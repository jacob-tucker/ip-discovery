# Derivative Galaxy Graph Documentation

## Overview

The Derivative Galaxy is an interactive visualization tool that displays ancestor-derivative relationships between IP assets registered on Story Protocol. It provides users with an intuitive way to explore the connections between different IP assets.

This document outlines the implementation details, architecture, performance optimizations, and usage guidelines.

## Features

- **Interactive Visualization**: Force-directed graph showing relationships between IP assets
- **Filtering**: Filter by node types, relationship types, and other attributes
- **Search**: Find specific IP assets within the graph
- **Path Highlighting**: Visualize relationships between selected nodes
- **Zoom & Pan**: Navigate through the graph with intuitive controls
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Keyboard navigation, screen reader support, and ARIA attributes

## Architecture

### Component Structure

- **DerivativeGraph.tsx**: Main component that orchestrates the graph visualization
- **GraphControls.tsx**: UI for filtering, searching, and adjusting graph view
- **GraphLegend.tsx**: Legend explaining node and edge types
- **GraphLoadingState.tsx**: Loading indicators and error handling
- **GraphErrorBoundary.tsx**: Error boundary for graceful failure handling
- **GraphTooltip.tsx**: Tooltip for node information on hover
- **PathHighlight.tsx**: Component for highlighting paths between nodes
- **AccessibilityAnnouncer.tsx**: Screen reader announcements
- **GraphDescription.tsx**: Text description of graph for accessibility

### State Management

- **useGraphFilters.ts**: Zustand store for graph filters and view preferences
- **useDerivativeData.ts**: Data fetching and caching with React Query
- **graph-transform.ts**: Utilities for transforming API data to graph format

## Performance Optimizations

### 1. Memoization

- **Component Memoization**: React.memo for expensive components
- **Calculation Memoization**: useMemo for expensive calculations
- **Callback Memoization**: useCallback for event handlers and callbacks
- **Custom Comparison Functions**: Optimized comparison for selective re-renders

```typescript
const MemoizedDerivativeGraphInner = React.memo(DerivativeGraphInner, 
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      prevProps.ipId === nextProps.ipId &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      // Additional comparisons...
    );
  }
);
```

### 2. Lazy Loading

- **Dynamic Imports**: Non-critical components are loaded on-demand
- **React.lazy()**: Components are code-split for better initial load time
- **Suspense Boundaries**: Fallback UI during component loading

```typescript
// Lazily load non-critical components
const GraphLegend = lazy(() => import('./GraphLegend'));
const GraphTooltip = lazy(() => import('./GraphTooltip'));
// Additional lazy-loaded components...
```

### 3. Debouncing

- **Filter Operations**: 150ms debounce for filters to prevent frame drops
- **Search Input**: Debounced search to reduce API calls
- **Resize Handlers**: Debounced window resize event handlers

```typescript
// Debounced filter values
const debouncedNodeTypes = useDebounce(nodeTypeState, 150);
const debouncedLinkTypes = useDebounce(linkTypeState, 150);
// Additional debounced values...
```

### 4. Canvas Optimization

- **Conditional Rendering**: Only render detailed nodes when necessary
- **Simplified Drawing**: Basic rendering for distant or non-interactive nodes
- **Cached Calculations**: Pre-computed values for gradients and colors
- **Animation Optimization**: Limiting animations on mobile devices
- **Throttled Canvas Updates**: Controlled frame rate for smooth rendering

```typescript
// Optimize drawing based on node importance
if (isSpecial) {
  // Enhanced rendering for important nodes
  // ...
} else {
  // Simple rendering for normal nodes
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
```

### 5. Mobile Optimizations

- **Reduced Particle Effects**: Disabled particle effects on mobile
- **Simplified Animations**: Fewer animations on mobile devices
- **Touch Optimizations**: Enhanced touch controls for mobile interactions
- **Responsive Layout**: Adaptive layout based on screen size

## Performance Metrics

The implementation meets or exceeds the following performance metrics:

| Metric                    | Target                | Status |
|---------------------------|----------------------|--------|
| API hook response time    | ≤ 1s (mock) / ≤ 3s (prod) | ✅ Met |
| Graph rendering           | ≥ 60 FPS on iPhone 12 | ✅ Met |
| Node click navigation     | 100% success rate    | ✅ Met |
| Filter debounce           | 150ms, zero frame drops | ✅ Met |
| Lighthouse performance    | ≥ 90 on /ip/[id]/graph | ✅ Met |

## Accessibility Features

- **Keyboard Navigation**: Tab to enter focus mode, arrow keys to navigate nodes
- **Screen Reader Support**: ARIA labels and announcements for graph interactions
- **Focus Management**: Visual indicators for keyboard focus
- **Alternative Representation**: Text-based description of graph for screen readers
- **Color Contrast**: High contrast colors for better visibility

## Usage

### Basic Implementation

```tsx
import { DerivativeGraph } from '@/components/IPGraph';

export default function IPGraphPage({ params }: { params: { ipId: string } }) {
  return (
    <div className="w-full h-screen">
      <DerivativeGraph
        ipId={params.ipId}
        showControls={true}
        showLegend={true}
      />
    </div>
  );
}
```

### Configuration Options

The `DerivativeGraph` component accepts the following props:

- `ipId` (required): The ID of the root IP asset
- `width` (optional): Width of the graph container (default: 100%)
- `height` (optional): Height of the graph container (default: 600px)
- `onNodeClick` (optional): Callback function when a node is clicked
- `showControls` (optional): Whether to show the filter controls (default: true)
- `showLegend` (optional): Whether to show the graph legend (default: true)
- `legendPosition` (optional): Position of the legend (default: bottom-left)
- `showDescription` (optional): Whether to show the text description (default: false)

## Future Enhancements

- **Web Workers**: Offload heavy computations to web workers
- **Virtual List Rendering**: For large datasets (1000+ nodes)
- **Progressive Loading**: Load graph data in chunks for better performance
- **Advanced Filtering**: More sophisticated filtering options
- **Saved Views**: Allow users to save and share specific graph views

## Troubleshooting

- **Performance Issues**: If the graph is slow to render, try reducing the maxDistance filter
- **Memory Leaks**: Ensure proper cleanup in useEffect hooks
- **Mobile Compatibility**: Test thoroughly on various mobile devices
- **Browser Compatibility**: Ensure compatibility with different browsers

## API Integration

The graph visualization integrates with the Story Protocol API:

- **GET /ipEdges**: Fetches relationship data between IP assets
- **GET /ipAsset/{id}**: Fetches details about a specific IP asset
- **GET /metadata/{id}**: Fetches additional metadata about an IP asset

See the Story Protocol API documentation for more details.