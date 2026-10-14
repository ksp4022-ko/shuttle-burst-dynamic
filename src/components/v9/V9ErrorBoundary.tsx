import { Component, type ErrorInfo, type ReactNode } from "react";

// Catches a render/effect crash inside V9 so it doesn't fall through to the
// root "This page didn't load" page. `fallback` gets the error; with no
// fallback the subtree just disappears (e.g. the intro), after onError.
export class V9ErrorBoundary extends Component<
  {
    children: ReactNode;
    onError?: (error: Error) => void;
    fallback?: (error: Error) => ReactNode;
  },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("V9 crash", error, info.componentStack);
    this.props.onError?.(error);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return this.props.fallback ? this.props.fallback(error) : null;
  }
}

// /v9test only: what crashed, so a phone screenshot is enough to debug it.
export function V9CrashNotice({ error }: { error: Error }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "#fbf6ec",
        color: "#1f1a17",
        fontFamily: '"Noto Sans TC", system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 8px" }}>畫面出錯了</h1>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>請截圖這個畫面給管理員，然後重新整理。</p>
        <pre
          style={{
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 11,
            background: "#fff",
            border: "2px solid #1f1a17",
            borderRadius: 12,
            padding: 10,
            margin: "0 0 12px",
            maxHeight: "45dvh",
            overflow: "auto",
          }}
        >
          {`${error.name}: ${error.message}\n${(error.stack || "").split("\n").slice(0, 6).join("\n")}`}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 22px",
            border: "3px solid #1f1a17",
            borderRadius: 999,
            background: "#4cb782",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          重新整理
        </button>
      </div>
    </div>
  );
}
