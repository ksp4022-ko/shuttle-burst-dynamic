import { useEffect, useMemo, useState } from "react";
import { fetchV8AdminIdentities } from "@/lib/database-alpha";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { v9IdentityName } from "@/lib/v9-display";

// V9-021: the admin's read-only "view as". The picker lists everyone on the
// site with a LINE identity (季打 / 臨打, searchable); the bar across the top
// says whose page this is and ends the view. Nothing here writes.

type Person = V8LineIdentity & { lastLoginAt: string | null };

const nameOf = v9IdentityName;

export function V9ViewAsPicker({
  token,
  siteId,
  selfId,
  onPick,
}: {
  token: string;
  siteId: string;
  selfId: string;
  onPick: (person: V8LineIdentity) => void;
}) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchV8AdminIdentities(token, siteId)
      .then((result) => {
        if (!cancelled) setPeople(result.items || []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, token]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (people || [])
      .filter((person) => person.id !== selfId && person.profileComplete)
      .filter((person) => !q || nameOf(person).toLowerCase().includes(q));
    const fixed = list.filter(
      (person) => person.identityType === "fixed" && person.claimedMemberId,
    );
    const temp = list.filter(
      (person) => !(person.identityType === "fixed" && person.claimedMemberId),
    );
    return [
      { key: "fixed", label: "季打", items: fixed },
      { key: "temp", label: "臨打", items: temp },
    ];
  }, [people, query, selfId]);

  if (failed) return <p className="v9-muted">讀取成員失敗，請稍後再試。</p>;
  if (!people) return <p className="v9-muted">讀取成員中…</p>;

  return (
    <div className="v9-viewas">
      <input
        className="v9-viewas-search"
        type="search"
        placeholder="搜尋名字"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {groups.map((group) => (
        <section key={group.key} className="v9-viewas-group">
          <h3>
            {group.label} <small>{group.items.length}</small>
          </h3>
          {group.items.length ? (
            <ul>
              {group.items.map((person) => (
                <li key={person.id}>
                  <button type="button" onClick={() => onPick(person)}>
                    <span className="v9-avatar" aria-hidden="true">
                      {nameOf(person).slice(0, 1)}
                    </span>
                    <span className="v9-viewas-name">{nameOf(person)}</span>
                    <span className={`v9-badge ${group.key === "fixed" ? "is-blue" : "is-orange"}`}>
                      {group.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="v9-muted">沒有符合的人</p>
          )}
        </section>
      ))}
    </div>
  );
}

export function V9ViewAsBar({ name, onExit }: { name: string; onExit: () => void }) {
  return (
    <div className="v9-viewas-bar" role="status">
      <span aria-hidden="true">👁</span>
      <span className="v9-viewas-bar-text">
        檢視中：<strong>{name}</strong>（唯讀）
      </span>
      <button type="button" onClick={onExit}>
        結束檢視
      </button>
    </div>
  );
}
