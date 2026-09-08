import { given, then, when } from 'test-fns';

import { formatRouteGuardReviewPeerContemplatePrompt } from './formatRouteGuardReviewPeerContemplatePrompt';

/**
 * .what = collapses tree glyphs and wrapped whitespace into one flat line
 * .why = the render wraps prose to fit a terminal, so a sentence spans lines and
 *        carries `│` continuations. an assertion on the SENSE of that sentence must
 *        survive a re-wrap; only the snapshot should pin the exact layout.
 *
 * 🔴 .note = a plain `.toContain('there is none to find')` broke on a pure re-wrap
 *         that changed no words at all (r6 i002). the lesson is the same one r7
 *         taught: clamp the property, never the column the copy happens to land in.
 */
const asFlatProse = (out: string): string =>
  out.replace(/[│├└─]/g, ' ').replace(/\s+/g, ' ');

/**
 * 🔴 the fixtures are ABSOLUTE, as the filesystem hands them over, and the
 * expectations are the repo-relative form the driver must read.
 *
 * .why = they were repo-relative before, and that is exactly what let the defect
 *        survive three clean review rounds: a fixture already in display form makes
 *        `toContain(pathGiven)` pass whether or not the formatter relativizes at all,
 *        so the assertion clamped no property. `enumFilesFromGlob` passes
 *        `absolute: true`, so production never supplies the short form — the fixture
 *        was the one place it existed (r11 blocker.1, i004).
 *
 * ⇒ the two-sided assertion below is what gives the test teeth: the display form is
 *   present AND the absolute prefix is absent. remove the `root` from the formatter
 *   and the second half goes red.
 */
const ROOT = '/tmp/demo-repo';
const ROUTE_REL = '.behavior/v2026_01_01.demo';

const pathGivenArch = `${ROOT}/${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.given.by_peer.architect.md`;
const pathTakenArch = `${ROOT}/${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.taken.by_self.architect.md`;
const pathGivenMech = `${ROOT}/${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r002._.given.by_peer.mechanic.md`;
const pathTakenMech = `${ROOT}/${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r002._.taken.by_self.mechanic.md`;

const displayGivenArch = `${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.given.by_peer.architect.md`;
const displayTakenArch = `${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.taken.by_self.architect.md`;
const displayTakenMech = `${ROUTE_REL}/.reviews/peer/1.execute._.review.i001.a1b2c3.r002._.taken.by_self.mechanic.md`;

