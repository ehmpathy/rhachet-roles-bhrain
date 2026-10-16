import { asGuardMalfunctionReasonLines } from './asGuardMalfunctionReasonLines';

/**
 * .what = the class of a broken part's cause — the one fact that picks its remedy
 * .why = a timeout clears with a re-arrive, a bad glob with a guard edit, an absent
 *        credential only with a human grant. the class is read off the cause text, so the
 *        halt can name ONE remedy per part rather than a menu of every remedy
 */
export type GuardMalfunctionCauseKind =
  | 'transient'
  | 'glob'
  | 'unreadable'
  | 'credential'
  | 'unknown';

/**
 * .what = one broken part of a guard — a review lane or a judge — with its cause, classified
 */
export interface GuardMalfunctionPart {
  kind: 'review' | 'judge';
  /** the label a driver reads: `lane mechanic (r3)` or `judge j1` */
  label: string;
  /**
   * the lane's slug, which `--as absorbed --that <slug>` names — null for a judge, which
   * writes no given and so owes no answer
   */
  slug: string | null;
  cause: string;
  causeKind: GuardMalfunctionCauseKind;
}

// the cause classes, checked in order: a grant outranks a glob, a glob outranks a re-run
const CAUSE_PATTERNS: Array<{
  kind: Exclude<GuardMalfunctionCauseKind, 'unknown'>;
  pattern: RegExp;
}> = [
  {
    kind: 'credential',
    pattern:
      /credential|api[ _-]?key|unauthori[sz]ed|forbidden|\b40[13]\b|keyrack|permission denied|EACCES/i,
  },
  {
    kind: 'glob',
    pattern: /glob|matched no|no (files|targets) matched|--paths/i,
  },
  {
    kind: 'unreadable',
    pattern: /unreadable|could not (parse|read)|no numeric count|parse/i,
  },
  {
    kind: 'transient',
    pattern:
      /timed? ?out|timeout|ETIMEDOUT|ECONNRESET|EPIPE|socket|terminated|rate.?limit|\b429\b|\b5\d\d\b|overloaded|network|fetch failed|aborted/i,
  },
];

/**
 * .what = classifies a cause line into the class that picks its remedy
 */
export const asGuardMalfunctionCauseKind = (input: {
  cause: string;
}): GuardMalfunctionCauseKind =>
  CAUSE_PATTERNS.find((entry) => entry.pattern.test(input.cause))?.kind ??
  'unknown';

/**
 * .what = the broken parts a persisted malfunction reason names, each with its classified cause
 * .why = the reason is the one record every halt surface reads; this is the one reader that
 *        turns its lane lines (`r3 mechanic: <cause>`, `j1: <cause>`) into rows a halt renders
 *
 * .note = a line in neither shape (a mixed halt's exhaustion clause, a record that predates
 *         the lanes) is skipped — it names no broken part
 */
export const asGuardMalfunctionParts = (input: {
  reason: string | null;
}): GuardMalfunctionPart[] => {
  const lines = asGuardMalfunctionReasonLines({ reason: input.reason });
  if (!lines) return [];
  return lines.lanes.flatMap((line): GuardMalfunctionPart[] => {
    // a review lane: `r3 mechanic: <cause>`
    const review = /^r(\d+) (\S+): (.+)$/.exec(line);
    if (review) {
      const cause = review[3]!.trim();
      return [
        {
          kind: 'review',
          label: `lane ${review[2]} (r${review[1]})`,
          slug: review[2]!,
          cause,
          causeKind: asGuardMalfunctionCauseKind({ cause }),
        },
      ];
    }

    // a judge: `j1: <cause>`
    const judge = /^j(\d+): (.+)$/.exec(line);
    if (judge) {
      const cause = judge[2]!.trim();
      return [
        {
          kind: 'judge',
          label: `judge j${judge[1]}`,
          slug: null,
          cause,
          causeKind: asGuardMalfunctionCauseKind({ cause }),
        },
      ];
    }

    // naught else names a broken part
    return [];
  });
};
