import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { V8ActiveRosterPerson } from "./V8ActiveRosterLists";

// V8TEST (2026-10-03): the list panel's names, animated with Motion.
//  - Panel opens: names fade/rise in one after another (stagger).
//  - Roster changes while open: a new name fades in, a removed one fades
//    out, and everyone else glides to their new slot (layout animation).
//  - The same person moving between lists or columns (e.g. 告假: 正取 ->
//    季打請假) glides across via a shared layoutId.
// Same markup/classes as V8ListNames in V8ListBuoys.tsx, so the panel's CSS
// applies unchanged. Loaded lazily and only on /v8test.

type ListKey = "leave" | "main" | "wait";

const STAGGER_S = 0.035;
const MAX_STAGGER_S = 0.45;
// Only the panel-opening batch is staggered; later additions come in at once.
const OPEN_BATCH_MS = 500;
const GLIDE = { type: "spring", stiffness: 520, damping: 40 } as const;

export default function V8ListNamesMotion({
  listKey,
  people,
  ownSignupId,
}: {
  listKey: ListKey;
  people: V8ActiveRosterPerson[];
  ownSignupId: string | null;
}) {
  const reduce = useReducedMotion();
  const mountedAt = useRef(0);
  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  if (!people.length) {
    return <p className="v8-list-empty">{listKey === "wait" ? "目前沒有人候補" : "─"}</p>;
  }

  const delayFor = (index: number) => {
    const opening = mountedAt.current === 0 || performance.now() - mountedAt.current < OPEN_BATCH_MS;
    return opening ? Math.min(index * STAGGER_S, MAX_STAGGER_S) : 0;
  };

  const item = (person: V8ActiveRosterPerson, index: number, numbered: boolean, order: number) => (
    <motion.li
      key={person.id}
      {...(reduce ? {} : { layoutId: `v8-roster-${person.id}`, layout: "position" as const })}
      className={person.id === ownSignupId ? "is-self" : undefined}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut", delay: delayFor(order) } }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ layout: GLIDE }}
    >
      {numbered ? `${index + 1}. ${person.name}` : person.name}
    </motion.li>
  );

  const column = (list: V8ActiveRosterPerson[], numbered: boolean, offset: number) => (
    <ul className="v8-list-column" style={{ position: "relative" }}>
      <AnimatePresence mode="popLayout" initial>
        {list.map((person, index) => item(person, index + offset, numbered, index + offset))}
      </AnimatePresence>
    </ul>
  );

  if (listKey !== "main") return column(people, listKey === "wait", 0);
  // Same split as V8ListNames: first half left, rest right.
  const mid = Math.ceil(people.length / 2);
  return (
    <div className="v8-list-two-col">
      {column(people.slice(0, mid), false, 0)}
      {column(people.slice(mid), false, mid)}
    </div>
  );
}
