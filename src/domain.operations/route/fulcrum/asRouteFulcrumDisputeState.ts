import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumOwed } from './asFulcrumOwed';
import { asFulcrumRaisedOnStones } from './asFulcrumRaisedOnStones';
import type { FulcrumVerdictRow } from './getAllFulcrumVerdictRows';
import type { RouteFulcrum } from './getAllRouteFulcrums';
import { isFulcrumVerdictProven } from './isFulcrumVerdictProven';

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
   * `owed: human`, not superseded, and no proven verdict — each one refuses approval
   */
  owedHuman: RouteFulcrumDisputeEntry[];
  /**
   * `owed: human` with a proven verdict — shown under "ruled", never refuses approval. a
   * conceded one names the repair it owes (vision case=2 [t3], case=4 [t1'])
   */
  ruled: RouteFulcrumDisputeEntry[];
  /**
   * `owed: reflect` — shown apart, informational, never refuses approval
   */
  reflected: RouteFulcrumDisputeEntry[];
  /**
   * an entry whose name or frontmatter cannot be read — never skipped; it refuses approval
   */
  unreadable: { path: string; slug: string }[];
  /**
   * any live entry whose yaml verdict the newest ledger row does not prove — a hand edit. the
   * linter holds the stop on each; a human-owed one also stays owed
   */
  forged: RouteFulcrumDisputeEntry[];
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
  });
  const humanOwed = live.filter((entry) => entry.frontmatter.owed === 'human');
  const isProven = (entry: RouteFulcrumDisputeEntry): boolean =>
    isFulcrumDisputeEntryProven({ entry, rows: input.rows });
  return {
    owedHuman: humanOwed.filter((entry) => !isProven(entry)),
    ruled: humanOwed.filter(isProven),
    reflected: live.filter((entry) => entry.frontmatter.owed === 'reflect'),
    unreadable: asAllFulcrumsUnreadable({ fulcrums: input.fulcrums }),
    forged: live.filter(
      (entry) => entry.frontmatter.verdict !== null && !isProven(entry),
    ),
  };
};

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
 * .what = each readable, not superseded fulcrum, as the entry the gate presents
 * .why = a superseded entry holds no debt; every other readable one is sorted by what it owes
 */
const asAllFulcrumDisputeEntriesLive = (input: {
  fulcrums: RouteFulcrum[];
  raisedOn: Map<string, string[]>;
}): RouteFulcrumDisputeEntry[] =>
  input.fulcrums.flatMap((fulcrum) => {
    if (fulcrum.parse.kind !== 'valid') return [];
    if (fulcrum.parse.frontmatter.status === 'superseded') return [];
    const raisedOn = input.raisedOn.get(path.basename(fulcrum.path)) ?? [];
    return [
      {
        path: fulcrum.path,
        title: fulcrum.title,
        raisedOn,
        frontmatter: asFulcrumFrontmatterOwedAsDisputed({
          frontmatter: fulcrum.parse.frontmatter,
          raisedOn,
        }),
      },
    ];
  });

/**
 * .what = an entry's frontmatter with `owed` read as derived, once a dispute has cited it
 * .why = `owed` is derived from ground × confidence, and the dispute path refuses a typed value
 *        that disagrees. but that check runs once, at the dispute; a later hand edit of a cited
 *        entry to `owed: none` would hide the dispute from every gate. so for an entry a dispute
 *        cites, the gate reads the derived value and the typed one cannot route it away. an entry
 *        no dispute cites is a design call, and its typed `owed` stands
 */
const asFulcrumFrontmatterOwedAsDisputed = (input: {
  frontmatter: FulcrumFrontmatter;
  raisedOn: string[];
}): FulcrumFrontmatter =>
  input.raisedOn.length
    ? { ...input.frontmatter, owed: asFulcrumOwed(input.frontmatter) }
    : input.frontmatter;

/**
 * .what = decides whether an entry carries a verdict the newest ledger row proves
 * .why = an entry with no verdict is unruled, and one whose verdict the ledger disagrees with is
 *        forged; only a proven verdict lifts a dispute
 */
const isFulcrumDisputeEntryProven = (input: {
  entry: RouteFulcrumDisputeEntry;
  rows: FulcrumVerdictRow[];
}): boolean =>
  input.entry.frontmatter.verdict !== null &&
  isFulcrumVerdictProven({
    case: input.entry.frontmatter.case,
    ruled: input.entry.frontmatter.verdict.ruled,
    rows: input.rows,
  });
