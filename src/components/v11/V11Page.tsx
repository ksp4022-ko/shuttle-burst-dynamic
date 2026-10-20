import { useEffect, useState } from "react";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { configuredSiteId } from "@/lib/database-alpha";
import { v9IdentityName } from "@/lib/v9-display";
import { isV11TestRoute } from "@/lib/v11-route";

// V11 (docs/V11_BASELINE.md): each meetup is a falling sticker and 墨糰 is
// the guide. Phase 1 is only the route shell: header, PREVIEW tag, site and
// LINE login, so routing and the login round trip can be checked on a
// phone. The stage arrives in phase 2.

// /v11test build label, bumped with each /v11test push.
export const V11_TEST_BUILD = "10/20-1";

const SITE_LABELS: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

export function V11Page() {
  const auth = useV8LineAuth();
  // Read on mount so the prerendered HTML and the first client render match.
  const [site, setSite] = useState("");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setSite(SITE_LABELS[configuredSiteId()] || "");
    setPreview(isV11TestRoute());
  }, []);

  return (
    <div className="v11-app">
      <V11Styles />
      <header className="v11-top">
        <div className="v11-brand">
          <span className="v11-word">OnCourt</span>
          {preview ? <span className="v11-preview">PREVIEW {V11_TEST_BUILD}</span> : null}
        </div>
        <div className="v11-top-r">
          {site ? <span className="v11-site">{site}</span> : null}
          {auth.identity ? (
            <span className="v11-acct">{v9IdentityName(auth.identity)}</span>
          ) : (
            <button
              type="button"
              className="v11-acct is-line"
              disabled={auth.loading}
              onClick={auth.startLogin}
            >
              {auth.loading ? "…" : "LINE 登入"}
            </button>
          )}
        </div>
      </header>
      <section className="v11-note">
        <h1>V11 建置中</h1>
        <p>第 1 階段：網址和 LINE 登入。聚會舞台和墨糰在第 2 階段接上。</p>
        <p>
          要報名請先到正式版 <a href="../../v9/">OnCourt</a>。
        </p>
      </section>
    </div>
  );
}

function V11Styles() {
  return <style>{V11_CSS}</style>;
}

const V11_CSS = `
.v11-app {
  --v11-orange: #ff5226; --v11-ink: #141414; --v11-cream: #fffdf7; --v11-green: #3be46a;
  min-height: 100dvh; background: var(--v11-orange); color: var(--v11-ink);
  font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  padding: calc(12px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px));
  display: grid; align-content: start; gap: 16px; max-width: 520px; margin: 0 auto;
}
.v11-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.v11-brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.v11-word { font-family: "Arial Black", system-ui, sans-serif; font-weight: 900; font-size: 26px; line-height: 1; letter-spacing: -.01em; }
.v11-preview { font-size: 10px; font-weight: 800; letter-spacing: .08em; background: var(--v11-ink); color: var(--v11-cream); border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
.v11-top-r { display: flex; align-items: center; gap: 8px; }
.v11-site { font-weight: 800; letter-spacing: .08em; }
.v11-acct { border: 2px solid var(--v11-ink); background: var(--v11-cream); color: var(--v11-ink); border-radius: 999px; padding: 5px 12px; font: inherit; font-weight: 700; font-size: 14px; box-shadow: 2px 3px 0 var(--v11-ink); white-space: nowrap; }
.v11-acct.is-line { background: var(--v11-green); cursor: pointer; }
.v11-note { background: var(--v11-cream); border: 2.5px solid var(--v11-ink); border-radius: 22px; padding: 16px 18px; box-shadow: 3px 4px 0 var(--v11-ink); display: grid; gap: 6px; }
.v11-note h1 { margin: 0; font-size: 20px; }
.v11-note p { margin: 0; line-height: 1.6; }
.v11-note a { color: var(--v11-ink); font-weight: 800; }
`;
