import React from 'react';
import { HiOutlineExclamationTriangle, HiOutlineArrowPath } from "react-icons/hi2";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-border-default rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto">
              <HiOutlineExclamationTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
              <p className="text-muted text-sm leading-relaxed">
                The application encountered an unexpected error. This has been logged and we're looking into it.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-elevated/50 rounded-xl border border-border-default text-left overflow-auto max-h-32">
                <code className="text-[10px] text-danger font-mono break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition flex items-center justify-center gap-2"
              >
                <HiOutlineArrowPath size={18} />
                Try Refreshing
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-surface border border-border-default text-primary rounded-xl font-semibold hover:bg-elevated transition"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-[10px] text-muted italic">
              If the problem persists, please contact the system administrator.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