describe('formatRouteGuardReviewPeerContemplatePrompt', () => {
  given('[case1] the reply-prompt with two reviewers', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'architect',
            blockers: 2,
            nitpicks: 1,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
            retired: false,
            unreadable: false,
          },
          {
            slug: 'mechanic',
            blockers: 0,
            nitpicks: 3,
            pathGiven: pathGivenMech,
            pathTaken: pathTakenMech,
            retired: false,
            unreadable: false,
          },
        ],
      });

      then('lists each reviewer with slug, verdict, and both paths', () => {
        expect(out).toContain('review.peer 1/2');
        expect(out).toContain('slug = architect');
        expect(out).toContain('verdict = 2 blockers, 1 nitpick');
        expect(out).toContain('review.peer 2/2');
        expect(out).toContain('verdict = 0 blockers, 3 nitpicks');
        expect(out).toContain(`contemplate from`);
        expect(out).toContain(displayGivenArch);
        expect(out).toContain('articulate into');
        expect(out).toContain(displayTakenArch);
      });

      // 🔴 the two-sided clamp — the display form present is only half the claim.
      //    a formatter that printed the raw absolute path would ALSO satisfy the
      //    `toContain` above, because the display form is a suffix of it. only the
      //    absence of the root proves the cast ran (r11 blocker.1, i004)
      then(
        'prints no absolute filesystem prefix for the driver to scroll',
        () => {
          expect(out).not.toContain(ROOT);
        },
      );

      then('closes with the --as contemplated run line', () => {
        expect(out).toContain(
          'rhx route.stone.set --stone 1.execute --as contemplated --that architect',
        );
      });

      then('names EVERY owed reviewer in the close, not just the first', () => {
        // 🔴 --as contemplated takes ONE slug, so a close that names only the first
        //    reads as "run this one and you are done" and the driver stops a reviewer
        //    short of discharged (r9 nitpick.1, i002)
        expect(out).toContain(
          'rhx route.stone.set --stone 1.execute --as contemplated --that mechanic',
        );
      });

      then('states the count, so the driver knows how many to run', () => {
        expect(out).toContain('run all 2 — one per reviewer');
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case2] the absent case for one reviewer', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'absent',
        stone: '1.execute',
        root: ROOT,
        reviewer: {
          slug: 'architect',
          blockers: 2,
          nitpicks: 1,
          pathGiven: pathGivenArch,
          pathTaken: pathTakenArch,
          unreadable: false,
        },
      });

      then('names the absent taken path and why it is required', () => {
        expect(out).toContain('contemplation absent for reviewer architect');
        expect(out).toContain(displayTakenArch);
        expect(out).toContain('the .taken file IS that engagement');
        expect(out).toContain('contemplate from');
        expect(out).toContain(displayGivenArch);
      });

      // the same two-sided clamp as the reply-prompt — see its note
      then(
        'prints no absolute filesystem prefix for the driver to scroll',
        () => {
          expect(out).not.toContain(ROOT);
        },
      );

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case3] the stale case for one reviewer', () => {
    when('[t0] rendered', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'stale',
        stone: '1.execute',
        root: ROOT,
        reviewer: {
          slug: 'architect',
          blockers: 2,
          nitpicks: 1,
          pathGiven: pathGivenArch,
          pathTaken: pathTakenArch,
          unreadable: false,
        },
      });

      then('renders distinct re-articulate copy from the absent case', () => {
        expect(out).toContain('contemplation stale for reviewer architect');
        expect(out).toContain('answer the critique that is live');
        expect(out).not.toContain('the .taken file IS that engagement');
      });

      then('blames the REVIEWER, never the artifact change', () => {
        // F7. under the reviewer-keyed debt an edit to the artifact does NOT stale
        // an answer — a taken pairs its own given and stays paired however many
        // times the hash moves after it. copy that blames the artifact teaches the
        // driver the exact wrong model: that an edit acts upon their answer
        expect(out).toContain('the reviewer has spoken again');
        expect(out).not.toContain('the stone artifact changed');
      });

      // the same two-sided clamp as the reply-prompt — see its note
      then(
        'prints no absolute filesystem prefix for the driver to scroll',
        () => {
          expect(out).toContain(displayGivenArch);
          expect(out).not.toContain(ROOT);
        },
      );

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case4] a RETIRED reviewer still owes a reply', () => {
    // the sharpest blocked state the reviewer-keyed debt creates, and the one a driver
    // is least equipped to read: the guard names a reviewer that is nowhere in the
    // config. absent this copy the halt reads as a defect, and the driver's instinct —
    // wait for the reviewer to speak again — can never succeed, because it does not run.
    when('[t0] rendered beside a live reviewer', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'architect',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
            retired: false,
            unreadable: false,
          },
          {
            slug: 'mechanic',
            blockers: 2,
            nitpicks: 0,
            pathGiven: pathGivenMech,
            pathTaken: pathTakenMech,
            retired: true,
            unreadable: false,
          },
        ],
      });

      then('the retired one is marked, and the live one is NOT', () => {
        const [blockArch, blockMech] = out.split('review.peer 2/2');
        expect(blockArch).not.toContain('retired from the guard config');
        expect(blockMech).toContain('retired from the guard config');
      });

      then('it explains WHY a reviewer that does not run still gates', () => {
        expect(out).toContain('why a retired reviewer still awaits');
        expect(out).toContain('removed from the guard config');
      });

      then('it names the fix, and that the fix is the ONLY one', () => {
        // rule.require.errors-name-the-fix — and the fix carries unusual weight here,
        // since the human-overrule valve is shut for a slug absent from the config (F8)
        expect(out).toContain('write the .taken above');
        expect(asFlatProse(out)).toContain('it will not speak again');
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });

    when('[t1] no reviewer is retired', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'architect',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
            retired: false,
            unreadable: false,
          },
        ],
      });

      then('the retired copy is absent — no noise in the common case', () => {
        expect(out).not.toContain('retired');
      });

      then(
        'matches snapshot — the SINGLE-reviewer close is its own variant',
        () => {
          // 🔴 total==1 takes a different close than total>1 ("when you've
          //    contemplated this reviewer, run" vs "run all N"), and it is the
          //    branch a driver meets most — one owed reviewer is the common case.
          //    every other case here snaps the multi-reviewer shape, so absent
          //    this the single close ships un-vibecheckable
          //    (rule.require.contract-snapshot-exhaustiveness; r2 i002)
          expect(out).toMatchSnapshot();
        },
      );
    });
  });

  given('[case5] an UNREADABLE reviewer — the counts are fabricated', () => {
    // asPeerGivenVerdict scores an unreadable given `blockers: 1` because the gate
    // needs a number and none was read. 🔴 to print that as `1 blocker` tells the
    // driver the guard read a verdict when it read none, and sends them to hunt a
    // blocker that was never raised — the failhide, re-hidden at the surface
    when('[t0] rendered beside a readable reviewer', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'architect',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
            retired: false,
            unreadable: false,
          },
          {
            slug: 'mechanic',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenMech,
            pathTaken: pathTakenMech,
            retired: false,
            unreadable: true,
          },
        ],
      });

      then('the unreadable one says so INSTEAD of a count', () => {
        const [blockArch, blockMech] = out.split('review.peer 2/2');
        expect(blockArch).toContain('verdict = 1 blocker, 0 nitpicks');
        expect(blockMech).toContain(
          'verdict = unreadable — no numeric count found',
        );
      });

      then(
        'the two are DISTINGUISHABLE, though their counts are identical',
        () => {
          // both carry blockers:1 — only the flag parts them, which is the whole point
          expect(out).toContain('verdict = 1 blocker, 0 nitpicks');
          expect(out).toContain('verdict = unreadable');
        },
      );

      then('it names the why and rules out the hunt for a blocker', () => {
        expect(out).toContain('why an unreadable reviewer gates');
        expect(asFlatProse(out)).toContain('there is none to find');
      });

      then('the explanation cites NO count, because none is rendered', () => {
        // an earlier copy closed the why-block with "the count shown for it is not
        // the reviewer's". that sentence disowned the synthesized `blockers: 1` back
        // when `asVerdict` still printed it. once the render was fixed to say
        // `unreadable — no numeric count found`, the sentence disowned a figure
        // absent from the screen, and a reader who hunted the render for it found
        // no count at all. so the clamp here is the PROPERTY, never the copy:
        // whatever the explanation says, it must not cite a count the render omits.
        // a string equality would have re-broken on the next reword (r7 i002)
        const whyBlock = out.split('why an unreadable reviewer gates')[1] ?? '';

        // 🔴 without this the three negatives below pass trivially on an empty split
        expect(whyBlock).not.toEqual('');

        expect(whyBlock).not.toMatch(/\d+ blockers?/);
        expect(whyBlock).not.toMatch(/\d+ nitpicks?/);
        expect(whyBlock).not.toContain('count shown');
      });

      then('matches snapshot', () => {
        expect(out).toMatchSnapshot();
      });
    });

    when('[t1] no reviewer is unreadable', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'architect',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenArch,
            pathTaken: pathTakenArch,
            retired: false,
            unreadable: false,
          },
        ],
      });

      then(
        'the unreadable copy is absent — no noise in the common case',
        () => {
          expect(out).not.toContain('unreadable');
        },
      );

      then('matches snapshot — the clean single-reviewer render', () => {
        // the no-why-block variant: no retired branch, no unreadable branch, so
        // the tree is reviewers + close alone. pinned so a stray branch cannot
        // leak into the common case unnoticed (r2 i002)
        expect(out).toMatchSnapshot();
      });
    });
  });

  given('[case6] ONE reviewer that is BOTH retired AND unreadable', () => {
    // 🔴 the two flags are ORTHOGONAL fields on one reviewer record, and the
    //    formatter emits a why+fix branch per flag, in sequence. so a reviewer that
    //    left the guard config AND malfunctioned on its last run renders a shape no
    //    other case produces: two why blocks and two fix blocks inside one tree.
    //
    //    it was argued "correct by construction" and left unsnapped, which answers
    //    correctness and never the rule's actual demand — a reviewer cannot vibecheck
    //    a variant no snapshot records, so drift in the stacked copy ships unseen
    //    (rule.require.contract-snapshot-exhaustiveness; r2 blocker.1, i002)
    when('[t0] rendered as the only reviewer', () => {
      const out = formatRouteGuardReviewPeerContemplatePrompt({
        case: 'reply-prompt',
        stone: '1.execute',
        root: ROOT,
        reviewers: [
          {
            slug: 'mechanic',
            blockers: 1,
            nitpicks: 0,
            pathGiven: pathGivenMech,
            pathTaken: pathTakenMech,
            retired: true,
            unreadable: true,
          },
        ],
      });

      then('BOTH status lines render on the one reviewer', () => {
        expect(out).toContain('retired from the guard config');
        expect(out).toContain('verdict = unreadable — no numeric count found');
      });

      then('BOTH why branches render, and neither displaces the other', () => {
        expect(out).toContain('why a retired reviewer still awaits');
        expect(out).toContain('why an unreadable reviewer gates');
      });

      then('the two why branches do not collide into one', () => {
        // the change a stacked render most plausibly breaks is a SHARED container —
        // one why block that swallows the other's copy. so the clamp is a count of
        // the branch heads rather than their presence, which a merge would not move
        const heads = out.match(/├─ why/g) ?? [];
        expect(heads.length).toBeGreaterThanOrEqual(2);
      });

      then('no two peer branch heads at the top level read alike', () => {
        // 🔴 the defect this clamps SHIPPED and was snapped: `pushWhyFix` emitted the
        //    literal `├─ fix` for both branches, so the stacked render carried two
        //    byte-identical peers and a driver had to read the prose beneath each to
        //    learn which answered which (r4 nitpick.1, i003).
        //
        //    the snapshot alone did not catch it — a snapshot pins whatever is there,
        //    a blemish and all. so the shape earns its own assertion: every `├─` head
        //    at the tree's top level must be unique.
        //
        // .note = scoped to the top level (three-space lead). the per-reviewer block
        //         nests its own `├─` heads at a deeper indent, and those SHOULD repeat
        //         across reviewers — `slug`, `verdict`, `contemplate from` are the same
        //         role in each, which is what makes the list scannable.
        const heads = out.match(/^ {3}├─ .+$/gm) ?? [];
        expect(heads.length).toBeGreaterThanOrEqual(2);
        expect(new Set(heads).size).toEqual(heads.length);
      });

      then('the driver is still handed exactly one answer path', () => {
        // 🔴 two why blocks must NOT imply two takens. the debt is one reviewer's,
        //    so the close names one file — otherwise the driver writes two and the
        //    gate accepts neither
        // 🔴 `toEqual`, never `toBeGreaterThanOrEqual`. the per-reviewer `articulate
        //    into` line alone puts the path on screen once, so a lower bound of 1 is
        //    already satisfied before this title's claim is tested at all — and a
        //    second answer path would take the count to 2, which the loose form also
        //    accepts. the EXACT count is the assertion
        //    (r1 nitpick.4, i006/i007/i010/i011)
        const occurrences = out.split(displayTakenMech).length - 1;
        expect(occurrences).toEqual(1);
      });

      then(
        'matches snapshot — the STACKED render, the variant that had none',
        () => {
          expect(out).toMatchSnapshot();
        },
      );
    });
  });
});
