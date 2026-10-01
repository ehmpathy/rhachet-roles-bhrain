import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

/**
 * .what = acceptance coverage for a stone's prescribed `brain:`, driven through the
 *         `route.drive` SHELL SKILL rather than through any operation it composes
 * .why = the other suites inject a seam for the clone probe; only this grain proves the
 *        wire: the guard parsed from disk, the emit contract, the halt in a terminal
 *
 * .note = every case is DETERMINISTIC: a temp dir is never an enrolled clone (F-a), so no
 *         `clone say` is dispatched — no brain call, no network, no credential
 * .note = `[case1]` pins the halt's invariants and no cause, since the cause is
 *         host-dependent; its snapshot scrubs the cause block (`sanitizeHaltCauseForSnapshot`)
 *         and the per-cause render is pinned hermetically by `formatStoneBrain.test.ts`
 *
 * .note = `[caseN]` is a LOCAL label; `case=N` is the vision's experience catalog
 *
 *    | local     | vision    | what it drives through the wire                        |
 *    |-----------|-----------|--------------------------------------------------------|
 *    | `[case1]` | `case=2`  | a prescribed brain, an unenrolled driver → the halt    |
 *    | `[case2]` | `case=4`  | `model:` where the key is `brain:` → value dropped     |
 *    | `[case3]` | `case=4`  | an unknown key → dropped, no advisory on the drive     |
 *    | `[case4]` | `case=10` | no `brain:` at all → not one added line                |
 *    | `[case5]` | `case=7`  | a passed stone's brain, a brainless stone → `brain =`  |
 *
 * .where the other vision cases are covered — each needs a seam a shell skill cannot inject
 *
 *    | vision   | covered at                                                        |
 *    |----------|-------------------------------------------------------------------|
 *    | `case=1` | `setStoneBrain.integration.test.ts` (order, via seam) +           |
 *    |          | `getCloneAddress.integration.test.ts [case10]` (real `whoami`)    |
 *    | `case=3` | 🔴 **DEFERRED** by the wisher — see below                          |
 *    | `case=5` | `dispatchBrainSwitch.integration.test.ts` — fire-and-forget        |
 *    | `case=6` | `setStoneBrain.ts` — the convergent dispatch (F14)                 |
 *    | `case=8` | `formatStoneBrain.test.ts` + `formatStoneBrainOutcome.test.ts`     |
 *    | `case=9` | `asReviewerBrains.test.ts` + `asReviewPeerBrain.test.ts`           |
 *
 * 🔴 .unproven = a real `clone say` that lands `/model` in a live session, so the next turn
 *    runs on that brain. no fixture reaches it; the observation IS a second turn of a real
 *    brain. it is gated at the `5.3.verification` stone, whose guard admits no deferral
 *
 * .residuals — the corners this feature accepts
 *
 *    | the corner                                   | bound                | owner                  |
 *    |----------------------------------------------|----------------------|------------------------|
 *    | the brain REFUSES `/model` silently          | unbounded            | wisher, deferred       |
 *    | (`case=3`)                                   |                      | 2026-09-13             |
 *    | the process is KILLED between the claim      | 15s, by mtime expiry | wisher, fulcrum `F27`  |
 *    | write and the dispatch                       |                      |                        |
 *
 *    - `case=3`: *"silent failure is fine for now. lets leave a todo to fix that once rhx
 *      whoami includes brain."* — an undetected refusal leaves the INHERITED brain, which is
 *      the pre-feature behavior; the argument lives in `setStoneBrain.ts`
 *    - `F27`: within the window, a stone that DECLARED a brain reads like `case=10` — no line,
 *      no halt — until the claim expires
 */
