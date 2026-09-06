const mongoose = require('mongoose');
const boardController = require('../../src/controllers/boardController');
const Board = require('../../src/models/Board');

// Mock Board model
jest.mock('../../src/models/Board');

describe('Board Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getOrCreateBoard', () => {
    test('should return existing board', async () => {
      const mockBoard = {
        boardId: 'test-board-1',
        content: 'Test content',
        elements: [],
        lastEditedBy: 'Test User',
        updatedAt: new Date(),
      };

      Board.findOne.mockResolvedValue(mockBoard);

      mockRequest.params = { boardId: 'test-board-1' };

      await boardController.getOrCreateBoard(mockRequest, mockResponse);

      expect(Board.findOne).toHaveBeenCalledWith({ boardId: 'test-board-1' });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 'test-board-1',
          content: 'Test content',
        })
      );
    });

    test('should create and return new board if not found', async () => {
      const mockNewBoard = {
        boardId: 'new-board',
        content: '',
        elements: [],
        lastEditedBy: null,
        updatedAt: new Date(),
      };

      Board.findOne.mockResolvedValue(null);
      Board.create.mockResolvedValue(mockNewBoard);

      mockRequest.params = { boardId: 'new-board' };

      await boardController.getOrCreateBoard(mockRequest, mockResponse);

      expect(Board.findOne).toHaveBeenCalledWith({ boardId: 'new-board' });
      expect(Board.create).toHaveBeenCalledWith({
        boardId: 'new-board',
        content: '',
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ boardId: 'new-board' })
      );
    });

    test('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      Board.findOne.mockRejectedValue(error);

      mockRequest.params = { boardId: 'error-board' };

      await boardController.getOrCreateBoard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to load board',
      });
    });
  });

  describe('getAllBoards', () => {
    test('should return all boards', async () => {
      const mockBoards = [
        { boardId: 'board-1', createdAt: new Date(), updatedAt: new Date() },
        { boardId: 'board-2', createdAt: new Date(), updatedAt: new Date() },
      ];

      Board.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBoards),
      });

      await boardController.getAllBoards(mockRequest, mockResponse);

      expect(Board.find).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockBoards);
    });

    test('should handle database errors in getAllBoards', async () => {
      const error = new Error('Query failed');
      Board.find.mockImplementation(() => {
        throw error;
      });

      await boardController.getAllBoards(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to load boards',
      });
    });
  });

  describe('createBoard', () => {
    test('should create a new board with valid input', async () => {
      const mockNewBoard = {
        _id: '123',
        boardId: 'new-board',
        content: '',
        elements: [],
        createdAt: new Date(),
      };

      Board.findOne.mockResolvedValue(null);
      Board.create.mockResolvedValue(mockNewBoard);

      mockRequest.body = { boardId: 'new-board' };

      await boardController.createBoard(mockRequest, mockResponse);

      expect(Board.findOne).toHaveBeenCalledWith({ boardId: 'new-board' });
      expect(Board.create).toHaveBeenCalledWith({
        boardId: 'new-board',
        content: '',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ boardId: 'new-board' })
      );
    });

    test('should return 400 error if boardId is missing', async () => {
      mockRequest.body = { boardId: '' };

      await boardController.createBoard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Board name is required',
      });
    });

    test('should return 409 error if board already exists', async () => {
      const existingBoard = { boardId: 'existing-board' };
      Board.findOne.mockResolvedValue(existingBoard);

      mockRequest.body = { boardId: 'existing-board' };

      await boardController.createBoard(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Board already exists',
      });
    });
  });
});
