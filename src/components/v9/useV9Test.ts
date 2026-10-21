import { useEffect, useState } from "react";
import { isV9TestRoute } from "@/lib/v9-route";

// True on /v9test once mounted (false on the server and the first client
// render, so the HTML matches). New V9 features switch on with this until
// the user accepts them for /v9 (CLAUDE.md: /v9test first).
export function useV9Test() {
  const [test, setTest] = useState(false);
  useEffect(() => setTest(isV9TestRoute()), []);
  return test;
}
