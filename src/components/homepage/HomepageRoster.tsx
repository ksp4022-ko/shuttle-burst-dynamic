import type { AlphaRoster, AlphaSignup } from "@/lib/database-alpha";
import { personRole } from "@/hooks/use-homepage-flow";

type HomepageRosterProps = {
  roster: AlphaRoster | null;
  confirmed: AlphaSignup[];
  waiting: AlphaSignup[];
  lastChangedId: string;
  onRefresh: () => void;
  refreshing: boolean;
};

export function HomepageRoster({
  roster,
  confirmed,
  waiting,
  lastChangedId,
  onRefresh,
  refreshing,
}: HomepageRosterProps) {
  if (!roster) return null;
  const maxPeople = Number(roster.event.maxPeople || 0);

  return (
    <section className="sd-roster" id="sd-roster">
      <div className="sd-roster-title">
        <h2>報名名單</h2>
        <span>
          {confirmed.length} / {maxPeople}
        </span>
        <button aria-label="重整名單" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? "..." : "↻"}
        </button>
      </div>

      <RosterGroup people={confirmed} lastChangedId={lastChangedId} title="正取" />

      <div className="sd-waiting-title">候補</div>
      <RosterGroup people={waiting} lastChangedId={lastChangedId} title="候補" waiting />

      <div className="sd-waiting-title">季打請假</div>
      <RosterGroup people={roster.fixedLeave || []} lastChangedId={lastChangedId} title="請假" />

      <BackToHero />
    </section>
  );
}

function RosterGroup({
  people,
  lastChangedId,
  title,
  waiting = false,
}: {
  people: AlphaSignup[];
  lastChangedId: string;
  title: string;
  waiting?: boolean;
}) {
  if (!people.length) return <p className="sd-empty">{title}目前沒有人員</p>;

  return (
    <ol className={`sd-roster-list ${waiting ? "is-waiting" : ""}`}>
      {people.map((person, index) => (
        <li key={person.id} className={lastChangedId === person.id ? "is-changed" : ""}>
          <span className="sd-roster-no">{String(index + 1).padStart(2, "0")}</span>
          <strong>{person.name}</strong>
          <em className={person.signupType === "fixed" ? "is-season" : "is-casual"}>
            {personRole(person)}
          </em>
        </li>
      ))}
    </ol>
  );
}

function BackToHero() {
  return (
    <button
      className="sd-back-top"
      aria-label="回主畫面"
      onClick={() => {
        document.getElementById("sd-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      ↑
    </button>
  );
}
