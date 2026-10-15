// V9-050: 加場規則 per 場地 (康軒 only; 日安 has none). Display only -- the
// courts themselves are still set by the admin per meetup.
export type V9CourtRule = { from: number; to: number; courts: string };

export const V9_COURT_RULES: Record<string, V9CourtRule[]> = {
  kangxuan: [
    { from: 16, to: 18, courts: "2面2Hr＋1面1Hr" },
    { from: 19, to: 21, courts: "3面2Hr" },
    { from: 22, to: 25, courts: "3面2Hr＋1面1Hr" },
    { from: 26, to: 29, courts: "4面2Hr" },
  ],
};
