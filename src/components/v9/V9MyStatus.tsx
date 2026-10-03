import type { AlphaEvent, AlphaSignup } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";

// 我的狀態: small badges only. Every value is read from the identity / roster
// the shared hooks already resolved; 排位 is the row's place in the API order.

const STATUS_BADGE: Record<CurrentIdentity["status"], { label: string; tone: string }> = {
  confirmed: { label: "正取", tone: "is-green" },
  waiting: { label: "備取", tone: "is-orange" },
  leave: { label: "已請假", tone: "is-red" },
  unregistered: { label: "尚未報名", tone: "is-muted" },
};

function rankLabel(identity: CurrentIdentity, confirmed: AlphaSignup[], waiting: AlphaSignup[]) {
  if (identity.status === "confirmed") {
    const index = confirmed.findIndex((person) => person.id === identity.signupId);
    return index >= 0 ? `正取第 ${index + 1} 位` : "";
  }
  if (identity.status === "waiting") {
    const index = waiting.findIndex((person) => person.id === identity.signupId);
    return index >= 0 ? `備取第 ${index + 1} 位` : "";
  }
  return "";
}

export function V9MyStatus({
  authLoading,
  signedIn,
  profileComplete,
  identity,
  event,
  confirmed,
  waiting,
  v8Path,
  onLogin,
}: {
  authLoading: boolean;
  signedIn: boolean;
  profileComplete: boolean;
  identity: CurrentIdentity | null;
  event: AlphaEvent;
  confirmed: AlphaSignup[];
  waiting: AlphaSignup[];
  v8Path: string;
  onLogin: () => void;
}) {
  if (authLoading) {
    return (
      <section className="v9-card" aria-label="我的狀態">
        <h2 className="v9-card-title">我的狀態</h2>
        <p className="v9-muted">確認 LINE 登入中…</p>
      </section>
    );
  }

  if (!signedIn) {
    return (
      <section className="v9-card" aria-label="我的狀態">
        <h2 className="v9-card-title">我的狀態</h2>
        <p className="v9-muted">使用 LINE 登入後即可報名、請假與查看帳單。</p>
        <button type="button" className="v9-btn is-green" onClick={onLogin}>
          LINE 登入
        </button>
      </section>
    );
  }

  if (!profileComplete || !identity) {
    return (
      <section className="v9-card" aria-label="我的狀態">
        <h2 className="v9-card-title">我的狀態</h2>
        <p className="v9-muted">請先在 V8 完成身份確認（季打／臨打），再回到 V9 使用。</p>
        <a className="v9-btn" href={v8Path}>
          前往 V8 確認身份
        </a>
      </section>
    );
  }

  const status = STATUS_BADGE[identity.status];
  const rank = rankLabel(identity, confirmed, waiting);
  // 季打 pays through the season fee; 臨打 sees this meetup's fee as listed.
  const fee =
    identity.signupType === "fixed"
      ? "季費"
      : typeof event.tempFee === "number"
        ? `$${event.tempFee}`
        : "—";

  return (
    <section className="v9-card v9-status" aria-label="我的狀態">
      <div className="v9-status-head">
        <h2 className="v9-card-title">我的狀態</h2>
        <span className="v9-status-name">{identity.name}</span>
      </div>
      <div className="v9-badges">
        <span className={`v9-badge ${identity.signupType === "fixed" ? "is-blue" : "is-paper"}`}>
          {identity.signupType === "fixed" ? "季打" : "臨打"}
        </span>
        <span key={identity.status} className={`v9-badge v9-pop ${status.tone}`}>
          {status.label}
        </span>
        {rank && <span className="v9-badge">{rank}</span>}
        <span className="v9-badge is-paper">本次費用 {fee}</span>
      </div>
    </section>
  );
}