describe('driver.route.brain.acceptance', () => {
  /**
   * .what = a temp repo with the route fixture, its driver role linked, and one guard
   * .why = the cases differ by ONE file, so the guard body is the parameter
   *
   * 🔴 .note = the `cwd` is a TEMP DIR outside the git root, a deliberate deviation from
   *    `rule.forbid.cwd-outside-gitroot`: the `roles link` below plants a findable `.agent/`,
   *    which removes the harm that rule guards, and a run at this repo's root would drive
   *    THIS repo's live route (`rule.require.hermetic-tests`). scoped to this harness; in
   *    `src/` the rule binds with no exception
   */
  const genRouteWithGuard = async (input: {
    slug: string;
    guard: string | null;
  }): Promise<string> => {
    const tempDir = genTempDirForRhachet({
      slug: input.slug,
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    if (input.guard !== null)
      await fs.writeFile(
        path.join(tempDir, '1.vision.guard'),
        input.guard,
        'utf8',
      );
    return tempDir;
  };

  const drive = async (input: { cwd: string }) =>
    invokeRouteSkill({
      skill: 'route.drive',
      args: { route: '.' },
      cwd: input.cwd,
    });

  /**
   * .what = blanks the ONE region of the halt render that varies by cause, and keeps
   *         every byte around it
   * .why = the cause is host-dependent; its POSITION in the frame is not, so the rest of
   *        the most common halt can be snapped
   *
   * 🔴 .note = it scrubs a SPAN closed by two literals the render always emits
   *           (`this driver runs` … `   or:  remove`): if an anchor moves, the replace misses
   *           and the snapshot goes red rather than quietly pins less
   * .note = the span's body is pinned for all seven causes by `formatStoneBrain.test.ts`
   *         (`formatStoneBrainUndispatched`, `[case3]`)
   * .note = the mask is a bare token, `<cause-block>`, like `<ts>` and `<repo>/`
   *         (`rule.forbid.snapshot-visual-blemishes`)
   */
  const sanitizeHaltCauseForSnapshot = (output: string): string =>
    output.replace(
      /      ├─ this driver runs[\s\S]*?(?=      └─ or: remove)/,
      '      ├─ <cause-block>\n      │\n',
    );

  given(
    '[case1] the stone declares a brain, and this driver is unenrolled',
    () => {
      when('[t0] `route.drive` is run', () => {
        const res = useThen('the drive answers', async () => {
          const tempDir = await genRouteWithGuard({
            slug: 'brain-unenrolled',
            guard: 'brain: claude-sonnet-5[1m]\n',
          });
          return { cli: await drive({ cwd: tempDir }) };
        });

        then('it halts LOUD — the switch is named as not landed', () => {
          expect(res.cli.stdout).toContain('brain switch could not land');
        });

        then(
          'it names the brain the stone prescribed, in the `where do we go?` bucket',
          () => {
            expect(res.cli.stdout).toContain(
              '└─ brain = claude-sonnet-5[1m]',
            );
          },
        );

        then('it refuses to claim a live brain it cannot read', () => {
          // every one of the seven causes opens `unknown — `, and none of them names a
          // brain. a build that guessed one here would put the fabricated claim on the
          // one surface that exists to catch a fabricated claim (F5)
          expect(res.cli.stdout).toContain('─ this driver runs = unknown — ');
        });

        then('it names a fix, and names no flag that does not exist', () => {
          // 🔴 the whole point of the halt. every remedy restores DISPATCHABILITY alone
          //    — `rhx enroll` carries no `--model`, so a fix that offered one would name
          //    a flag a driver cannot run (`rule.require.errors-name-the-fix`)
          expect(res.cli.stdout).toContain('─ fix: ');
          expect(res.cli.stdout).not.toContain('--model');
        });

        then('it offers the escape, and names the guard by PATH', () => {
          // the second remedy, and the one a driver who cannot enroll must reach for
          expect(res.cli.stdout).toContain("remove `brain:` from the stone's guard");
          expect(res.cli.stdout).toContain('1.vision.guard');
        });

        then(
          'the halt REPLACES the drive body rather than rides beside it',
          () => {
            // an unenrolled driver handed the stone's prose plus a halt would read the
            // prose and act; the guard says the stone is not ready to be worked yet
            expect(res.cli.stdout).not.toContain('--as passed');
            expect(res.cli.stdout).not.toContain("here's the stone");
          },
        );

        then('the halt is a BRANCH of the drive tree, owl and root first', () => {
          // 🔴 .why = `S13` — a halt that opens on its own header reads as a second tool
          //    beside the drive, never as the drive's own answer
          expect(res.cli.stdout).toMatch(
            /^🦉 where were we\?\n\n🗿 route\.drive\n   ├─ where do we go\?/,
          );
          expect(res.cli.stdout).toContain(
            '   └─ ✋ halted, brain switch could not land',
          );
        });

        then('stdout has good vibes, cause block scrubbed', () => {
          // the rows above assert strings; only this row pins the frame — order, indent,
          // and whether aught else rode along
          const scrubbed = sanitizeHaltCauseForSnapshot(
            sanitizeTimeForSnapshot(res.cli.stdout),
          );
          // 🔴 .why = a moved anchor would skip the scrub and bake a host-dependent cause
          //    into the snapshot; this turns that miss red here, on every host
          expect(scrubbed).toContain('<cause-block>');
          expect(scrubbed).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] the guard says `model:` where the key is `brain:`', () => {
    when('[t0] `route.drive` is run', () => {
      const res = useThen('the drive answers', async () => {
        const tempDir = await genRouteWithGuard({
          slug: 'brain-model-alias',
          guard: 'model: claude-sonnet-5[1m]\n',
        });
        return { cli: await drive({ cwd: tempDir }) };
      });

      then('NO brain is applied — the alias does not carry its value', () => {
        // 🔴 the F18 bound, end to end. a reader of `F2`'s title alone would expect a
        //    switch here; the vision's `case=4` [t4]-[t6] says the value is DROPPED
        expect(res.cli.stdout).not.toContain('brain switch could not land');
        expect(res.cli.stdout).not.toContain('brain =');
        expect(res.cli.stdout).not.toContain('claude-sonnet-5[1m]');
      });

      then('the advisory does NOT reach the navigation prompt', () => {
        // .why = the advisory belongs to a surface that reads a guard on purpose, never
        //        to a prompt that re-prints on every stop
        expect(res.cli.stdout).not.toContain('🗿 guard:');
      });

      then('the drive body rides, whole and unprefixed', () => {
        expect(res.cli.stdout).toContain('where were we?');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] the guard carries an unknown key', () => {
    when('[t0] the key is a NEAR MISS of a known one', () => {
      const res = useThen('the drive answers', async () => {
        const tempDir = await genRouteWithGuard({
          slug: 'brain-near-miss',
          guard: 'brian: claude-sonnet-5[1m]\n',
        });
        return { cli: await drive({ cwd: tempDir }) };
      });

      then('the near-miss advisory does NOT reach the drive', () => {
        // .why = the near miss is still detected; its advisory never rides a drive that
        //        re-prints every stop
        expect(res.cli.stdout).not.toContain('🗿 guard:');
        expect(res.cli.stdout).not.toContain('did you mean');
      });

      then('the DROP still lands — a near miss carries no value either', () => {
        // the F4 verdict's own half, and the one a driver is actually harmed by. the
        // parser is permissive, so `brian:` is ignored rather than refused — and this
        // asserts the ignore is total, never a partial read
        expect(res.cli.stdout).not.toContain('brain =');
        expect(res.cli.stdout).not.toContain('claude-sonnet-5[1m]');
      });

      then('stdout has good vibes', () => {
        // 🔴 the rows above assert ABSENCE, which a blank stdout satisfies just as well.
        //    only the composed bytes show a reader that the drive rendered in FULL and
        //    carried no advisory — the same gap `[case1]` closed for its own halt
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the key is near NO known one', () => {
      const res = useThen('the drive answers', async () => {
        const tempDir = await genRouteWithGuard({
          slug: 'brain-far-key',
          guard: 'zzzzzzzz: whatever\n',
        });
        return { cli: await drive({ cwd: tempDir }) };
      });

      then('it stays SILENT — a future key must cost no line', () => {
        // the other half of the F4 verdict. a permissive parser that warned on every
        // unrecognized key would warn on every key a later version adds
        expect(res.cli.stdout).not.toContain('🗿 guard:');
      });

      then('the drive body is untouched', () => {
        expect(res.cli.stdout).toContain('where were we?');
      });

      then('stdout has good vibes', () => {
        // 🔴 the SILENCE row above proves one string is absent, which a blank stdout
        //    would satisfy just as well. only the composed bytes show a reader that
        //    the drive rendered in full AND carried no advisory
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] the stone declares no brain at all', () => {
    when('[t0] `route.drive` is run with no guard', () => {
      const res = useThen('the drive answers', async () => {
        const tempDir = await genRouteWithGuard({
          slug: 'brain-undeclared',
          guard: null,
        });
        return { cli: await drive({ cwd: tempDir }) };
      });

      then('it emits no brain line', () => {
        // 🔴 the assert is on `brain =`, never on the elbow. the elbow belongs to
        //    whichever row is LAST in the `where do we go?` bucket, so `└─ brain` would
        //    go green on a build that rendered the line one rung up with a `├─`
        expect(res.cli.stdout).not.toContain('brain =');
      });

      then('it emits no halt', () => {
        expect(res.cli.stdout).not.toContain('brain switch could not land');
      });

      then('it emits no advisory', () => {
        expect(res.cli.stdout).not.toContain('🗿 guard:');
      });

      then('the drive reads exactly as it did before this feature', () => {
        // 🔴 the widest blast radius in the whole vision — EVERY extant guard in every
        //    repo takes this branch. a symmetry line, an unconditional `whoami`, or a
        //    defensive re-assert would each break every drive that never asked for this
        expect(res.cli.stdout).toContain('where were we?');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = case=7's other half at the acceptance wire — the ATTRIBUTED, sticky brain
   * .why = `[case16c]` (`stepRouteDrive.integration.test.ts`) proves it at the operation
   *        grain; the brainless arm needs no clone, so the shell skill reaches it too
   */
  given(
    '[case5] a passed stone dispatched a brain; this stone declares none',
    () => {
      when('[t0] `route.drive` is run', () => {
        const res = useThen('the drive answers', async () => {
          const tempDir = await genRouteWithGuard({
            slug: 'brain-inherited',
            guard: 'brain: claude-opus-5[1m]\n',
          });

          // stone 1.vision already passed, having dispatched the brain it prescribed.
          // 2.criteria (this stone) carries no guard at all — brainless by construction
          await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
          await fs.writeFile(
            path.join(tempDir, '.route', 'passage.jsonl'),
            `${JSON.stringify({ stone: '1.vision', status: 'passed' })}\n`,
          );
          // .why SEEDED = only the `requested` arm writes it, and with no live clone a
          //     real walk halts `undispatched` and writes none
          await fs.writeFile(
            path.join(tempDir, '.route', '.drive.blockers.latest.json'),
            JSON.stringify({
              count: 0,
              stone: '1.vision',
              brain: { slug: 'claude-opus-5[1m]', stone: '1.vision' },
            }),
          );

          return { cli: await drive({ cwd: tempDir }) };
        });

        then('the inherited brain is NAMED, never silently carried', () => {
          expect(res.cli.stdout).toContain('brain = claude-opus-5[1m]');
        });

        then('it is a LINE in `where do we go?`, never a section above it', () => {
          // .why = "which brain prices this stone?" is the same kind of question as "which
          //        route?" and "which stone?", so it is read in the same bucket
          const stdout = res.cli.stdout;
          expect(stdout).not.toContain('⟨inherited — unconfirmed⟩');
          expect(stdout).not.toContain('last set by');
          expect(stdout.indexOf('stone = 2.criteria')).toBeLessThan(
            stdout.indexOf('brain = claude-opus-5[1m]'),
          );
        });

        then('it is an ATTRIBUTION, never a fresh switch', () => {
          // the sticky half: a brainless stone dispatches naught, so no halt renders and
          // the live brain is left exactly as the passed stone set it
          expect(res.cli.stdout).not.toContain('brain switch could not land');
        });

        then('the drive body rides, whole and unprefixed', () => {
          // 🔴 `toContain` alone would pass with a section back above it, so this pins
          //    that `where were we?` is the FIRST thing a driver's terminal shows
          expect(res.cli.stdout.trimStart()).toMatch(/^🦉 where were we\?/);
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    },
  );
});
