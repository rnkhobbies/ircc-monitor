import { useEffect, useState } from "react";
import type { QuestionBank } from "../../lib/citizenship_test";
import TestHub from "./TestHub";
import TestRunner from "./TestRunner";

type Phase = "loading" | "ready" | "error";

export default function TestApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testId, setTestId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("n");
    if (n != null) {
      const parsed = parseInt(n, 10);
      if (Number.isFinite(parsed) && parsed > 0) setTestId(parsed);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/citizenship_test.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: QuestionBank) => {
        if (cancelled) return;
        if (!d.questions?.length) throw new Error("empty bank");
        setBank(d);
        setPhase("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, []);

  if (phase === "loading") return <div className="test-loading">Loading questions…</div>;
  if (phase === "error" || !bank) {
    return <div className="test-error">Couldn't load the question bank. {error ?? ""}</div>;
  }

  if (testId != null) {
    return <TestRunner bank={bank} testId={testId} />;
  }
  return <TestHub bank={bank} />;
}
