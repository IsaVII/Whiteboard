import { configureStore } from '@reduxjs/toolkit';
import boardReducer, {
  boardChanged,
  toolTypeSelected,
  colorSelected,
  outlineToggled,
  elementsLoaded,
  elementAdded,
  elementUpdated,
  elementRemoved,
  connectionStatusChanged,
} from '../../../src/redux/slices/boardSlice';

describe('Board Slice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        board: boardReducer,
      },
    });
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().board;
      expect(state.boardId).toBeNull();
      expect(state.boardName).toBeNull();
      expect(state.content).toBe('');
      expect(state.elements).toEqual([]);
      expect(state.selectedToolType).toBe('rectangle');
      expect(state.lastStrokeColor).toBe('#4F46E5');
      expect(state.lastFillColor).toBe('#FFFFFF');
      expect(state.status).toBe('idle');
      expect(state.connected).toBe(false);
    });
  });

  describe('boardChanged', () => {
    test('should update board ID and name', () => {
      store.dispatch(
        boardChanged({ boardId: 'test-board', boardName: 'Test Board' })
      );

      const state = store.getState().board;
      expect(state.boardId).toBe('test-board');
      expect(state.boardName).toBe('Test Board');
    });
  });

  describe('toolTypeSelected', () => {
    test('should update selected tool type', () => {
      store.dispatch(toolTypeSelected('circle'));

      const state = store.getState().board;
      expect(state.selectedToolType).toBe('circle');
    });

    test('should support different shape types', () => {
      const shapes = ['rectangle', 'circle', 'triangle', 'line'];

      shapes.forEach((shape) => {
        store.dispatch(toolTypeSelected(shape));
        expect(store.getState().board.selectedToolType).toBe(shape);
      });
    });
  });

  describe('colorSelected', () => {
    test('should update stroke color', () => {
      store.dispatch(
        colorSelected({ colorType: 'stroke', color: '#FF0000' })
      );

      const state = store.getState().board;
      expect(state.lastStrokeColor).toBe('#FF0000');
    });

    test('should update fill color', () => {
      store.dispatch(colorSelected({ colorType: 'fill', color: '#00FF00' }));

      const state = store.getState().board;
      expect(state.lastFillColor).toBe('#00FF00');
    });

    test('should update font color', () => {
      store.dispatch(colorSelected({ colorType: 'font', color: '#0000FF' }));

      const state = store.getState().board;
      expect(state.lastFontColor).toBe('#0000FF');
    });
  });

  describe('outlineToggled', () => {
    test('should toggle outline visibility', () => {
      const initialState = store.getState().board.lastShowStroke;

      store.dispatch(outlineToggled(!initialState));

      const newState = store.getState().board.lastShowStroke;
      expect(newState).toBe(!initialState);
    });

    test('should be able to toggle back to initial state', () => {
      const initialValue = store.getState().board.lastShowStroke;

      store.dispatch(outlineToggled(false));
      store.dispatch(outlineToggled(true));

      expect(store.getState().board.lastShowStroke).toBe(true);
    });
  });

  describe('elementsLoaded', () => {
    test('should load elements into state', () => {
      const elements = [
        { id: '1', type: 'textbox', x: 10, y: 10 },
        { id: '2', type: 'shape', x: 50, y: 50 },
      ];

      store.dispatch(elementsLoaded(elements));

      const state = store.getState().board;
      expect(state.elements).toEqual(elements);
      expect(state.elements.length).toBe(2);
    });

    test('should handle empty elements array', () => {
      store.dispatch(elementsLoaded([]));

      const state = store.getState().board;
      expect(state.elements).toEqual([]);
    });

    test('should handle null elements', () => {
      store.dispatch(elementsLoaded(null));

      const state = store.getState().board;
      expect(state.elements).toEqual([]);
    });
  });

  describe('elementAdded', () => {
    test('should add new element to state', () => {
      const element = { id: '1', type: 'textbox', x: 10, y: 10 };

      store.dispatch(elementAdded(element));

      const state = store.getState().board;
      expect(state.elements.length).toBe(1);
      expect(state.elements[0]).toEqual(element);
    });

    test('should prevent duplicate elements with same ID', () => {
      const element = { id: '1', type: 'textbox', x: 10, y: 10 };

      store.dispatch(elementAdded(element));
      store.dispatch(elementAdded(element));

      const state = store.getState().board;
      expect(state.elements.length).toBe(1);
    });

    test('should add multiple different elements', () => {
      const element1 = { id: '1', type: 'textbox', x: 10, y: 10 };
      const element2 = { id: '2', type: 'shape', x: 50, y: 50 };

      store.dispatch(elementAdded(element1));
      store.dispatch(elementAdded(element2));

      const state = store.getState().board;
      expect(state.elements.length).toBe(2);
    });
  });

  describe('elementUpdated', () => {
    test('should update existing element', () => {
      const element = { id: '1', type: 'textbox', x: 10, y: 10, content: 'Old' };
      store.dispatch(elementAdded(element));

      store.dispatch(elementUpdated({ elementId: '1', updates: { content: 'New' } }));

      const state = store.getState().board;
      expect(state.elements[0].content).toBe('New');
      expect(state.elements[0].x).toBe(10); // Other props remain unchanged
    });

    test('should not add element if it does not exist', () => {
      store.dispatch(elementUpdated({ elementId: 'nonexistent', updates: { content: 'New' } }));

      const state = store.getState().board;
      expect(state.elements.length).toBe(0);
    });

    test('should update multiple properties at once', () => {
      const element = { id: '1', type: 'textbox', x: 10, y: 10, width: 100, height: 50 };
      store.dispatch(elementAdded(element));

      store.dispatch(elementUpdated({
        elementId: '1',
        updates: { x: 20, y: 30, width: 200 },
      }));

      const state = store.getState().board;
      expect(state.elements[0].x).toBe(20);
      expect(state.elements[0].y).toBe(30);
      expect(state.elements[0].width).toBe(200);
      expect(state.elements[0].height).toBe(50);
    });
  });

  describe('elementRemoved', () => {
    test('should remove element by ID', () => {
      const element1 = { id: '1', type: 'textbox' };
      const element2 = { id: '2', type: 'shape' };

      store.dispatch(elementAdded(element1));
      store.dispatch(elementAdded(element2));
      store.dispatch(elementRemoved({ elementId: '1' }));

      const state = store.getState().board;
      expect(state.elements.length).toBe(1);
      expect(state.elements[0].id).toBe('2');
    });

    test('should not fail if removing nonexistent element', () => {
      const element = { id: '1', type: 'textbox' };
      store.dispatch(elementAdded(element));
      store.dispatch(elementRemoved({ elementId: 'nonexistent' }));

      const state = store.getState().board;
      expect(state.elements.length).toBe(1);
    });
  });

  describe('connectionStatusChanged', () => {
    test('should update connection status', () => {
      store.dispatch(connectionStatusChanged(true));

      let state = store.getState().board;
      expect(state.connected).toBe(true);

      store.dispatch(connectionStatusChanged(false));

      state = store.getState().board;
      expect(state.connected).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    test('should handle adding, updating, and removing elements in sequence', () => {
      const elem1 = { id: '1', type: 'textbox', content: 'Hello' };
      const elem2 = { id: '2', type: 'shape', x: 50 };

      store.dispatch(elementAdded(elem1));
      store.dispatch(elementAdded(elem2));

      let state = store.getState().board;
      expect(state.elements.length).toBe(2);

      store.dispatch(elementUpdated({ elementId: '1', updates: { content: 'Updated' } }));
      state = store.getState().board;
      expect(state.elements[0].content).toBe('Updated');

      store.dispatch(elementRemoved({ elementId: '1' }));
      state = store.getState().board;
      expect(state.elements.length).toBe(1);
      expect(state.elements[0].id).toBe('2');
    });
  });
});
