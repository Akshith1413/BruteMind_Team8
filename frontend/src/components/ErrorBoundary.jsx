/**
 * ErrorBoundary.jsx — Cortex OS Error Boundary
 * Catches render errors and displays a cyberpunk crash screen instead of a white screen.
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Cortex OS Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.root}>
          <div style={styles.card}>
            <AlertTriangle size={48} style={styles.icon} />
            <h1 style={styles.title}>CRITICAL SYSTEM FAILURE</h1>
            <p style={styles.subtitle}>A fatal error occurred in the Cortex OS UI thread.</p>
            
            <div style={styles.codeWrap}>
              <pre style={styles.code}>
                {this.state.error && this.state.error.toString()}
                {'\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
            
            <button style={styles.btn} onClick={() => window.location.reload()}>
              <RefreshCcw size={14} /> REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  root: {
    height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#05070a', color: '#ef4444', fontFamily: '"Share Tech Mono", monospace',
    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)'
  },
  card: {
    background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px', padding: '40px', maxWidth: '600px', width: '90%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    boxShadow: '0 0 30px rgba(239, 68, 68, 0.1)'
  },
  icon: { marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.5))' },
  title: { fontSize: '24px', letterSpacing: '2px', margin: '0 0 8px 0', textShadow: '0 0 10px rgba(239,68,68,0.5)' },
  subtitle: { fontSize: '12px', color: '#9ca3af', marginBottom: '24px' },
  codeWrap: {
    width: '100%', background: '#000', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px', padding: '16px', overflowX: 'auto', textAlign: 'left',
    marginBottom: '24px'
  },
  code: { margin: 0, fontSize: '11px', color: '#ef4444', lineHeight: 1.5, opacity: 0.8 },
  btn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444',
    color: '#ef4444', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '12px', letterSpacing: '1px',
    transition: 'all 0.2s', textTransform: 'uppercase'
  }
};
