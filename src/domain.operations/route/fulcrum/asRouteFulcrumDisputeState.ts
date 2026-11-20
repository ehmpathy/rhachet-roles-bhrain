import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';
import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumApprovedAfterDisputes } from './asFulcrumApprovedAfterDisputes';
import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumOwed } from './asFulcrumOwed';
import {
  asFulcrumRaisedOnStones,
  type FulcrumRaisedOn,
} from './asFulcrumRaisedOnStones';
import type { RouteFulcrum } from './getAllRouteFulcrums';
import { getOneFulcrumVerdictRowLatest } from './getOneFulcrumVerdictRowLatest';
import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';
import { isFulcrumVerdictReopened } from './isFulcrumVerdictReopened';

/**
 * .what = one readable fulcrum, as the gate presents it
 * .why = the halt, the judge, and the refusal each render this shape; the frontmatter plus what
 *        the file name and the passage log add to it
 */
export interface RouteFulcrumDisputeEntry {
  path: string;
  /**
   * the subject from the file name (`rename-table`), printed beside the case
   */
  title: string;
  /**
   * the stones whose disputes cite this fulcrum — where it was raised (vision case=4)
   */
  raisedOn: string[];
  /**
   * the first stone a human approved after the newest dispute that cites this fulcrum, or null.
   * a conceded verdict reads as answered once one follows (F6: the human holds approval until
   * the repair lands)
   */
  approvedOn: string | null;
  /**
   * true when a dispute row pinned `owed: human` but the entry's fields now derive `reflect` —
   * an edit after the dispute that would have routed it away from the human. the pin holds, and
   * the gate names the edit
   */
  owedEditedSinceDispute: boolean;
  /**
   * the key of each live dispute that cites this fulcrum (`asFulcrumDisputeKey`). a verdict row
   * proves its verdict only over these; the lever writes them as the row's `held`
   */
  disputes: string[];
  /**
   * the content hash a verdict row must carry to prove this entry (`asFulcrumContentSeen`)
   */
  seen: string;
  frontmatter: FulcrumFrontmatter;
}

/**
 * .what = the dispute state of a whole route, as a human gate must see it
 * .why = invariants 2 and 4: every open human-owed dispute, every unreadable entry, and every
 *        verdict no human lever wrote is a named line at the gate — derived here, from the
 *        fulcrum files, so the driver's prose can never hide one
 */
export interface RouteFulcrumDisputeState {
  /**
   * `owed: human`, live, and no proven verdict — each one refuses approval
   */
  owedHuman: RouteFulcrumDisputeEntry[];
  /**
   * a live entry with a proven verdict, human- or reflect-owed — shown under "ruled", never
   * refuses approval. a conceded one names the repair it owes until an approval answers it
   */
  ruled: RouteFulcrumDisputeEntry[];
  /**
   * `owed: reflect` with no proven verdict — shown apart, informational, never refuses approval.
   * a human may still rule one, which moves it to `ruled`
   */
  reflected: RouteFulcrumDisputeEntry[];
  /**
   * an entry whose name or frontmatter cannot be read — never skipped; it refuses approval
   */
  unreadable: { path: string; slug: string }[];
  /**
   * any live entry whose yaml verdict no ledger row ever proved — a hand edit. the linter holds
   * the stop on each; a human-owed one also stays owed
   */
  forged: RouteFulcrumDisputeEntry[];
  /**
   * any live entry whose verdict the lever DID write, outlived since — edited, so the row no
   * longer matches what the entry says, or cited by a dispute the human never saw. it owes the
   * human again, and the gate says which; it is no forgery
   */
  reopened: (RouteFulcrumDisputeEntry & { by: 'edit' | 'dispute' })[];
}

/**
 * .what = sorts a route's fulcrums by what the human gate owes each one
 * .why = the one classification behind the approval refusal, the halt lines, the last-stone check,
 *        and the linter — pure, so every caller that read the same files reads the same state
 */
export const asRouteFulcrumDisputeState = (input: {
  fulcrums: RouteFulcrum[];
  rows: FulcrumVerdictRow[];
  reports: PassageReport[];
}): RouteFulcrumDisputeState => {
  const raisedOn = asFulcrumRaisedOnStones({ reports: input.reports });
  const live = asAllFulcrumDisputeEntriesLive({
    fulcrums: input.fulcrums,
    raisedOn,
    approvedOn: asFulcrumApprovedAfterDisputes({
      reports: input.reports,
      afterOf: asFulcrumVerdictAfterOfCases({ rows: input.rows }),
    }),
  });
  const isProven = (entry: RouteFulcrumDisputeEntry): boolean =>
    isFulcrumDisputeEntryVerdict({ entry, rows: input.rows, is: 'proven' });
  const isReopened = (entry: RouteFulcrumDisputeEntry): boolean =>
    isFulcrumDisputeEntryVerdict({ entry, rows: input.rows, is: 'reopened' });
  const unproven = live.filter((entry) => !isProven(entry));
  return {
    owedHuman: unproven.filter((entry) => entry.frontmatter.owed === 'human'),
    ruled: live.filter(
      (entry) => entry.frontmatter.owed !== 'none' && isProven(entry),
    ),
    reflected: unproven.filter((entry) => entry.frontmatter.owed === 'reflect'),
    unreadable: [
      ...asAllFulcrumsUnreadable({ fulcrums: input.fulcrums }),
      ...asAllFulcrumDisputesOrphaned({ fulcrums: input.fulcrums, raisedOn }),
    ],
    forged: unproven.filter(
      (entry) => entry.frontmatter.verdict !== null && !isReopened(entry),
    ),
    reopened: unproven.filter(isReopened).map((entry) => ({
      ...entry,
      by: asFulcrumReopenedBy({ entry, rows: input.rows }),
    })),
  };
};

