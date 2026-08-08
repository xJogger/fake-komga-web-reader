import { StrictMode, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#5c0000', color: 'white', height: '100vh', overflow: 'auto', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>致命错误 (Fatal Error)</h1>
          <p style={{ marginBottom: '20px' }}>请将此屏幕截图发送给开发者：</p>
          <div style={{ backgroundColor: '#330000', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <strong>Error:</strong> {this.state.error?.toString()}
            <br /><br />
            <strong>Component Stack:</strong>
            <br />
            {this.state.errorInfo?.componentStack}
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            清除缓存并重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
