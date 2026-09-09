import type { CSSProperties } from "react";
import type { V8ActiveRosterListsControls } from "./v8ActiveConfig";

export type V8ActiveRosterPerson = { id: string; name: string };

// Panel insets measured directly off dragon-triple-list-v1's own pixels
// (row-by-row contiguous-cream-run scan, same technique used for the
// tiger-scroll panel) -- three separate blank areas inside one wide image:
// a narrower panel on each side (季打請假 left / 備取名單 right) flanking
// a wider center panel (正取名單).
//
// confirmed's top/bottom were re-measured 2026-09-09 (real canvas pixel
// scan of the production image, several x-columns across the panel's
// width) after the user reported the panel visibly cutting off names that
// should fit -- the ORIGINAL top:54%/bottom:27% had just been copied from
// leave/waiting (which measure correctly, ~54%/~73%), but confirmed is
// the widest panel and its actual blank cream rectangle in the artwork
// runs from ~46% to ~80% of the image height, not 54%-73%. Kept a couple
// points conservative (46%/75% instead of the full 44%-81% some columns
// scanned) since one sample column (~65% across, near the panel's right
// edge) showed a decorative element dipping into the blank area a little
// earlier than the rest -- this stays safely inside cream for the whole
// panel width instead of risking text under the right column overlapping
// artwork.
const PANEL_INSETS = {
  leave: { top: "54%", bottom: "27%", left: "8%", right: "72%" },
  confirmed: { top: "46%", bottom: "25%", left: "31%", right: "31%" },
  waiting: { top: "54%", bottom: "27%", left: "73%", right: "7%" },
} as const;

// numberOffset, when given, prefixes each name with its 1-based queue
// position (numberOffset + index) -- used for 備取名單 so a waitlisted
// person can tell their own place in line at a glance. Offset (not a
// flat index) so a two-column split could still number continuously
// across columns if this component were ever used that way, though
// currently only the single-column waiting list uses it.
function RosterColumn({ people, numberOffset }: { people: V8ActiveRosterPerson[]; numberOffset?: number | undefined }) {
  return (
    <ul className="v8-roster-column">
      {people.map((person, index) => (
        <li key={person.id}>{numberOffset !== undefined ? `${numberOffset + index}. ${person.name}` : person.name}</li>
      ))}
    </ul>
  );
}

// A single-column list, used for the two narrower side panels.
function RosterPanel({ people, twoColumn, numbered }: { people: V8ActiveRosterPerson[]; twoColumn?: boolean; numbered?: boolean }) {
  if (!people.length) {
    // Was "目前沒有人員" -- simplified per the user's request, an empty
    // list doesn't need a full sentence.
    return <p className="v8-roster-empty">─</p>;
  }
  if (!twoColumn) {
    return (
      <div className="v8-roster-panel-scroll">
        <RosterColumn people={people} numberOffset={numbered ? 1 : undefined} />
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
          ...(controls.fontFamily ? { fontFamily: controls.fontFamily } : {}),
          fontWeight: controls.bold ? 700 : 400,
        } as CSSProperties
      }
    >
      <img src={frameSrc} alt="" aria-hidden="true" draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      <div
        className="v8-roster-panel"
        style={{ ...PANEL_INSETS.leave, transform: `translate(${controls.leave.x}px, ${controls.leave.y}px)` }}
      >
        <RosterPanel people={leave} />
      </div>
      <div
        className="v8-roster-panel"
        style={{ ...PANEL_INSETS.confirmed, transform: `translate(${controls.confirmed.x}px, ${controls.confirmed.y}px)` }}
      >
        <RosterPanel people={confirmed} twoColumn />
      </div>
      <div
        className="v8-roster-panel"
        style={{ ...PANEL_INSETS.waiting, transform: `translate(${controls.waiting.x}px, ${controls.waiting.y}px)` }}
      >
        <RosterPanel people={waiting} numbered />
      </div>
    </div>
  );
}
