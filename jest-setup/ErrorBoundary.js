import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }
  render() {
    if (this.state.errorInfo) {
      // Error path
      return (
        <div title="error-boundary">
          {this.state.error && this.state.error.toString()}
        </div>
      );
    }
    return this.props.children;
  }
}
