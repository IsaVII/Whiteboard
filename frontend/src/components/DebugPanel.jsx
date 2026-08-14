import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { socket } from "../redux/services/socket";

export default function DebugPanel() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [maxLogs] = useState(50); // Keep only last 50 logs
  const [copied, setCopied] = useState(false);
  const connected = useSelector((state) => state.board.connected);
  const userName = useSelector((state) => state.user.name);
  const usersInRoom = useSelector((state) => state.user.usersInRoom);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      );
      addLog(`LOG: ${message.join(" ")}`, "log");
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      );
      addLog(`ERROR: ${message.join(" ")}`, "error");
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      );
      addLog(`WARN: ${message.join(" ")}`, "warn");
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (message, type = "log") => {
    setLogs((prevLogs) => {
      const newLogs = [
        ...prevLogs,
        {
          id: Date.now() + Math.random(),
          message,
          type,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
      // Keep only the last maxLogs entries
      return newLogs.slice(-maxLogs);
    });
  };

  // Track socket connection changes
  useEffect(() => {
    if (socket.connected) {
      addLog(`✅ Socket connected (ID: ${socket.id})`, "log");
    }
  }, [socket.connected]);

  const clearLogs = () => {
    console.log("Clearing logs...");
    setLogs([]);
  };

  const copyLogsToClipboard = async () => {
    console.log("Copy button clicked, logs count:", logs.length);
    try {
      if (logs.length === 0) {
        console.warn("No logs to copy");
        setCopied(false);
        return;
      }

      const logsText = logs
        .map((log) => `[${log.timestamp}] ${log.message}`)
        .join("\n");

      console.log("Attempting to copy text to clipboard...");

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(logsText);
          console.log("Successfully copied to clipboard using modern API!");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (err) {
          console.warn("Modern clipboard API failed, trying fallback...", err);
        }
      }

      // Fallback method for older browsers or insecure contexts
      console.log("Using fallback copy method...");
      const textArea = document.createElement("textarea");
      textArea.value = logsText;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          console.log("Successfully copied to clipboard using fallback!");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error("Copy command unsuccessful");
        }
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }

      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Copy error:", err.message);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      default:
        return "text-gray-700";
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-blue-700"
        title="Toggle Debug Panel"
      >
        🐛 DEBUG
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-80 max-h-96 bg-white border-2 border-gray-300 rounded-lg shadow-2xl flex flex-col z-[9999] pointer-events-auto">
          {/* Header */}
          <div className="bg-gray-900 text-white p-2 rounded-t-md flex justify-between items-center gap-2">
            <span className="font-bold text-xs">DEBUG CONSOLE</span>
            <div className="flex gap-1">
              <button
                onClick={copyLogsToClipboard}
                className={`text-xs px-2 py-1 rounded font-semibold transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title="Copy all logs"
              >
                {copied ? "✅ Copied!" : "📋 Copy"}
              </button>
              <button
                onClick={clearLogs}
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
              {socket.connected ? (
                <span className="text-green-600">✅ Connected</span>
              ) : (
                <span className="text-red-600">❌ Disconnected</span>
              )}
            </div>
            <div>
              <span className="font-bold">You:</span> {userName || "Loading..."}
            </div>
            <div>
              <span className="font-bold">Users in room:</span>{" "}
              {usersInRoom.length}
              {usersInRoom.length > 0 && (
                <div className="ml-2 text-xs">
                  {usersInRoom.map((u) => (
                    <div key={u.name}>• {u.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-2 bg-black text-xs font-mono space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`${getLogColor(log.type)} text-xs break-words`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  {log.message}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-100 p-2 border-t text-xs text-gray-600">
            Total logs: {logs.length}
          </div>
        </div>
      )}
    </>
  );
}
