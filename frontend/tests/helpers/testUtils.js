// Utility functions for testing

/**
 * Create a mock Redux store with default state
 */
export function createMockStore(initialState = {}) {
  return {
    getState: jest.fn(() => initialState),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  };
}

/**
 * Create a mock socket.io client
 */
export function createMockSocket() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  };
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn(() => Promise.resolve(data)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
  };
}

/**
 * Generate test board data
 */
export function generateTestBoard(overrides = {}) {
  return {
    boardId: "test-board-1",
    content: "Test content",
    elements: [],
    lastEditedBy: "Test User",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate test element data
 */
export function generateTestElement(overrides = {}) {
  return {
    id: `element-${Math.random().toString(36).substr(2, 9)}`,
    type: "textbox",
    shapeType: "rectangle",
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    content: "Test element",
    createdBy: "Test User",
    strokeColor: "#4F46E5",
    fillColor: "#FFFFFF",
    fontSize: 14,
    textAlign: "left",
    verticalAlign: "middle",
    formattedContent: "",
    manuallyResized: false,
    rotation: 0,
    ...overrides,
  };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
