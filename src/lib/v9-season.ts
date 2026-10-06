// 季打確認 display helpers for V9 (labels and dates only, no rules). Same
// formatting as V8's season confirm page.

type SeasonRef = { id: string; name: string } | null | undefined;

const CN_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function seasonParts(season: SeasonRef) {
  if (!season) return null;
  const fromId = season.id.match(/(\d{4})_S0*(\d+)$/i);
  if (fromId) return { year: fromId[1], no: Number(fromId[2]) };
  const fromName = season.name.match(/(\d{4}).*?第?\s*(\d+)\s*季/);
  if (fromName) return { year: fromName[1], no: Number(fromName[2]) };
  return null;
}

// "2026 S4"
export function v9SeasonShort(season: SeasonRef) {
  const parts = seasonParts(season);
  return parts ? `${parts.year} S${parts.no}` : season?.name || "";
}

// "第四季"
export function v9SeasonNo(season: SeasonRef) {
  const parts = seasonParts(season);
  return parts && parts.no < 10 ? `第${CN_DIGITS[parts.no]}季` : "新賽季";
}

// "S3" (the season being renewed from)
export function v9SeasonSource(season: SeasonRef) {
  const parts = seasonParts(season);
  return parts ? `S${parts.no}` : season?.name || "上一季";
}

// "10/15（三）23:59" in Taipei time.
export function v9Deadline(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekday = get("weekday").replace("週", "").replace("星期", "");
  return `${get("month")}/${get("day")}（${weekday}）${get("hour")}:${get("minute")}`;
}

// Season start/end: the API's dates, else the quarter named in "2026 第4季".
export function v9SeasonRange(season?: {
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  let start = season?.startDate || "";
  let end = season?.endDate || "";
  const match = season?.name?.match(/(\d{4}).*?第?\s*([1-4])\s*季/);
  if (match && (!start || !end)) {
    const year = Number(match[1]);
    const quarter = Number(match[2]);
    const pad = (value: number) => String(value).padStart(2, "0");
    const endDay = new Date(Date.UTC(year, quarter * 3, 0)).getUTCDate();
    start ||= `${year}-${pad((quarter - 1) * 3 + 1)}-01`;
    end ||= `${year}-${pad(quarter * 3)}-${pad(endDay)}`;
  }
  const full = (value: string) => {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}/${m[2]}/${m[3]}` : "";
  };
  const monthDay = (value: string) => {
    const m = value.match(/^\d{4}-(\d{2})-(\d{2})/);
    return m ? `${Number(m[1])}/${Number(m[2])}` : "";
  };
  return { start: full(start), end: full(end), firstDay: monthDay(start) };
}

export function v9Money(value?: number | null) {
  return typeof value === "number" && value > 0 ? `$${value.toLocaleString("zh-TW")}` : null;
}
