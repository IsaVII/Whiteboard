import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { socket } from "../services/socket";

export const useDebugPanel = (maxLogs = 50) => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const userName = useSelector((state) => state.user.name);
  const usersInRoom = useSelector((state) => state.user.usersInRoom);

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
      return newLogs.slice(-maxLogs);
    });
  };

  // Intercept native console logs
  useEffect(() => {
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

      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(logsText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (err) {
          console.warn("Modern clipboard API failed, trying fallback...", err);
        }
      }

      // Fallback method for legacy browsers / non-HTTPS
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

  return {
    state: {
      logs,
      isOpen,
      copied,
      userName,
      usersInRoom,
      isConnected: socket.connected,
    },
    actions: {
      setIsOpen,
      clearLogs,
      copyLogsToClipboard,
    },
    helpers: {
      getLogColor,
    },
  };
};
