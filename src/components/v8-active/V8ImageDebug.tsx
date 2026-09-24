import { useEffect, useState } from "react";

// ?v8debug=1 -- on-page image timing for iPhone Safari (no Web Inspector on
// Windows). Lists every <img> on the page: loading / loaded / error, when it
// finished (ms since navigation start), whether img.decode() succeeded, how
// many automatic retries it took, and whether it currently has a visible box.
// Also marks when the hero canvas revealed (asset gate open) and when the
// Active page mounted. Debug only: never rendered without the query flag.

type Row = {
  src: string;
  state: "loading" | "loaded" | "error";
  loadedAt: number | null;
  decode: "pending" | "ok" | "failed" | "-";
  retries: number;
  visible: boolean;
};

const shortName = (src: string) => (src.split("/").pop() || src).replace(/\?.*$/, "").slice(0, 34);

export function V8ImageDebug() {
  const [rows, setRows] = useState<Row[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const loadedAt = new Map<string, number>();
    const decodeState = new Map<string, Row["decode"]>();
    const markTimes: Record<string, number> = {};

    // Resource timing gives the download end even for images that loaded
    // before this component mounted.
    const resourceEnd = (src: string) => {
      const entries = performance.getEntriesByName(new URL(src, location.href).href) as PerformanceResourceTiming[];
      const last = entries[entries.length - 1];
      return last ? Math.round(last.responseEnd) : null;
    };

    const onLoad = (event: Event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement) loadedAt.set(image.currentSrc || image.src, Math.round(performance.now()));
    };
    document.addEventListener("load", onLoad, true);

    const scan = () => {
      const next: Row[] = [];
      for (const image of Array.from(document.images)) {
        const src = image.currentSrc || image.src;
        if (!src) continue;
        const failed = image.complete && image.naturalWidth === 0;
        const state: Row["state"] = !image.complete ? "loading" : failed ? "error" : "loaded";
        if (state === "loaded" && !loadedAt.has(src)) loadedAt.set(src, resourceEnd(src) ?? Math.round(performance.now()));
        if (state === "loaded" && !decodeState.has(src)) {
          decodeState.set(src, "pending");
          image
            .decode()
            .then(() => decodeState.set(src, "ok"))
            .catch(() => decodeState.set(src, "failed"));
        }
        const rect = image.getBoundingClientRect();
        next.push({
          src,
          state,
          loadedAt: loadedAt.get(src) ?? null,
          decode: decodeState.get(src) ?? "-",
          retries: Number(image.dataset["v8Retry"] || 0),
          visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight,
        });
      }
      const stage = document.querySelector<HTMLElement>("[data-v8-hero-stage] > div");
      if (stage && stage.style.opacity === "1" && markTimes["canvas revealed"] === undefined) markTimes["canvas revealed"] = Math.round(performance.now());
      if (document.querySelector(".v8-active") && markTimes["active mounted"] === undefined) markTimes["active mounted"] = Math.round(performance.now());
      if (!document.querySelector(".v8-active")) delete markTimes["active mounted"];
      setRows(next);
      setMarks({ ...markTimes });
    };

    scan();
    const timer = window.setInterval(scan, 500);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("load", onLoad, true);
    };
  }, []);

  const count = (state: Row["state"]) => rows.filter((row) => row.state === state).length;
  const decodeFailed = rows.filter((row) => row.decode === "failed").length;
  const sorted = [...rows].sort((a, b) => {
    const rank = (row: Row) => (row.state === "error" ? 0 : row.state === "loading" ? 1 : row.decode === "failed" ? 2 : 3);
    return rank(a) - rank(b) || (b.loadedAt ?? 0) - (a.loadedAt ?? 0);
  });

  return (
    <div style={panelStyle}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={toggleStyle}>
        IMG {count("loaded")}/{rows.length} · 載入中 {count("loading")} · 失敗 {count("error")} · 解碼失敗 {decodeFailed} {open ? "▲" : "▼"}
      </button>
      {open ? (
        <div style={bodyStyle}>
          <div>
            {Object.entries(marks).map(([name, time]) => (
              <div key={name}>
                ◆ {name}: {time}ms
              </div>
            ))}
            <div>◆ now: {Math.round(performance.now())}ms</div>
          </div>
          {sorted.map((row) => (
            <div key={row.src} style={{ color: row.state === "error" ? "#ff8a80" : row.state === "loading" ? "#ffd54f" : row.decode === "failed" ? "#ff8a80" : "#e8e8e8" }}>
              {row.state === "loaded" ? "✓" : row.state === "loading" ? "…" : "✗"} {shortName(row.src)} {row.loadedAt !== null ? `${row.loadedAt}ms` : ""} dec:{row.decode}
              {row.retries ? ` r${row.retries}` : ""}
              {row.visible ? " 👁" : ""}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const panelStyle = {
  position: "fixed",
  top: 40,
  right: 4,
  zIndex: 2147483001,
  maxWidth: "78vw",
  font: "11px/1.35 ui-monospace, Menlo, monospace",
  color: "#e8e8e8",
} as const;

const toggleStyle = {
  display: "block",
  width: "100%",
  padding: "4px 6px",
  border: 0,
  borderRadius: 6,
  background: "rgba(20, 20, 20, 0.88)",
  color: "#fff",
  font: "inherit",
  textAlign: "left",
} as const;

const bodyStyle = {
  marginTop: 2,
  maxHeight: "60vh",
  overflowY: "auto",
  padding: "4px 6px",
  borderRadius: 6,
  background: "rgba(20, 20, 20, 0.82)",
} as const;
