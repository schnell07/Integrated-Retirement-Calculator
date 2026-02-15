import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  showFullDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showFullDetails: false };
  }

  static getDerivedStateFromError(error: Error): Omit<State, 'showFullDetails'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ERROR CAUGHT BY BOUNDARY:');
    console.error('Error message:', error.toString());
    console.error('Stack trace:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showFullDetails } = this.state;
      const isStackOverflow = error?.message.includes('stack') || error?.message.includes('Maximum call');
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
          <div className="bg-red-900/40 border-2 border-red-600 rounded-lg p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={32} className="text-red-400 flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-red-300">Application Error</h1>
                {isStackOverflow && (
                  <p className="text-yellow-300 text-sm font-bold">⚠️ Infinite loop detected - clearing data may help</p>
                )}
              </div>
            </div>

            {/* Main Error Message */}
            <div className="bg-red-950/50 border border-red-700/50 rounded p-3 mb-4">
              <p className="font-mono text-sm text-red-300 break-words">
                {error?.message || 'Unknown error'}
              </p>
            </div>

            {/* Full Details Toggle */}
            <button
              onClick={() => this.setState(prev => ({ ...prev, showFullDetails: !prev.showFullDetails }))}
              className="text-sm text-red-300 hover:text-red-200 underline mb-3 cursor-pointer"
            >
              {showFullDetails ? '▼ Hide' : '▶ Show'} Full Error Details
            </button>

            {/* Full Details Section */}
            {showFullDetails && (
              <div className="bg-navy-900/80 border border-red-700/30 rounded p-4 mb-4 space-y-3 max-h-64 overflow-auto">
                {error?.stack && (
                  <div>
                    <p className="text-xs font-bold text-red-400 mb-2">Stack Trace:</p>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap break-words font-mono">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-bold text-red-400 mb-2">Component Stack:</p>
                    <pre className="text-xs text-yellow-300 whitespace-pre-wrap break-words font-mono">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all"
              >
                🔄 Reload Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  try {
                    const req = indexedDB.deleteDatabase('retirement_calculator');
                    req.onsuccess = () => window.location.reload();
                    req.onerror = () => window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }}
                className="w-full bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded transition-all"
              >
                🗑️ Clear Data & Reload
              </button>
            </div>

            {/* Debug Instructions */}
            <div className="bg-navy-900/50 border border-navy-700/50 rounded p-3">
              <p className="text-sm text-navy-300 mb-2">
                <strong>📸 Troubleshooting:</strong>
              </p>
              <ol className="text-xs text-navy-400 space-y-1 list-decimal list-inside">
                <li>Take a screenshot of the error above</li>
                <li>Open browser console: Press <code className="bg-navy-800 px-1 rounded">F12</code> → Console tab</li>
                <li>Share the error message and any red errors shown in console</li>
                <li>Try "Clear Data & Reload" if the problem persists</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
