import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper Provider component with test query client
type CustomRenderOptions = {
  queryClient?: QueryClient;
} & Omit<RenderOptions, 'wrapper'>;

function customRender(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock graph data for testing
export const mockGraphData = {
  nodes: [
    { id: 'root1', type: 'ROOT', title: 'Root IP', x: 0, y: 0 },
    { id: 'deriv1', type: 'DERIVATIVE', title: 'Derivative 1', data: { relationshipType: 'remix' }, x: 100, y: 0 },
    { id: 'deriv2', type: 'DERIVATIVE', title: 'Derivative 2', data: { relationshipType: 'sequel' }, x: 0, y: 100 },
    { id: 'related1', type: 'RELATED', title: 'Related 1', x: -100, y: 0 },
  ],
  links: [
    { id: 'link1', source: 'root1', target: 'deriv1', type: 'derivedBy' },
    { id: 'link2', source: 'root1', target: 'deriv2', type: 'derivedBy' },
    { id: 'link3', source: 'root1', target: 'related1', type: 'related' },
  ],
  metadata: {
    rootId: 'root1',
    timestamp: new Date().toISOString(),
  }
};

// Mock handlers for common events
export const mockHandlers = {
  onNodeClick: jest.fn(),
  onZoomIn: jest.fn(),
  onZoomOut: jest.fn(),
  onReset: jest.fn(),
  onNodeHover: jest.fn(),
  onSelectNode: jest.fn(),
};

// Graph Store Test Utilities
export const mockViewPreferences = {
  darkMode: false,
  nodeSize: 8,
  linkWidth: 1.5,
  labels: {
    fontSize: 4,
    maxLength: 20,
    fontColor: '#334155',
  },
  physics: {
    enabled: true,
    friction: 0.3,
    chargeStrength: -80,
    linkStrength: 50,
  },
  highlightedNode: null,
  highlightedPath: null,
};

export const mockFilters = {
  nodeTypes: ['ROOT', 'DERIVATIVE', 'RELATED'],
  relationshipTypes: ['remix', 'translation', 'sequel', 'prequel', 'adaptation'],
  showLabels: true,
  search: '',
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render };