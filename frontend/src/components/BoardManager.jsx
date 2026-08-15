import { useBoardManager } from "../redux/actions/useBoardManager.js";
import "./BoardManager.css";

const BoardManager = () => {
  const { state, actions } = useBoardManager();

  return (
    <div className="board-manager">
      {/* Create New Board Section */}
      <div className="board-manager-section">
        <input
          type="text"
          placeholder="Enter board name"
          value={state.boardName}
          onChange={(e) => actions.setBoardName(e.target.value)}
          onKeyPress={(e) =>
            e.key === "Enter" && actions.handleCreateNewBoard()
          }
          disabled={state.loading}
          className="board-manager-input"
        />
        <button
          onClick={actions.handleCreateNewBoard}
          disabled={state.loading}
          className="board-manager-btn new-board-btn"
        >
          {state.loading ? "Creating..." : "New Map"}
        </button>
      </div>

      {/* Save Board with New Name Section */}
      <div className="board-manager-section">
        {!state.renameMode ? (
          <button
            onClick={() => actions.setRenameMode(true)}
            disabled={state.loading}
            className="board-manager-btn rename-btn"
            title="Save current board under a new name"
          >
            ✓ Save As
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="New board name"
              value={state.newName}
              onChange={(e) => actions.setNewName(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && actions.handleSaveAsNewName()
              }
              disabled={state.loading}
              className="board-manager-input"
              autoFocus
            />
            <button
              onClick={actions.handleSaveAsNewName}
              disabled={state.loading}
              className="board-manager-btn confirm-btn"
            >
              {state.loading ? "Saving..." : "✓"}
            </button>
            <button
              onClick={() => {
                actions.setRenameMode(false);
                actions.setNewName(state.currentBoardName || "");
              }}
              disabled={state.loading}
              className="board-manager-btn cancel-btn"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Load Existing Board Section */}
      <div className="board-manager-section">
        <div className="dropdown-wrapper">
          <button
            onClick={() => actions.setShowDropdown(!state.showDropdown)}
            disabled={state.loading}
            className="board-manager-btn dropdown-btn"
          >
            {state.currentBoardName || "Select Board"} ▼
          </button>

          {state.showDropdown && (
            <div className="board-dropdown">
              {state.boards.length === 0 ? (
                <div className="dropdown-item disabled">No boards found</div>
              ) : (
                state.boards.map((board) => (
                  <div key={board._id} className="dropdown-item-wrapper">
                    <span className="dropdown-item-name">{board.boardId}</span>
                    <button
                      onClick={() => actions.handleLoadBoard(board.boardId)}
                      disabled={
                        state.loading || board.boardId === state.currentBoardId
                      }
                      className="dropdown-item-btn"
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardManager;
