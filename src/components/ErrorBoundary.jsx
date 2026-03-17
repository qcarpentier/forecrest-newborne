import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", padding: "var(--sp-8)", textAlign: "center",
      }}>
        <div style={{
          fontSize: 48, marginBottom: "var(--sp-4)", lineHeight: 1,
          color: "var(--color-error)",
        }}>!</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)", color: "var(--text-primary)" }}>
          {this.props.title || "Something went wrong"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-6)", maxWidth: 400 }}>
          {this.props.message || "An unexpected error occurred. Please reload the page."}
        </p>
        {this.state.error ? (
          <pre style={{
            fontSize: 11, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            color: "var(--color-error)", background: "var(--bg-accordion)",
            padding: "var(--sp-3) var(--sp-4)", borderRadius: "var(--r-md)",
            border: "1px solid var(--border)", maxWidth: 500, overflow: "auto",
            textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {String(this.state.error)}
          </pre>
        ) : null}
        <button
          onClick={function () { window.location.reload(); }}
          style={{
            marginTop: "var(--sp-6)", padding: "10px 24px", fontSize: 14, fontWeight: 600,
            borderRadius: "var(--r-md)", border: "none",
            background: "var(--brand)", color: "var(--color-on-brand)", cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
