// V9-050: 加場規則 per 場地 (康軒 only; 日安 has none). Display only -- the
// courts themselves are still set by the admin per meetup.
// V9-052: main / extra drive the 場地 cell's 加場 value (frontend only).
export type V9CourtBlock = { courts: number; hours: number };
export type V9CourtRule = {
  from: number;
  to: number;
  courts: string;
  main: V9CourtBlock;
  extra?: V9CourtBlock;
};

export const V9_COURT_RULES: Record<string, V9CourtRule[]> = {
  kangxuan: [
    {
      from: 16,
      to: 18,
      courts: "2面2Hr＋1面1Hr",
      main: { courts: 2, hours: 2 },
      extra: { courts: 1, hours: 1 },
    },
    { from: 19, to: 21, courts: "3面2Hr", main: { courts: 3, hours: 2 } },
    {
      from: 22,
      to: 25,
      courts: "3面2Hr＋1面1Hr",
      main: { courts: 3, hours: 2 },
      extra: { courts: 1, hours: 1 },
    },
    { from: 26, to: 29, courts: "4面2Hr", main: { courts: 4, hours: 2 } },
  ],
};

// The band for this 正取 count; past the last band the last one still holds.
export function v9CourtRuleFor(rules: V9CourtRule[] | undefined, confirmed: number) {
  const first = rules?.[0];
  const last = rules?.[rules.length - 1];
  if (!rules || !first || !last || confirmed < first.from) return null;
  return rules.find((rule) => confirmed >= rule.from && confirmed <= rule.to) ?? last;
}

export function v9CourtHours(rule: V9CourtRule) {
  return (
    rule.main.courts * rule.main.hours + (rule.extra ? rule.extra.courts * rule.extra.hours : 0)
  );
}
