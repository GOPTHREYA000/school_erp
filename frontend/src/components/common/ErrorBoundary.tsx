"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    // Future: send to monitoring service (Sentry, LogRocket, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="bg-white border border-rose-100 rounded-3xl p-12 max-w-lg w-full text-center shadow-xl shadow-rose-50">
            <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="text-rose-500" size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              An unexpected error occurred while rendering this page. 
              Your data is safe — try reloading the section.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-rose-600 overflow-auto max-h-32 font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
              >
                <RotateCcw size={14} /> Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
