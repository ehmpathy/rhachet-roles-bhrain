import * as fs from 'fs/promises';
import * as path from 'path';

import { getRouteGuardReviewPeerPathMeta } from '../../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathMeta';
import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import { concedeEveryPeerConcern } from './concedeEveryPeerConcern';
import { invokeRouteSkill } from './invokeRouteSkill';

/**
 * .what = drives the FULL default-norm conversation a driver has between two review
 *         rounds: writes a .taken.by_self beside every .given.by_peer, signals
 *         `--as absorbed --that <slug>` once per reviewer, THEN declares
 *         `--as conceded` on every concern the stone still owes a stance
 * .why = two entrance gates stand between a rejected lane and its next round, and
 *        an edit alone clears neither. the FIRST is the contemplation gate — it
 *        refuses a new round while an articulation is owed. the SECOND is the stance
 *        gate — it refuses a new round while any concern stands undeclared. concede
 *        is the DEFAULT stance (S11): it keeps the concern in the tally and keeps the
 *        hold, so the lane re-runs and the round flows as it did before either gate
 *        existed. a journey that drives more than one round must clear BOTH gates
 *        between them, which is why this helper answers AND concedes in one call —
 *        the same cadence the two acts keep for a real driver.
 *
 * .note = 🔴 the concede is the salient NEW half. the name keeps its established
 *         convention here — it already elided `--as absorbed` yet signals it, and
 *         names the helper by its first act while it drives the whole between-rounds
 *         conversation. a suite that must observe the stance gate HALT (a bare answer
 *         with no concede) drives the raw calls itself, as driver.route.stance does;
 *         it does not reach for this advance-the-round helper.
 *
 * .note = 🔴 this is the blackbox twin of
 *         `src/domain.operations/route/__test_assets__/answerEveryPeerGiven.ts`.
 *         they are deliberately NOT shared: that one writes files in-process
 *         against absolute paths from the production enumerator, while this one
 *         drives the real cli in a temp dir and must therefore go through
 *         `route.stone.set --as absorbed` so the passage ledger records the
 *         conversation the way a real driver's would.
 *
 * .note = 🔴 every read of the peer filename grammar here goes through the PRODUCTION
 *         transformers — `isRouteGuardReviewPeerGivenPath` to select,
 *         `getRouteGuardReviewPeerPathTaken` to derive the pair, and
 *         `getRouteGuardReviewPeerPathMeta` to read the slug. this file used to carry the
 *         `._.given.by_peer.` literal three times over, which made it a THIRD home for a
 *         grammar the repo had already centralized in this same change — so a rename of
 *         any segment could desync the blackbox pair silently while the src twin tracked
 *         it (r1 nitpick.1, i016; rule.require.single-source-of-truth-for-render).
 *
 * .note = to import pure transformers across the boundary is the extant pattern here, not a
 *         new one — the four `driver.route.*` suites already import
 *         `getSelfReviewArticulationPath` from src for exactly this reason. what stays
 *         unshared is the ASSET above, which drives the real cli; a path transform carries
 *         no such coupled state.
 */
export const answerEveryPeerGiven = async (input: {
  cwd: string;
  stone: string;
  route?: string;
  reply?: string;
  /**
   * grades the concede this helper declares on every undeclared concern (S14/S16). default
   * `better` — the maintenance floor, shed by the judge at terminality so an all-`better`
   * exhaustion PASSES. pass `urgent` where a journey needs the exhaustion to HOLD the road: an
   * urgent concession keeps its hold, so the exhaustion halts and warns a human. this is the ONE
   * place the between-rounds concede is declared, so a journey must NOT also call
   * `concedeEveryPeerConcern` — a second concede lands first at the default `better` and the
   * severity-blind idempotency then drops the urgent re-declaration.
   */
  severity?: 'better' | 'urgent';
}): Promise<string[]> => {
  const peerDir = path.join(input.cwd, '.reviews', 'peer');

  // an absent dir means no round has run yet, so no articulation is owed
  const entries = await fs.readdir(peerDir).catch(() => [] as string[]);

  const namesGiven = entries.filter(
    (name) =>
      name.startsWith(`${input.stone}._.`) &&
      isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
  );

  const slugs: string[] = [];

  for (const nameGiven of namesGiven) {
    const nameTaken = getRouteGuardReviewPeerPathTaken({
      pathGiven: nameGiven,
    });

    await fs.writeFile(
      path.join(peerDir, nameTaken),
      input.reply ?? '[REPAIR] answered — the repair is in the artifact\n',
    );

    const { slug } = getRouteGuardReviewPeerPathMeta({ path: nameGiven });
    if (!slugs.includes(slug)) slugs.push(slug);
  }

  // 🔴 absorb each concern FIRST — the default absorption is concede. the composition gate
  //    (define.invariant.review.peer.absorb) refuses `--as absorbed` while any concern of a
  //    reviewer's given stands un-absorbed, so the per-concern disposition must PRECEDE the
  //    feedback-grain act. the undeclared read goes through the same production fold the
  //    entrance gate uses, so a concern this skips is one the gate would let pass.
  await concedeEveryPeerConcern({
    cwd: input.cwd,
    stone: input.stone,
    route: input.route,
    severity: input.severity,
  });

  // THEN absorb the feedback — one `--as absorbed` per reviewer, as a driver does. every
  // concern is now absorbed, so the composition gate opens.
  for (const slug of slugs) {
    await invokeRouteSkill({
      skill: 'route.stone.set',
      args: {
        stone: input.stone,
        route: input.route ?? '.',
        as: 'absorbed',
        that: slug,
      },
      cwd: input.cwd,
    });
  }

  return slugs;
};
