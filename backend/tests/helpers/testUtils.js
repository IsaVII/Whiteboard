/**
 * Backend Test Utilities
 */

/**
 * Create a mock request object
 */
export function createMockRequest(overrides = {}) {
  return {
    params: {},
    body: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    statusCode: 200,
  };
  return res;
}

/**
 * Create a mock board for testing
 */
export function createMockBoard(overrides = {}) {
  return {
    boardId: "test-board",
    content: "Test content",
    elements: [],
    lastEditedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/**
 * Create a mock element for testing
 */
export function createMockElement(overrides = {}) {
  return {
    id: `element-${Date.now()}`,
    type: "textbox",
    shapeType: "rectangle",
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    content: "Test",
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
 * Mock MongoDB connection
 */
export async function setupTestDatabase() {
  // In a real scenario, this would connect to a test database
  // For unit tests, we mock the models directly
}

/**
 * Cleanup test database
 */
export async function teardownTestDatabase() {
  // Close connections and cleanup
}

/**
 * Wait for async operations in tests
 */
export function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
