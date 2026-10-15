import { Component } from "react";
import { BASE_URL } from "../utils/baseUrl.js";

// A lazy-loaded page can fail to download (network drop, or a new version was
// deployed and the old file no longer exists). Retrying in place cannot fix that,
// so for these errors the button reloads the page instead.
const isChunkError = (err) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically imported module/i.test(
    String(err?.message || err)
  );

// Catches unexpected errors thrown while rendering its children
// and shows a friendly page instead of a blank screen.
class ErrorBoundary extends Component {
  state = { hasError: false, chunk: false };

  static getDerivedStateFromError(error) {
    return { hasError: true, chunk: isChunkError(error) };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { chunk } = this.state;

    return (
      <div className="max-w-sm mx-auto p-6 text-center" role="alert">
        <h2 className="font-bold text-xl mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 text-sm mb-4">
          {chunk
            ? "This page could not be loaded. Check your connection and reload."
            : "An unexpected error occurred. Please try again, or go back to the home page."}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => (chunk ? window.location.reload() : this.setState({ hasError: false }))}
            className="bg-indigo-600 text-white rounded px-4 py-2 text-sm"
          >
            {chunk ? "Reload page" : "Try again"}
          </button>
          <button
            onClick={() => window.location.assign(BASE_URL)}
            className="border rounded px-4 py-2 text-sm"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
