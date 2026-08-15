import { socket } from "../redux/services/socket";
import { useDebugPanel } from "../redux/actions/useDebugPanel.js";

export default function DebugPanel() {
  const { state, actions, helpers } = useDebugPanel();

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => actions.setIsOpen(!state.isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-blue-700"
        title="Toggle Debug Panel"
      >
        🐛 DEBUG
      </button>

      {/* Debug Panel */}
      {state.isOpen && (
        <div className="fixed bottom-16 right-4 w-80 max-h-96 bg-white border-2 border-gray-300 rounded-lg shadow-2xl flex flex-col z-[9999] pointer-events-auto">
          {/* Header */}
          <div className="bg-gray-900 text-white p-2 rounded-t-md flex justify-between items-center gap-2">
            <span className="font-bold text-xs">DEBUG CONSOLE</span>
            <div className="flex gap-1">
              <button
                onClick={actions.copyLogsToClipboard}
                className={`text-xs px-2 py-1 rounded font-semibold transition-all ${
                  state.copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title="Copy all logs"
              >
                {state.copied ? "✅ Copied!" : "📋 Copy"}
              </button>
              <button
                onClick={actions.clearLogs}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white font-semibold"
                title="Clear all logs"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-gray-100 p-2 border-b text-xs space-y-1">
            <div>
              <span className="font-bold">Socket:</span>{" "}
              {state.isConnected ? (
                <span className="text-green-600">✅ Connected</span>
              ) : (
                <span className="text-red-600">❌ Disconnected</span>
              )}
            </div>
            <div>
              <span className="font-bold">You:</span>{" "}
              {state.userName || "Loading..."}
            </div>
            <div>
              <span className="font-bold">Users in room:</span>{" "}
              {state.usersInRoom.length}
              {state.usersInRoom.length > 0 && (
                <div className="ml-2 text-xs">
                  {state.usersInRoom.map((u) => (
                    <div key={u.name}>• {u.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logs Container */}
          <div className="flex-1 overflow-y-auto p-2 bg-black text-xs font-mono space-y-1">
            {state.logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              state.logs.map((log) => (
                <div
                  key={log.id}
                  className={`${helpers.getLogColor(log.type)} text-xs break-words`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  {log.message}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-2 border-t text-xs text-gray-600">
            Total logs: {state.logs.length}
          </div>
        </div>
      )}
    </>
  );
}
