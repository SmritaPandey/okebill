import React, { Component, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorId: string;
    copied: boolean;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

function generateErrorId(): string {
    return 'ERR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorId: '', copied: false };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error, errorId: generateErrorId() };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error with ID for support tracing
        console.error(`[${this.state.errorId}] Application error:`, error, errorInfo);

        // Optional: Send to error tracking service (Sentry, LogRocket, etc.)
        // if (typeof window !== 'undefined' && (window as any).Sentry) {
        //   (window as any).Sentry.captureException(error, { extra: { errorId: this.state.errorId, componentStack: errorInfo.componentStack } });
        // }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorId: '', copied: false });
        window.location.href = '/dashboard';
    };

    handleCopyError = () => {
        const errorText = `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack?.slice(0, 500)}`;
        navigator.clipboard.writeText(errorText).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
                    <div className="text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-slate-600 mb-2">
                            An unexpected error occurred. Your data is safe — try refreshing the page.
                        </p>

                        {/* Error ID for support */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 mb-6">
                            <span className="text-xs font-mono text-slate-500">Error ID: {this.state.errorId}</span>
                            <button onClick={this.handleCopyError} className="text-slate-400 hover:text-slate-600 transition-colors">
                                {this.state.copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Error message (collapsible) */}
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 rounded-lg bg-slate-100 text-xs text-red-600 overflow-x-auto max-h-40 font-mono">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="gap-2 bg-[#1E3A5F] hover:bg-[#16304d]"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={this.handleReset}
                                className="gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </div>

                        <p className="text-xs text-slate-400 mt-6">
                            If this keeps happening, email{' '}
                            <a href={`mailto:support@okebill.com?subject=Error ${this.state.errorId}`} className="text-emerald-600 underline">
                                support@okebill.com
                            </a>{' '}
                            with the error ID above.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
