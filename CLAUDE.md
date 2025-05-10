# CLAUDE.md

## Project Overview

IP Discovery is a platform for browsing and searching intellectual property assets registered on the Story Protocol blockchain. The platform displays detailed information about each IP asset, including creators, licenses, royalties, and media content.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **API Integration**: Story Protocol API

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Core Data Types

- **IPAsset**: Represents an intellectual property asset with metadata like title, description, creators, and media URLs
- **License**: Represents license terms that can be applied to IP assets
- **Royalty**: Represents royalty payments associated with IP assets

### API Integration

The application integrates with the Story Protocol API to fetch data:

- Uses a `getBaseUrl()` utility to ensure consistent API endpoint usage
- Implements server-side API routes in the `app/api` directory for data fetching and caching
- Handles transformation of IPFS URLs to standard HTTP URLs

### Features

1. **IP Asset Browsing**: View a curated list of featured IP assets
2. **IP Asset Details**: View comprehensive details about an IP asset, including:
   - Media content (images, audio, video)
   - Creator information
   - License options
   - Royalty payment history

## Project Structure

- `app/`: Next.js app router pages and API routes
  - `api/`: Backend API endpoints that proxy to Story Protocol API
  - `ip/[ipId]/`: IP asset detail pages
- `components/`: React components for UI elements
- `lib/`: Utility functions and API clients
- `types/`: TypeScript type definitions
- `data/`: Static data (like featured IP IDs)

## Upcoming Feature: Derivative Galaxy Graph

The project includes plans to implement an interactive "Derivative Galaxy" graph visualization for IP asset relationships (see `ip-graph-instructions.md`). This feature will:

1. Display ancestor-derivative relationships between IP assets
2. Use a force-directed graph visualization (react-force-graph-2d)
3. Implement zoom, filter, and search functionality
4. Include responsive design for desktop and mobile
5. Be thoroughly tested for performance and accessibility

## Best Practices

1. Use TypeScript for all new code
2. Follow existing component patterns and styling approaches
3. Use TanStack Query for data fetching and caching
4. Implement proper loading states and error handling
5. Optimize for mobile and desktop viewport sizes
6. Ensure accessibility compliance with proper ARIA attributes

## Coding Guidelines for Claude Outputs

Ensure Claude's generated code adheres to the following conventions:

### General

- Use TypeScript for all files (.tsx for components, .ts for utilities).
- Follow Next.js App Router conventions (e.g., page.tsx, layout.tsx).
- Use path aliases (@/\*) for imports from src.
- Export components and utilities as named exports unless specified otherwise.
- Write Server Components by default; mark Client Components with "use client".

### Components

- File Naming: PascalCase (e.g., IPCard.tsx).
- Structure: Co-locate styles and logic; export as named exports.
- Styling: Use Tailwind CSS with custom theme (reference tailwind.config.js).
- Accessibility: Use Radix UI primitives for interactive components; ensure ARIA attributes.
- Animation: Use Framer Motion for transitions and gestures.
- Props: Define with TypeScript interfaces in types/ or within the component file.

### API Routes

- Location: app/api/ (e.g., app/api/ip/route.ts).
- Structure: Use Next.js Route Handlers (GET, POST, etc.).
- Data Fetching: Use TanStack Query for caching; Axios for HTTP requests.

### Web3

- Use Viem for Ethereum interactions (e.g., contract calls).

### Utilities

- File Naming: camelCase (e.g., fetchIPData.ts).
- Location: lib/ for shared utilities.
- Type Safety: Use TypeScript types/interfaces in types/.
- Reusability: Write modular, pure functions where possible.

### Styling

- Use Tailwind CSS utility classes; avoid inline CSS.
- Reference custom theme (e.g., bg-primary, text-secondary).
- Ensure responsive design with Tailwind's responsive utilities (e.g., sm:, md:).
- Use clsx and class-variance-authority for dynamic classNames.

### Performance

- Leverage Server Components for static content.
- Use dynamic imports for heavy Client Components.
- Optimize images via Next.js <Image> component.
- Cache API responses with TanStack Query.

### Code Quality

- Run npm lint to check ESLint rules.
- Run npm format to apply Prettier formatting.
- Ensure no TypeScript errors with npm tsc --noEmit.

### Animation

- Use Framer Motion for transitions and gestures.
- Props: Define with TypeScript interfaces in types/ or within the component file.

### Testing

- Unit tests for data transformation logic
- Integration tests for component interaction
- E2E tests for critical user flows
- Performance testing (targeting 60 FPS on mobile devices)

# Story Protocol Integration Guidelines

## API Documentation

The Story Protocol API is accessible at `https://api.storyapis.com`. For detailed API documentation, refer to:
[Story Protocol API Documentation](https://docs.story.foundation/api-reference/protocol/introduction)

### API Configuration

```http
Headers:
X-CHAIN: story | story-aeneid  # story = mainnet, story-aeneid = testnet
X-API-KEY: MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U
```

### Rate Limits

- Default public API key: 300 requests/second
- For higher limits: Join Builder Discord and describe project needs

### Key Endpoints

The API provides endpoints for:

- IPAssets (List, Get, Metadata)
- IP Edges (Relationships)
- Collections
- Licenses & License Terms
- Disputes
- IP Groups
- Royalties
- Transactions

### Implementation Notes

When implementing Story Protocol integration:

1. Use appropriate network header (mainnet/testnet)
2. Handle rate limiting appropriately
3. Implement proper error handling
4. Cache responses where appropriate
5. Follow API best practices for performance

### Development Guidelines

1. Always check API response status
2. Implement retry logic for failed requests
3. Use TypeScript interfaces for API responses
4. Document any custom API utilities
5. Add comprehensive error handling

## For the Derivative Galaxy Graph

When implementing the graph visualization:

1. Use the List IP Edges endpoint for relationship data
2. Cache relationship data appropriately
3. Implement real-time updates if needed
4. Handle pagination for large datasets
5. Consider rate limits in data fetching strategy

### Example Usage

```typescript
// Example API client setup
const storyClient = {
  baseURL: "https://api.storyapis.com",
  headers: {
    "X-CHAIN": process.env.NEXT_PUBLIC_STORY_NETWORK || "story-aeneid",
    "X-API-KEY": process.env.NEXT_PUBLIC_STORY_API_KEY,
  },
}

// Example error handling
const handleAPIError = (error: any) => {
  if (error.response) {
    // Handle rate limiting
    if (error.response.status === 429) {
      // Implement retry logic
    }
    // Handle other API errors
  }
  throw error
}
```

## Resources

- [Story Protocol Documentation](https://docs.story.foundation/api-reference/protocol/introduction)
- Builder Discord for API key requests
- Blockscout API for additional blockchain data
