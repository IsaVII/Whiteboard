import {
  fetchBoard,
  listBoards,
  createNewBoard,
  renameBoard,
  deleteBoard,
} from "../../src/redux/services/api";

// Mock fetch globally
global.fetch = vi.fn();

describe("API Service", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe("fetchBoard", () => {
    test("should fetch board data successfully", async () => {
      const mockBoard = {
        boardId: "test-board",
        content: "Test content",
        elements: [],
        lastEditedBy: "User1",
        updatedAt: new Date().toISOString(),
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockBoard),
      });

      const result = await fetchBoard("test-board");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/boards/test-board"),
      );
      expect(result).toEqual(mockBoard);
    });

    test("should throw error if fetch fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchBoard("nonexistent")).rejects.toThrow(
        "Failed to load board",
      );
    });
  });

  describe("listBoards", () => {
    test("should fetch all boards successfully", async () => {
      const mockBoards = [
        { boardId: "board-1", createdAt: new Date().toISOString() },
        { boardId: "board-2", createdAt: new Date().toISOString() },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockBoards),
      });

      const result = await listBoards();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/boards"),
      );
      expect(result).toEqual(mockBoards);
      expect(result.length).toBe(2);
    });

    test("should throw error if listing fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(listBoards()).rejects.toThrow("Failed to load boards");
    });
  });

  describe("createNewBoard", () => {
    test("should create new board successfully", async () => {
      const mockNewBoard = {
        _id: "123",
        boardId: "new-board",
        content: "",
        elements: [],
        createdAt: new Date().toISOString(),
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockNewBoard),
      });

      const result = await createNewBoard("new-board");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/boards"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(result).toEqual(mockNewBoard);
    });

    test("should throw error if creation fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      await expect(createNewBoard("existing-board")).rejects.toThrow(
        "Failed to create board",
      );
    });
  });

  describe("renameBoard", () => {
    test("should rename board successfully", async () => {
      const mockRenamedBoard = {
        boardId: "renamed-board",
        content: "Test content",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockRenamedBoard),
      });

      const result = await renameBoard("old-board", "renamed-board");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/boards/old-board"),
        expect.objectContaining({
          method: "PUT",
        }),
      );
      expect(result).toEqual(mockRenamedBoard);
    });

    test("should throw error if rename fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(renameBoard("nonexistent", "new-name")).rejects.toThrow(
        "Failed to rename board",
      );
    });
  });

  describe("deleteBoard", () => {
    test("should delete board successfully", async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await deleteBoard("board-to-delete");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/boards/board-to-delete"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    test("should throw error if deletion fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(deleteBoard("nonexistent")).rejects.toThrow(
        "Failed to delete board",
      );
    });
  });
});
