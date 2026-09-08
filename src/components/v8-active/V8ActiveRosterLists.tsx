import type { CSSProperties } from "react";
import type { V8ActiveRosterListsControls } from "./v8ActiveConfig";

export type V8ActiveRosterPerson = { id: string; name: string };

// Panel insets measured directly off dragon-triple-list-v1's own pixels
// (row-by-row contiguous-cream-run scan, same technique used for the
// tiger-scroll panel) -- three separate blank areas inside one wide image:
// a narrower panel on each side (季打請假 left / 備取名單 right) flanking
// a wider center panel (正取名單).
const PANEL_INSETS = {
  leave: { top: "54%", bottom: "27%", left: "8%", right: "72%" },
  confirmed: { top: "54%", bottom: "27%", left: "31%", right: "31%" },
  waiting: { top: "54%", bottom: "27%", left: "73%", right: "7%" },
} as const;

function RosterColumn({ people }: { people: V8ActiveRosterPerson[] }) {
  return (
    <ul className="v8-roster-column">
      {people.map((person) => (
        <li key={person.id}>{person.name}</li>
      ))}
    </ul>
  );
}

// A single-column list, used for the two narrower side panels.
function RosterPanel({ people, twoColumn }: { people: V8ActiveRosterPerson[]; twoColumn?: boolean }) {
  if (!people.length) {
    return <p className="v8-roster-empty">目前沒有人員</p>;
  }
  if (!twoColumn) {
    return (
      <div className="v8-roster-panel-scroll">
        <RosterColumn people={people} />
      </div>
    );
  }
  // 正取名單 (confirmed) is the widest panel and typically has the most
  // names, so it splits into two side-by-side columns for readability
  // (per the user's request) -- split roughly in half rather than
  // interleaving, so a name's row position stays stable as the roster
  // count changes.
  const mid = Math.ceil(people.length / 2);
  const left = people.slice(0, mid);
  const right = people.slice(mid);
  return (
    <div className="v8-roster-panel-scroll">
      <div className="v8-roster-two-col">
        <RosterColumn people={left} />
        <RosterColumn people={right} />
      </div>
    </div>
  );
}

// The three-panel roster frame (季打請假/正取名單/備取名單) -- the token
// card field's replacement. Panel titles are baked into the artwork itself;
// only the name lists inside each blank panel are live content. Positioned
// as one wrapper (show/x/y/scale/rotation, % of .v8-active's own box) below
// the hero canvas + identity content, not overlapping the sun/dragon.
export function V8ActiveRosterLists({
  frameSrc,
  confirmed,
  leave,
  waiting,
  controls,
}: {
  frameSrc: string;
  confirmed: V8ActiveRosterPerson[];
  leave: V8ActiveRosterPerson[];
  waiting: V8ActiveRosterPerson[];
  controls: V8ActiveRosterListsControls;
}) {
  if (!controls.show) return null;
  return (
    <div
      className="v8-roster-lists"
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${92 * controls.scale}%`,
          transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
          fontSize: controls.fontSize,
          lineHeight: controls.lineHeight,
          color: controls.textColor,
        } as CSSProperties
      }
    >
      <img src={frameSrc} alt="" aria-hidden="true" draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      <div className="v8-roster-panel" style={PANEL_INSETS.leave}>
        <RosterPanel people={leave} />
      </div>
      <div className="v8-roster-panel" style={PANEL_INSETS.confirmed}>
        <RosterPanel people={confirmed} twoColumn />
      </div>
      <div className="v8-roster-panel" style={PANEL_INSETS.waiting}>
        <RosterPanel people={waiting} />
      </div>
    </div>
  );
}