/**
 * .what = what outlived a reopened entry's verdict: an edit, or a dispute the human never saw
 * .why = the gate names the cause, so a human reads why a ruled entry asks for them again
 */
const asFulcrumReopenedBy = (input: {
  entry: RouteFulcrumDisputeEntry;
  rows: FulcrumVerdictRow[];
}): 'edit' | 'dispute' =>
  getOneFulcrumVerdictRowLatest({
    case: input.entry.frontmatter.case,
    rows: input.rows,
  })?.seen === input.entry.seen
    ? 'dispute'
    : 'edit';

/**
 * .what = each case's passage-log index at its newest verdict, as its ledger row recorded it
 * .why = an approval given before a verdict never answers it; the newest row speaks for the case
 */
const asFulcrumVerdictAfterOfCases = (input: {
  rows: FulcrumVerdictRow[];
}): Map<string, number> =>
  new Map(input.rows.map((row) => [row.case, row.after]));

/**
 * .what = each fulcrum whose name or frontmatter cannot be read, as its path and slug
 * .why = an unreadable entry is named at the gate, never skipped
 */
const asAllFulcrumsUnreadable = (input: {
  fulcrums: RouteFulcrum[];
}): { path: string; slug: string }[] =>
  input.fulcrums.flatMap((fulcrum) =>
    fulcrum.parse.kind === 'valid'
      ? []
      : [{ path: fulcrum.path, slug: fulcrum.slug }],
  );

/**
 * .what = each case a live dispute cites with no fulcrum file on the route, as the path it cited
 * .why = a deleted or renamed entry must not orphan its dispute; the gate names the absent file,
 *        so the dispute still refuses approval until the file is restored
 */
const asAllFulcrumDisputesOrphaned = (input: {
  fulcrums: RouteFulcrum[];
  raisedOn: Map<string, FulcrumRaisedOn>;
}): { path: string; slug: string }[] => {
  const cases = new Set(input.fulcrums.map((fulcrum) => fulcrum.slug));
  return [...input.raisedOn.entries()].flatMap(([slug, cited]) =>
    cases.has(slug) ? [] : [{ path: cited.path, slug }],
  );
};

/**
 * .what = each readable fulcrum that holds a debt, as the entry the gate presents
 * .why = a superseded entry holds no debt — unless a live dispute still cites it. the passage log,
 *        not the typed `status`, decides that a dispute was taken back (a `rewound` row)
 */
const asAllFulcrumDisputeEntriesLive = (input: {
  fulcrums: RouteFulcrum[];
  raisedOn: Map<string, FulcrumRaisedOn>;
  approvedOn: Map<string, string | null>;
}): RouteFulcrumDisputeEntry[] =>
  input.fulcrums.flatMap((fulcrum) => {
    if (fulcrum.parse.kind !== 'valid') return [];
    const cited = input.raisedOn.get(fulcrum.slug) ?? null;
    const raisedOn = cited?.stones ?? [];
    const isSuperseded = fulcrum.parse.frontmatter.status === 'superseded';
    if (isSuperseded && !raisedOn.length) return [];
    const owedDerived = asFulcrumOwed(fulcrum.parse.frontmatter);
    return [
      {
        path: fulcrum.path,
        title: fulcrum.title,
        raisedOn,
        approvedOn: input.approvedOn.get(fulcrum.slug) ?? null,
        owedEditedSinceDispute:
          cited?.owedPinned === 'human' && owedDerived !== 'human',
        disputes: cited?.disputes ?? [],
        seen: fulcrum.parse.seen,
        frontmatter: asFulcrumFrontmatterOwedAsDisputed({
          frontmatter: fulcrum.parse.frontmatter,
          cited,
          owedDerived,
        }),
      },
    ];
  });

/**
 * .what = an entry's frontmatter with `owed` read as the gate routes it, once a dispute cites it
 * .why = `owed` is derived from ground × confidence, and the dispute path refuses a typed value
 *        that disagrees. but that check runs once, at the dispute, and the driver can edit the
 *        fields after. so for an entry a dispute cites, the gate reads the derive, never the
 *        typed value — and where the dispute row pinned `human`, the pin holds over any later
 *        derive. an edit can neither hide a dispute nor route it away from the human. an entry
 *        no dispute cites is a design call, and its typed `owed` stands
 */
const asFulcrumFrontmatterOwedAsDisputed = (input: {
  frontmatter: FulcrumFrontmatter;
  cited: FulcrumRaisedOn | null;
  owedDerived: 'human' | 'reflect';
}): FulcrumFrontmatter => {
  if (!input.cited?.stones.length) return input.frontmatter;
  const owed = input.cited.owedPinned === 'human' ? 'human' : input.owedDerived;
  return { ...input.frontmatter, owed };
};

/**
 * .what = decides whether an entry's yaml verdict is proven by the ledger on its current content,
 *         or was proven once and then outlived by an edit
 * .why = an entry with no verdict is neither; only a proven verdict lifts a dispute, and a
 *        reopened one reads apart from a forged one
 */
const isFulcrumDisputeEntryVerdict = (input: {
  entry: RouteFulcrumDisputeEntry;
  rows: FulcrumVerdictRow[];
  is: 'proven' | 'reopened';
}): boolean => {
  const verdict = input.entry.frontmatter.verdict;
  if (!verdict) return false;
  const check = {
    case: input.entry.frontmatter.case,
    ruled: verdict.ruled,
    seen: input.entry.seen,
    disputes: input.entry.disputes,
    rows: input.rows,
  };
  return input.is === 'proven'
    ? isFulcrumVerdictProven(check)
    : isFulcrumVerdictReopened(check);
};
