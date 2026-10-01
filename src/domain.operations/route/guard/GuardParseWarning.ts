/**
 * .what = a structured advisory about a top-level guard key the parser DROPPED
 * .why = the parser stays permissive (F4), so this advisory is the whole fail-safe for a
 *   dropped key (case=4). the domain layer raises a typed flag; `formatGuardParseWarnings`
 *   owns the prose and emits it on the route's own `{ emit: { stdout } }`
 *
 * .note = mirrors the extant producer/renderer split of `GuardUpgradeWarning`
 *   (`getBudgetClobberWarnings`)
 */
export type GuardParseWarning =
  /**
   * case=4 [t4]-[t6] — a declared ALIAS of a known key. its value is dropped, never carried:
   * a key that still functions is a key nobody renames
   */
  | {
      type: 'key-alias';
      key: string;
      canonical: string;
      value: string;
      guard: string;
      line: number;
    }
  /**
   * case=4 [t8] — an unknown key one or two edits from a known one. a typo is detectable
   */
  | {
      type: 'key-near-miss';
      key: string;
      nearest: string;
      guard: string;
      line: number;
    }
  /**
   * case=4 — a KNOWN key declared with no value (`brain:`, `brain:   `, `brain: "  "`), which
   * would otherwise run byte-identical to a stone that never declared a brain
   */
  | {
      type: 'key-empty';
      key: string;
      guard: string;
      line: number;
    }
  /**
   * a KNOWN key whose value is not a literal (`brain: 'opus`, `brain: opus$(cat .brain)`), so
   * it is refused rather than dispatched
   *
   * .note = distinct from `key-empty`, whose prose says "NO value" — false here. same split
   *   `asReviewPeerBrain` draws between `undeclared` and `unreadable`: a driver acts on the cause
   */
  | {
      type: 'key-unreadable';
      key: string;
      value: string;
      guard: string;
      line: number;
    };
