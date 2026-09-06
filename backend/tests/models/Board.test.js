const mongoose = require("mongoose");
const Board = require("../../src/models/Board");

// Mock MongoDB connection for testing
beforeAll(async () => {
  // Use an in-memory MongoDB instance or test database
  // For this example, we'll test the schema validation
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Board Model", () => {
  describe("Schema Validation", () => {
    test("should create a board with required fields", () => {
      const boardData = {
        boardId: "test-board-1",
        content: "Test content",
        elements: [],
        lastEditedBy: "Test User",
      };

      const board = new Board(boardData);
      expect(board.boardId).toBe("test-board-1");
      expect(board.content).toBe("Test content");
      expect(Array.isArray(board.elements)).toBe(true);
      expect(board.lastEditedBy).toBe("Test User");
    });

    test("should have timestamps (createdAt, updatedAt)", () => {
      const board = new Board({
        boardId: "test-board-2",
        content: "Test",
      });

      expect(board).toHaveProperty("createdAt");
      expect(board).toHaveProperty("updatedAt");
    });

    test("should validate boardId is required", () => {
      const board = new Board({
        content: "Test",
      });

      const error = board.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.boardId).toBeDefined();
    });

    test("should set default values", () => {
      const board = new Board({
        boardId: "test-board-3",
      });

      expect(board.content).toBe("");
      expect(Array.isArray(board.elements)).toBe(true);
      expect(board.elements.length).toBe(0);
    });
  });

  describe("Elements Validation", () => {
    test("should accept elements with all properties", () => {
      const board = new Board({
        boardId: "test-board-4",
        elements: [
          {
            id: "elem-1",
            type: "textbox",
            shapeType: "rectangle",
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            content: "Sample text",
            createdBy: "User1",
            strokeColor: "#FF0000",
            fillColor: "#FFFFFF",
            fontSize: 14,
            textAlign: "left",
            verticalAlign: "top",
            formattedContent: "<b>Bold</b>",
            manuallyResized: false,
            rotation: 45,
          },
        ],
      });

      expect(board.elements.length).toBe(1);
      const element = board.elements[0];
      expect(element.id).toBe("elem-1");
      expect(element.type).toBe("textbox");
      expect(element.rotation).toBe(45);
    });

    test("should set default values for element properties", () => {
      const board = new Board({
        boardId: "test-board-5",
        elements: [
          {
            id: "elem-2",
            type: "shape",
            x: 0,
            y: 0,
          },
        ],
      });

      const element = board.elements[0];
      expect(element.strokeColor).toBe("#4F46E5");
      expect(element.fillColor).toBe("#FFFFFF");
      expect(element.fontSize).toBe(14);
      expect(element.textAlign).toBe("left");
      expect(element.verticalAlign).toBe("middle");
      expect(element.manuallyResized).toBe(false);
      expect(element.rotation).toBe(0);
    });
  });
});
