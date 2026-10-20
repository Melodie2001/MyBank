import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main role="alert" style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Unable to display this page</h1>
          <p>Please reload the page. Your saved data will remain available.</p>
          <button onClick={() => window.location.reload()}>Reload page</button>
        </main>
      );
    }
    return this.props.children;
  }
}
