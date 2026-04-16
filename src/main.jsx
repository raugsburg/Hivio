import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', background: '#060C15',
          color: '#f1f5f9', fontFamily: 'sans-serif', padding: '24px', textAlign: 'center'
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              background: '#1B6CA8', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
