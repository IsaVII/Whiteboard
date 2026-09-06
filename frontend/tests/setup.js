// Test setup file for frontend tests
import "@testing-library/jest-dom";

// Mock environment variables for tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock import.meta.env
Object.defineProperty(import.meta, "env", {
  value: {
    DEV: false,
    VITE_API_URL: "http://localhost:4000",
  },
});
