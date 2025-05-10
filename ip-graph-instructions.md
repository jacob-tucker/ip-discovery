# 🚀 Derivative Galaxy (Interactive Remix Graph) - Implementation Blueprint

For AI coding assistants (Claude Code, GPT Engineer, etc.)

---

## 0. Context & Goal

Ship an interactive, zoomable "Derivative Galaxy" graph for each IP-NFT that visualizes every ancestor ↔ derivative relationship on Story Protocol.
The feature lives inside an existing Next.js 14 (App Router, TypeScript) codebase and must be production-ready with tests.

---

## 1. Tech Stack & New Dependencies

| Purpose              | Package               | Notes                        |
| -------------------- | --------------------- | ---------------------------- |
| Force-directed graph | react-force-graph-2d  | Canvas → best perf on mobile |
| Data fetching/cache  | @tanstack/react-query | If not already using SWR     |
| State (filters, UI)  | zustand               | Light, ergonomic             |
| Animation utilities  | d3-ease               | Optional, but recommended    |
| E2E tests            | @playwright/test      | Cypress also acceptable      |
| Mock API             | msw                   | For unit/integration tests   |

### API Integration

The Story Protocol API (https://api.storyapis.com) will be used for fetching IP relationship data. See CLAUDE.md for detailed API documentation and implementation guidelines.

Key endpoints:

- List IP Edges: For relationship data
- Get IPAsset: For node details
- Get metadata: For additional IP information

Rate limits and authentication details are documented in CLAUDE.md.

### Installation

```bash
# Core dependencies
pnpm add react-force-graph-2d @tanstack/react-query zustand d3-ease

# Development dependencies
pnpm add -D @playwright/test msw @testing-library/react @testing-library/jest-dom
```

---

## 2. Directory Structure

```
.
├─ app/
│  ├─ ip/
│  │  ├─ [id]/
│  │  │  ├─ page.tsx           # existing IP detail page
│  │  │  └─ graph/
│  │  │     └─ page.tsx        # NEW: graph view page
│  │  └─ page.tsx             # IP listing page
│  └─ layout.tsx              # root layout
├─ components/
│  ├─ ui/                     # existing UI components
│  ├─ modals/                 # existing modal components
│  ├─ IPGraph/               # NEW: graph components
│  │  ├─ DerivativeGraph.tsx  # main graph visualization
│  │  ├─ GraphControls.tsx    # zoom, filter controls
│  │  ├─ GraphLegend.tsx      # graph node/edge legend
│  │  └─ index.ts            # component exports
│  └─ IPDetails.tsx          # existing IP details
├─ lib/
│  ├─ api/                   # NEW: API integration
│  │  └─ story-protocol.ts   # Story Protocol client
│  ├─ hooks/                 # NEW: custom hooks
│  │  ├─ useDerivativeData.ts
│  │  └─ useGraphFilters.ts
│  └─ utils/                 # NEW: utilities
│     └─ graph-transform.ts
├─ types/                    # existing type definitions
│  └─ graph.ts              # NEW: graph types
└─ styles/                   # existing styles
   └─ graph.css             # NEW: graph styles
```

---

## 3. Implementation Steps

### Phase 1: Setup & Integration

1. Add dependencies and configure build
2. Create Story Protocol API client
3. Define graph-related types
4. Set up React Query hooks for data fetching

### Phase 2: Core Components

1. Implement `DerivativeGraph` component
   - Force-directed graph setup
   - Node/edge rendering
   - Basic interactivity
2. Create `GraphControls` component
   - Zoom controls
   - Filter interface
   - Search functionality
3. Add `GraphLegend` component
   - Node type indicators
   - Edge relationship types
   - Color coding system

### Phase 3: Data & State Management

1. Implement data transformation utilities
   - Convert API data to graph format
   - Handle relationship mapping
2. Set up Zustand store
   - Filter state
   - View preferences
   - Search state
3. Add loading and error states
   - Skeleton loading state
   - Error boundaries
   - Retry mechanisms

### Phase 4: UI/UX Enhancement

1. Add responsive layout support
   - Mobile-first design
   - Touch interactions
   - Viewport adaptations
2. Implement advanced features
   - Node details on hover/click
   - Path highlighting
   - Animation transitions
3. Add accessibility features
   - Keyboard navigation
   - Screen reader support
   - ARIA attributes

### Phase 5: Testing & Optimization

1. Unit tests
   - Data transformation
   - Component logic
   - Hook behavior
2. Integration tests
   - Component interactions
   - Data flow
   - State management
3. E2E tests
   - User journeys
   - Navigation flows
   - Error scenarios
4. Performance optimization
   - Lazy loading
   - Memoization
   - Bundle optimization

---

## 4. Testing Requirements

### Performance Metrics

- API hook response: ≤ 1s (mock) / ≤ 3s (prod)
- Graph rendering: ≥ 60 FPS on iPhone 12
- Node click navigation: 100% success rate (Playwright)
- Filter debounce: 150ms, zero frame drops
- Lighthouse performance: ≥ 90 on /ip/[id]/graph

### Test Coverage

- Unit tests: ≥ 80% coverage
- Integration tests: All main user flows
- E2E tests: Critical user journeys

---

## 5. Implementation Guidelines

### Code Quality

1. Run type checking and linting before commits:

   ```bash
   pnpm type-check && pnpm lint
   ```

2. Ensure tests pass before moving to next phase:
   ```bash
   pnpm test
   ```

### Best Practices

- Follow existing component patterns in codebase
- Use TypeScript strict mode
- Implement proper error boundaries
- Add comprehensive logging
- Document complex algorithms
- Use React.memo for expensive renders
- Implement proper loading states
- Add accessibility features (ARIA labels, keyboard navigation)

### Error Handling

1. Implement retry logic for API calls
2. Add fallback UI for failed states
3. Log errors to monitoring service
4. Show user-friendly error messages

If any phase fails, halt implementation and create a PR for human review.

---

## 6. Additional Considerations

### Performance Optimizations

- Use Web Workers for heavy computations
- Implement virtual scrolling for large datasets
- Lazy load non-critical components
- Optimize bundle size with dynamic imports
- Use React Suspense boundaries

### Accessibility

- Ensure keyboard navigation
- Add screen reader support
- Maintain proper contrast ratios
- Provide alternative text representations
- Follow WAI-ARIA graph patterns

### Mobile Support

- Implement touch gestures
- Optimize for different screen sizes
- Add mobile-specific UI adjustments
- Test on various devices
- Handle offline states
