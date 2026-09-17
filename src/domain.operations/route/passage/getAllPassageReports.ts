import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { compareStonePrefix } from '../stones/compareStonePrefix';
import { getStoneOrderPrefixFromName } from '../stones/computeStoneOrderPrefix';
import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';

/**
 * .what = reads current passage state per stone from passage.jsonl
 * .why = enables current passage state lookup
 *
 * .note = passage.jsonl is append-only with specific deduplication rules:
 *         - passage states (passed/blocked/malfunction): last entry wins
 *         - approved: sticky (persists) unless rewound after it
 *         - overruled: sticky per (stone, level), persists unless rewound after it
 *         - poured: sticky per (stone, level), persists unless rewound after it
 *         - rewound: clears approvals, overrules AND pours for this stone AND all
 *           later stones (cross-stone invalidation)
 *
 * .note = 'poured' rides the overrule shape deliberately rather than by accident:
 *         both are level-scoped facts that must survive every later passage state,
 *         and both must be cleared by exactly one lever — a rewind. that is the
 *         whole of define.invariant.review.peer.level-unlock-is-a-latch, and it
 *         needs no new store because this ledger already had the semantics.
 */
export const getAllPassageReports = async (input: {
  route: string;
}): Promise<PassageReport[]> => {
  // read every entry in raw append order via the one shared parser, then re-bucket
  const allReports = await getAllPassageReportsRaw({ route: input.route });

  // track latest passage state, sticky approvals, and sticky overrules
  const latestByStone = new Map<string, PassageReport>();
  const approvedByStone = new Map<string, PassageReport>();
  // overrules are sticky per (stone, level) so multiple levels can be overruled
  // .why = level-scoped overrule: l1 overrule must survive a later l3 block/pass
  const overruledByKey = new Map<string, PassageReport>();
  // pours are sticky per (stone, level) — the level-unlock LATCH
  // .why = once a level has begun to run it keeps its door open, so a later
  //        regression at a LOWER level can never shut it again
  //        (define.invariant.review.peer.level-unlock-is-a-latch)
  const pouredByKey = new Map<string, PassageReport>();
  // .note = one key shape for BOTH level-scoped statuses, so the two can never
  //         disagree about what "(stone, level)" means
  const levelScopedKey = (report: PassageReport): string =>
    `${report.stone}::${report.level ?? 'all'}`;

  for (const report of allReports) {
    if (report.status === 'approved') {
      // approved is sticky until rewound
      approvedByStone.set(report.stone, report);
    } else if (report.status === 'overruled') {
      // overruled is sticky per (stone, level) until rewound
      overruledByKey.set(levelScopedKey(report), report);
    } else if (report.status === 'poured') {
      // poured is sticky per (stone, level) until rewound — the latch
      // 🔴 it MUST have its own branch. absent one it falls to the last-entry-wins
      //    default below, which is keyed by STONE — so a second pour at another
      //    level evicts the first, and any later passage state evicts them both.
      //    the latch would then vanish the moment the stone blocked, which is
      //    exactly the pass it exists to survive
      pouredByKey.set(levelScopedKey(report), report);
    } else if (report.status === 'rewound') {
      // rewound clears approvals, overrules AND pours for this stone and all later
      // .why = a rewind is the ONE lever that resets the latch. it must reach the
      //        pour set too, or a rewound stone would keep a level open on the
      //        strength of a run against an artifact the rewind discarded
      const rewoundPrefix = getStoneOrderPrefixFromName(report.stone);
      for (const [stoneName] of approvedByStone) {
        const stonePrefix = getStoneOrderPrefixFromName(stoneName);
        if (compareStonePrefix({ a: rewoundPrefix, b: stonePrefix }) <= 0) {
          approvedByStone.delete(stoneName);
        }
      }
      for (const [key, overrule] of overruledByKey) {
        const stonePrefix = getStoneOrderPrefixFromName(overrule.stone);
        if (compareStonePrefix({ a: rewoundPrefix, b: stonePrefix }) <= 0) {
          overruledByKey.delete(key);
        }
      }
      for (const [key, pour] of pouredByKey) {
        const stonePrefix = getStoneOrderPrefixFromName(pour.stone);
        if (compareStonePrefix({ a: rewoundPrefix, b: stonePrefix }) <= 0) {
          pouredByKey.delete(key);
        }
      }
      latestByStone.set(report.stone, report);
    } else {
      // other statuses: last entry wins
      latestByStone.set(report.stone, report);
    }
  }

  // combine: sticky approvals + sticky overrules + sticky pours + latest passage state
  const results: PassageReport[] = [];

  // add sticky approvals first
  for (const report of approvedByStone.values()) {
    results.push(report);
  }

  // add sticky overrules
  for (const report of overruledByKey.values()) {
    results.push(report);
  }

  // add sticky pours — the latch
  // 🔴 .note = a bucket that is filled and never emitted fails exactly as one never
  //    filled does: the reducer reads correct at the branch, and the caller sees an
  //    empty set. BOTH halves are owed for any sticky status added here
  for (const report of pouredByKey.values()) {
    results.push(report);
  }

  // add latest passage states
  for (const report of latestByStone.values()) {
    results.push(report);
  }

  return results;
};
