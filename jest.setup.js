// Import jest-dom add-ons
import '@testing-library/jest-dom';

// Mock react-force-graph-2d which uses Canvas
jest.mock('react-force-graph-2d', () => ({
  __esModule: true,
  ForceGraph2D: jest.fn().mockImplementation(({ children, ...props }) => {
    return (
      <div data-testid="force-graph-2d" {...props}>
        {children}
      </div>
    );
  })
}));

// Mock canvas operations
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  setLineDash: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  rect: jest.fn(),
  quadraticCurveTo: jest.fn(),
  closePath: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 100 }),
  fillText: jest.fn(),
  createRadialGradient: jest.fn().mockReturnValue({
    addColorStop: jest.fn()
  }),
  createLinearGradient: jest.fn().mockReturnValue({
    addColorStop: jest.fn()
  }),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));

// Mock window.cancelAnimationFrame
global.cancelAnimationFrame = jest.fn();

// Mock window.scrollTo
global.scrollTo = jest.fn();

// Mock window.navigator
Object.defineProperty(window.navigator, 'userAgent', {
  value: 'test-user-agent',
  writable: true
});

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true
});

// Mock intersection observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
