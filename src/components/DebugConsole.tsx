import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
}

let logCache: LogEntry[] = [];
let logListeners: (() => void)[] = [];

// Override console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  originalLog(...args);
  const message = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  logCache.push({
    timestamp: new Date().toLocaleTimeString(),
    level: 'log',
    message,
  });
  if (logCache.length > 100) logCache.shift();
  // Batch listener calls with microtask to prevent render storms
  Promise.resolve().then(() => {
    logListeners.forEach(listener => listener());
  });
};

console.warn = (...args: any[]) => {
  originalWarn(...args);
  const message = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  logCache.push({
    timestamp: new Date().toLocaleTimeString(),
    level: 'warn',
    message,
  });
  if (logCache.length > 100) logCache.shift();
  // Batch listener calls with microtask to prevent render storms
  Promise.resolve().then(() => {
    logListeners.forEach(listener => listener());
  });
};

console.error = (...args: any[]) => {
  originalError(...args);
  const message = args.map(a => typeof a === 'string' ? a : String(a)).join(' ');
  logCache.push({
    timestamp: new Date().toLocaleTimeString(),
    level: 'error',
    message,
  });
  if (logCache.length > 100) logCache.shift();
  // Batch listener calls with microtask to prevent render storms
  Promise.resolve().then(() => {
    logListeners.forEach(listener => listener());
  });
};

export function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setUpdate] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = () => setUpdate(prev => prev + 1);
    logListeners.push(listener);
    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logCache]);

  if (!isOpen) {
    const errorCount = logCache.filter(e => e.level === 'error').length;
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 px-3 py-2 rounded text-sm border z-50 font-semibold ${
          errorCount > 0
            ? 'bg-red-900 border-red-600 hover:bg-red-800 text-red-100'
            : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-100'
        }`}
      >
        Debug Console ({errorCount} errors)
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-950 border-2 border-gray-700 rounded-lg p-4 w-96 h-96 overflow-hidden z-50 shadow-xl flex flex-col">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
        <h3 className="font-bold text-gray-100 text-sm">Debug Console ({logCache.length})</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 font-mono text-xs space-y-1">
        {logCache.length === 0 ? (
          <p className="text-gray-500">No logs yet</p>
        ) : (
          logCache.map((entry, idx) => (
            <div
              key={idx}
              className={`${
                entry.level === 'error' ? 'text-red-400 bg-red-950/30' :
                entry.level === 'warn' ? 'text-yellow-400 bg-yellow-950/30' :
                entry.level === 'info' ? 'text-blue-400 bg-blue-950/30' :
                'text-green-400'
              } p-1 rounded`}
            >
              <span className="text-gray-500 mr-2">[{entry.timestamp}]</span>
              {entry.message}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <button
        onClick={() => {
          logCache = [];
          setUpdate(prev => prev + 1);
        }}
        className="mt-2 w-full bg-gray-800 hover:bg-gray-700 text-gray-200 py-1 rounded text-xs"
      >
        Clear Logs
      </button>
    </div>
  );
}
