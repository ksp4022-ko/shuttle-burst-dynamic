import { useState } from "react";
import type { AlphaSignup } from "@/lib/database-alpha";

// 名單 Tab: 正取 / 備取 / 請假. Lists arrive already sorted by the shared flow
// (API orderNo), so # is just the row position.

type TabKey = "confirmed" | "waiting" | "leave";

const TAB_KEYS: TabKey[] = ["confirmed", "waiting", "leave"];
const TABS: Record<TabKey, { label: string; tone: string }> = {
  confirmed: { label: "正取", tone: "is-green" },
  waiting: { label: "備取", tone: "is-orange" },
  leave: { label: "請假", tone: "is-red" },
};

export function V9Roster({
  confirmed,
  waiting,
  leave,
  mySignupId,
  displayName,
}: {
  confirmed: AlphaSignup[];
  waiting: AlphaSignup[];
  leave: AlphaSignup[];
  mySignupId: string;
  displayName: (person: AlphaSignup) => string;
}) {
  const [tab, setTab] = useState<TabKey>("confirmed");
  const lists: Record<TabKey, AlphaSignup[]> = { confirmed, waiting, leave };
  const active = TABS[tab];
  const people = lists[tab];

  return (
    <section className="v9-card v9-roster" aria-label="名單">
      <h2 className="v9-card-title">名單</h2>
      <div className="v9-tabs" role="tablist" aria-label="名單分類">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            id={`v9-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={key === tab}
            aria-controls="v9-roster-panel"
            className={`v9-tab${key === tab ? " is-active" : ""}`}
            onClick={() => setTab(key)}
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
          <table className="v9-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">名稱</th>
                <th scope="col">身分</th>
                <th scope="col">狀態</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, index) => (
                <tr key={person.id} className={person.id === mySignupId ? "is-me" : undefined}>
                  <td className="v9-col-no">{index + 1}</td>
                  <td className="v9-col-name">
                    {displayName(person)}
                    {person.id === mySignupId && <span className="v9-me-tag">我</span>}
                  </td>
                  <td className="v9-col-role">
                    <span
                      className={`v9-badge ${person.signupType === "fixed" ? "is-blue" : "is-paper"}`}
                    >
                      {person.signupType === "fixed" ? "季打" : "臨打"}
                    </span>
                  </td>
                  <td className="v9-col-status">
                    <span className={`v9-badge ${active.tone}`}>{active.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
