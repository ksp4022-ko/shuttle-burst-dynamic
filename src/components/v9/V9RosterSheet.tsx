import type { AlphaSignup } from "@/lib/database-alpha";

// 名單 sheet body: 正取 / 備取 / 請假 tabs. Lists arrive already sorted by
// the shared flow (API orderNo), so # is just the row position.

export type V9RosterTab = "confirmed" | "waiting" | "leave";

const TAB_KEYS: V9RosterTab[] = ["confirmed", "waiting", "leave"];
const TABS: Record<V9RosterTab, { label: string; tone: string }> = {
  confirmed: { label: "正取", tone: "is-green" },
  waiting: { label: "備取", tone: "is-orange" },
  leave: { label: "請假", tone: "is-red" },
};

export function V9RosterContent({
  tab,
  onTab,
  confirmed,
  waiting,
  leave,
  mySignupId,
  displayName,
}: {
  tab: V9RosterTab;
  onTab: (tab: V9RosterTab) => void;
  confirmed: AlphaSignup[];
  waiting: AlphaSignup[];
  leave: AlphaSignup[];
  mySignupId: string;
  displayName: (person: AlphaSignup) => string;
}) {
  const lists: Record<V9RosterTab, AlphaSignup[]> = { confirmed, waiting, leave };
  const active = TABS[tab];
  const people = lists[tab];

  return (
    <div className="v9-roster">
      <div className="v9-tabs" role="tablist" aria-label="名單分類">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            id={`v9-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={key === tab}
            aria-controls="v9-roster-panel"
            className={`v9-tab ${TABS[key].tone}${key === tab ? " is-active" : ""}`}
            onClick={() => onTab(key)}
          >
            {TABS[key].label} <span className="v9-tab-count">{lists[key].length}</span>
          </button>
        ))}
      </div>

      <div
        key={tab}
        id="v9-roster-panel"
        role="tabpanel"
        aria-labelledby={`v9-tab-${tab}`}
        className="v9-roster-panel"
      >
        {people.length === 0 ? (
          <p className="v9-muted v9-roster-empty">目前沒有{active.label}名單</p>
        ) : (
          <ol className="v9-roster-list">
            {people.map((person, index) => (
              <li
                key={person.id}
                className={`v9-roster-row${person.id === mySignupId ? " is-me" : ""}`}
              >
                <span className={`v9-roster-no ${active.tone}`}>{index + 1}</span>
                <span className="v9-roster-name">
                  {displayName(person)}
                  {person.id === mySignupId && <span className="v9-me-tag">我</span>}
                </span>
                <span
                  className={`v9-badge ${person.signupType === "fixed" ? "is-blue" : "is-paper"}`}
                >
                  {person.signupType === "fixed" ? "季打" : "臨打"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
