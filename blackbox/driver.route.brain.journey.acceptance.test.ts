import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

/**
 * .what = every boundary of brain.choice and brain.effort selection, walked through the
 *         `route.drive` SHELL SKILL, with the stdout of every step snapped
 * .why = `S13` + `S14`: a reader of the snapshots must SEE each switch land, each carry, and
 *        each halt — five happy steps and one halt is a sample, never coverage
 *
 *    | case     | the boundary family                                                   |
 *    |----------|-----------------------------------------------------------------------|
 *    | [case1]  | each switch shape — choice alone, effort alone, both, carry, halt     |
 *    | [case2]  | the carry rules — a slug outlives `/effort`; a level dies at `/model` |
 *    | [case3]  | the declaration shapes — quoted, unclosed, alias, typo, empty, sub-key |
 *    | [case4]  | a route whose every declaration is malformed = a route with none      |
 *    | [case5]  | every answer the clone can give — seven causes, a refusal, a serial   |
 *    | [case6]  | the cadence per surface — onStop, direct, onBoot, and the claim window |
 *    | [case7]  | a halt that repeats every tick, then self-heals on enroll             |
 *    | [case8]  | the brainless stones that inherit naught                              |
 *    | [case9]  | a brain halt stacked above a route halt, on both hook surfaces        |
 *
 * 🔴 .note = the clone is a SHIM `rhx`, a fixture and never a mock: `route.drive` spawns it
 *    for real, parses its real stdout, and reads its real exit code. a `whoami.mode` file
 *    beside it picks which answer a live clone would give
 *
 * 🔴 .note = the shim REPLACES the tempdir's `node_modules/.bin` symlink with a real dir, after
 *    `roles link` ran. the symlink points at THIS repo's `.bin`, so a shim written through it
 *    would clobber the real `rhx`; and the real `rhx` would dispatch `/model` into the live
 *    session jest inherits `RHACHET_CLONE_SERIAL` from. `route.drive.sh` runs node off the
 *    linked package, so it never needs `.bin`
 *
 * .note = the claim window (15s) is passed by a backdate of the claim file's mtime — the one
 *         input the window reads — never by a real 15s wait
 */
describe('driver.route.brain.journey.acceptance', () => {
  /**
   * .what = a clone whose `whoami` answer is picked by `whoami.mode`, and which records each
   *         `say` it is sent
   * .why = the two calls `setStoneBrain` makes; every other call fails loud (exit 1) rather
   *        than pretends, so an unexpected spawn cannot pass silently
   *
   *    | mode         | `whoami` answers                               | the cause it reaches  |
   *    |--------------|------------------------------------------------|-----------------------|
   *    | (absent)     | `{"slug":"driver-shim"}`                       | — the switch lands    |
   *    | `unenrolled` | exit 2                                         | `unenrolled`          |
   *    | `broken`     | exit 1                                         | `unreadable-clone`    |
   *    | `garbage`    | exit 0, prose where json was owed              | `unreadable-payload`  |
   *    | `noaddress`  | exit 0, json with no slug and no serial        | `unreadable-address`  |
   *    | `killed`     | dies by SIGKILL                                | `killed`              |
   *    | `slow`       | outlives the 10s cap                           | `timed-out`           |
   *    | `saybreak`   | answers, then strips its own exec bit          | `spawn-failed`        |
   *    | `serialonly` | a blank slug, a serial                         | — lands at `@:s7`     |
   *    | `sayfails`   | answers; each `say` exits 1 after it records   | — lands, unseen       |
   */
  const SHIM_RHX = [
    '#!/bin/sh',
    'here="$(cd "$(dirname "$0")" && pwd)"',
    'mode="$(cat "$here/whoami.mode" 2>/dev/null)"',
    'if [ "$1" = "clone" ] && [ "$2" = "whoami" ]; then',
    '  case "$mode" in',
    '    unenrolled) exit 2 ;;',
    '    broken) exit 1 ;;',
    `    garbage) printf '%s\\n' 'enrolled, probably'; exit 0 ;;`,
    `    noaddress) printf '%s\\n' '{"slug":null,"serial":null}'; exit 0 ;;`,
    '    killed) kill -9 $$ ;;',
    '    slow) exec sleep 30 ;;',
    `    serialonly) printf '%s\\n' '{"slug":"   ","serial":"s7"}'; exit 0 ;;`,
    '    saybreak) chmod -x "$0" ;;',
    '  esac',
    `  printf '%s\\n' '{"slug":"driver-shim","serial":"s1"}'`,
    '  exit 0',
    'fi',
    'if [ "$1" = "clone" ] && [ "$2" = "say" ]; then',
    `  printf '%s %s\\n' "$3" "$5" >> "$here/says.log"`,
    '  if [ "$mode" = "sayfails" ]; then exit 1; fi',
    '  exit 0',
    'fi',
    'exit 1',
    '',
  ].join('\n');

  type Scene = { tempDir: string; binDir: string };

  /**
   * .what = a temp route with the driver role linked, the shim clone in `.bin`, extra stones,
   *         and one guard per named stone
   * .why = each case walks its own route, so one case's record never leaks into the next
   */
  const genBrainRoute = async (input: {
    slug: string;
    stonesExtra: string[];
    guards: Record<string, string[]>;
  }): Promise<Scene> => {
    const tempDir = genTempDirForRhachet({
      slug: input.slug,
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

    // swap the linked `.bin` for a dir that holds only the shim clone
    const binDir = path.join(tempDir, 'node_modules', '.bin');
    await fs.unlink(binDir);
    await fs.mkdir(binDir, { recursive: true });
    await fs.writeFile(path.join(binDir, 'rhx'), SHIM_RHX, { mode: 0o755 });

    // the stones beyond the fixture's three
    await Promise.all(
      input.stonesExtra.map((stone) =>
        fs.writeFile(
          path.join(tempDir, `${stone}.stone`),
          `# ${stone}\n\nwork on ${stone}\n`,
        ),
      ),
    );

    // one guard per named stone; an unnamed stone declares none
    await Promise.all(
      Object.entries(input.guards).map(([stone, lines]) =>
        fs.writeFile(
          path.join(tempDir, `${stone}.guard`),
          `${lines.join('\n')}\n`,
        ),
      ),
    );
    await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
    return { tempDir, binDir };
  };

  /**
   * .what = writes the passage record, so the next unpassed stone is driven
   * .why = the journey walks the route; a passage record is how a route knows where it is
   */
  const setPassage = async (input: {
    scene: Scene;
    passed: string[];
    blocked?: string;
  }) => {
    const rows = [
      ...input.passed.map((stone) => ({ stone, status: 'passed' })),
      ...(input.blocked ? [{ stone: input.blocked, status: 'blocked' }] : []),
    ];
    await fs.writeFile(
      path.join(input.scene.tempDir, '.route', 'passage.jsonl'),
      rows.map((row) => JSON.stringify(row)).join('\n') +
        (rows.length ? '\n' : ''),
    );
  };

  /**
   * .what = picks the answer the shim clone gives, and restores its exec bit
   * .why = `saybreak` strips the bit to reach `spawn-failed`; the next step must start whole
   */
  const setMode = async (input: { scene: Scene; mode: string | null }) => {
    const modePath = path.join(input.scene.binDir, 'whoami.mode');
    if (input.mode) await fs.writeFile(modePath, input.mode);
    if (!input.mode) await fs.rm(modePath, { force: true });
    await fs.chmod(path.join(input.scene.binDir, 'rhx'), 0o755);
  };

  /**
   * .what = ages the dispatch claim past its 15s window
   * .why = the window is read from the claim file's mtime, so a backdate IS the passage of
   *        time to the one reader that measures it
   */
  const setClaimExpired = async (input: { scene: Scene }) => {
    const claimPath = path.join(
      input.scene.tempDir,
      '.route',
      '.brain.dispatch.latest.json',
    );
    const past = new Date(Date.now() - 60_000);
    await fs.utimes(claimPath, past, past);
  };

  /**
   * .what = the says the shim received, once at least `count` have landed and the log settled
   * .why = the dispatch is DETACHED and returns before the child runs (`case=5`), so the log
   *        is polled — bounded, and red on a miss rather than a hang. the settle catches a say
   *        that lands one beat late, so "no new say" is a real observation
   */
  const getSays = async (input: {
    scene: Scene;
    count: number;
  }): Promise<string[]> => {
    const readSays = () =>
      fs
        .readFile(path.join(input.scene.binDir, 'says.log'), 'utf8')
        .then((text) => text.split('\n').filter(Boolean))
        .catch(() => [] as string[]);
    for (let attempt = 0; attempt < 50; attempt++) {
      if ((await readSays()).length >= input.count) break;
      await new Promise((done) => setTimeout(done, 100));
    }
    await new Promise((done) => setTimeout(done, 400));
    return readSays();
  };

  const drive = async (input: {
    scene: Scene;
    when?: 'hook.onBoot' | 'hook.onStop';
  }) =>
    invokeRouteSkill({
      skill: 'route.drive',
      args: { route: '.', when: input.when },
      cwd: input.scene.tempDir,
    });

  /**
   * .what = the `where do we go?` rows for a brain and an effort, as the drive renders them
   * .why = the rows every step asserts; one render, so no step pins a different shape
   * .note = an effort makes `brain` a bare parent over `choice =` + `effort =` peers (S15)
   */
  const asBucketRows = (input: {
    brain: string | null;
    effort: string | null;
  }): string =>
    input.effort
      ? [
          '└─ brain',
          ...(input.brain ? [`   │     ├─ choice = ${input.brain}`] : []),
          `   │     └─ effort = ${input.effort}`,
        ].join('\n')
      : `└─ brain = ${input.brain}`;

  const HALT = '✋ halted, brain switch could not land';

  given('[case1] a route whose stones each prescribe a different switch', () => {
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-shapes',
        stonesExtra: ['4.polish', '5.ship'],
        guards: {
          '1.vision': ['brain: claude-opus-5[1m]'],
          '2.criteria': ['brain:', '  effort: high'],
          '3.plan': ['brain:', '  choice: claude-sonnet-5[1m]', '  effort: low'],
          '5.ship': ['brain:', '  choice: claude-haiku-4-5', '  effort: medium'],
        },
      }),
    );

    when('[t0] 1.vision declares a CHOICE alone', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: [] });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 1 }) };
      });

      then('the clone receives `/model`, and no `/effort`', () => {
        expect(res.says).toEqual(['@:driver-shim /model claude-opus-5[1m]']);
      });

      then('the bucket names the brain, with no effort beneath it', () => {
        expect(res.cli.stdout).toContain(
          '└─ brain = claude-opus-5[1m]\n   │\n',
        );
        expect(res.cli.stdout).not.toContain('effort =');
      });

      then('the stone body rides beneath — the switch was requested', () => {
        expect(res.cli.stdout).toContain('--as passed');
        expect(res.cli.stdout).not.toContain(HALT);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] 2.criteria declares an EFFORT alone', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: ['1.vision'] });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 2 }) };
      });

      then('the clone receives `/effort`, and no second `/model`', () => {
        // 🔴 .why = an effort-only guard must never re-send the prior choice — that would
        //    re-price the stone with a model its guard never named
        expect(res.says.slice(1)).toEqual(['@:driver-shim /effort high']);
      });

      then('the bucket shows a bare `brain` node, the effort beneath it', () => {
        expect(res.cli.stdout).toContain(
          '└─ brain\n   │     └─ effort = high',
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] 3.plan declares a choice AND an effort', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: ['1.vision', '2.criteria'] });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 4 }) };
      });

      then('the clone receives both says', () => {
        // .note = sorted: `F29` records that delivery order between the two is unguaranteed
        expect(res.says.slice(2).sort()).toEqual([
          '@:driver-shim /effort low',
          '@:driver-shim /model claude-sonnet-5[1m]',
        ]);
      });

      then('the bucket shows `choice =` and `effort =` as peers beneath a bare `brain`', () => {
        expect(res.cli.stdout).toContain(
          asBucketRows({ brain: 'claude-sonnet-5[1m]', effort: 'low' }),
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] the brainless 4.polish is current', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: ['1.vision', '2.criteria', '3.plan'] });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 4 }) };
      });

      then('NO say is sent — a carry is never a fresh switch', () => {
        expect(res.says).toHaveLength(4);
      });

      then('the bucket names the INHERITED brain and effort', () => {
        // 🔴 .why = case=7: "why is this stone expensive?" is answered here, by the brain and
        //    the effort 3.plan dispatched — a real record, never a seeded one
        expect(res.cli.stdout).toContain(
          asBucketRows({ brain: 'claude-sonnet-5[1m]', effort: 'low' }),
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] 5.ship declares both, and the driver is UNENROLLED', () => {
      const res = useThen('the drive answers, on two surfaces', async () => {
        await setPassage({
          scene,
          passed: ['1.vision', '2.criteria', '3.plan', '4.polish'],
        });
        await setMode({ scene, mode: 'unenrolled' });
        const direct = await drive({ scene });
        const onBoot = await drive({ scene, when: 'hook.onBoot' });
        return { direct, onBoot, says: await getSays({ scene, count: 4 }) };
      });

      then('NO say is sent — no address was confirmed', () => {
        expect(res.says).toHaveLength(4);
      });

      then('the halt still shows the effort it could not apply', () => {
        // 🔴 .why = a halt that dropped the effort would under-report what the guard asked for
        expect(res.direct.stdout).toContain(
          asBucketRows({ brain: 'claude-haiku-4-5', effort: 'medium' }),
        );
        expect(res.direct.stdout).toContain(HALT);
        expect(res.direct.stdout).toContain('rhx enroll');
      });

      then('the halt reads the same on the onBoot surface', () => {
        expect(res.onBoot.stdout).toContain('effort = medium');
        expect(res.onBoot.stdout).toContain(HALT);
      });

      then('stdout has good vibes, on the direct surface', () => {
        expect(sanitizeTimeForSnapshot(res.direct.stdout)).toMatchSnapshot();
      });

      then('stdout has good vibes, on the onBoot surface', () => {
        expect(sanitizeTimeForSnapshot(res.onBoot.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] the carry rules across the two axes', () => {
    /**
     * .what = each carry the record can make, walked in order
     *
     *    | step | stone      | the guard declares | the clone then runs         |
     *    |------|------------|--------------------|-----------------------------|
     *    | t0   | 1.vision   | opus + high        | opus, high                  |
     *    | t1   | 2.criteria | naught             | opus, high — both carried   |
     *    | t2   | 3.plan     | sonnet alone       | sonnet, at its own default  |
     *    | t3   | 4.polish   | naught             | sonnet — NO effort carried  |
     *    | t4   | 5.ship     | low alone          | sonnet, low                 |
     *    | t5   | 6.close    | naught             | sonnet, low — slug carried  |
     *
     * .why = `S10` + `S12`: a level is model-scoped, so a `/model` ends it; a slug outlives
     *        an `/effort`. a bucket that showed `high` beside sonnet would name a level the
     *        clone no longer runs
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-carry',
        stonesExtra: ['4.polish', '5.ship', '6.close'],
        guards: {
          '1.vision': ['brain:', '  choice: claude-opus-5[1m]', '  effort: high'],
          '3.plan': ['brain: claude-sonnet-5[1m]'],
          '5.ship': ['brain:', '  effort: low'],
        },
      }),
    );

    const STEPS = [
      {
        label: '[t0] 1.vision declares opus and high',
        passed: [],
        says: 2,
        saysNew: [
          '@:driver-shim /effort high',
          '@:driver-shim /model claude-opus-5[1m]',
        ],
        bucket: { brain: 'claude-opus-5[1m]', effort: 'high' },
      },
      {
        label: '[t1] the brainless 2.criteria carries BOTH',
        passed: ['1.vision'],
        says: 2,
        saysNew: [],
        bucket: { brain: 'claude-opus-5[1m]', effort: 'high' },
      },
      {
        label: '[t2] 3.plan declares sonnet ALONE',
        passed: ['1.vision', '2.criteria'],
        says: 3,
        saysNew: ['@:driver-shim /model claude-sonnet-5[1m]'],
        bucket: { brain: 'claude-sonnet-5[1m]', effort: null },
      },
      {
        label: '[t3] the brainless 4.polish carries sonnet, and NO effort',
        passed: ['1.vision', '2.criteria', '3.plan'],
        says: 3,
        saysNew: [],
        bucket: { brain: 'claude-sonnet-5[1m]', effort: null },
      },
      {
        label: '[t4] 5.ship declares low ALONE',
        passed: ['1.vision', '2.criteria', '3.plan', '4.polish'],
        says: 4,
        saysNew: ['@:driver-shim /effort low'],
        bucket: { brain: null, effort: 'low' },
      },
      {
        label: '[t5] the brainless 6.close carries sonnet AND low',
        passed: ['1.vision', '2.criteria', '3.plan', '4.polish', '5.ship'],
        says: 4,
        saysNew: [],
        bucket: { brain: 'claude-sonnet-5[1m]', effort: 'low' },
      },
    ];

    // 🔴 .note = the steps build on ONE record, so each `useThen` waits on the prior's say count
    //    — the walk order is the jest declaration order, sequential by construction
    const saysBefore = [0, 2, 2, 3, 3, 4];
    STEPS.forEach((step, index) => {
      when(step.label, () => {
        const res = useThen('the drive answers', async () => {
          await setPassage({ scene, passed: step.passed });
          const cli = await drive({ scene });
          return { cli, says: await getSays({ scene, count: step.says }) };
        });

        then('the clone receives exactly the new says', () => {
          expect(res.says.slice(saysBefore[index]).sort()).toEqual(
            step.saysNew,
          );
        });

        then('the bucket names what the clone now runs', () => {
          expect(res.cli.stdout).toContain(asBucketRows(step.bucket));
          if (!step.bucket.effort)
            expect(res.cli.stdout).not.toContain('effort =');
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    });
  });

  given('[case3] each shape a `brain:` declaration can take', () => {
    /**
     * .what = one stone per declaration shape, on one opted-in route
     *
     *    | stone      | the guard says                     | read as           |
     *    |------------|------------------------------------|-------------------|
     *    | 1.vision   | `brain: "claude-opus-5[1m]"`       | the choice, unquoted |
     *    | 2.criteria | `brain: 'claude-sonnet-5` (unclosed) | dropped → carry |
     *    | 3.plan     | `model: claude-sonnet-5`           | dropped → carry   |
     *    | 4.polish   | `brian: claude-sonnet-5`           | dropped → carry   |
     *    | 5.ship     | `brain:` with naught beneath       | dropped → carry   |
     *    | 6.close    | `choice: claude-haiku-4-5` + `efort: high` | the choice; the typo dropped |
     *
     * 🔴 .why = a dropped value must CARRY, never dispatch a fabricated slug — an unclosed
     *    quote put on the wire would read `requested` and look like a healthy switch (F5)
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-declare',
        stonesExtra: ['4.polish', '5.ship', '6.close'],
        guards: {
          '1.vision': ['brain: "claude-opus-5[1m]"'],
          '2.criteria': [`brain: 'claude-sonnet-5`],
          '3.plan': ['model: claude-sonnet-5'],
          '4.polish': ['brian: claude-sonnet-5'],
          '5.ship': ['brain:'],
          '6.close': ['brain:', '  choice: claude-haiku-4-5', '  efort: high'],
        },
      }),
    );

    const STONES = [
      '1.vision',
      '2.criteria',
      '3.plan',
      '4.polish',
      '5.ship',
      '6.close',
    ];
    const STEPS = [
      {
        label: '[t0] a QUOTED inline choice',
        says: ['@:driver-shim /model claude-opus-5[1m]'],
        brain: 'claude-opus-5[1m]',
      },
      {
        label: '[t1] an UNCLOSED quote — dropped, the prior brain carries',
        says: [],
        brain: 'claude-opus-5[1m]',
      },
      {
        label: '[t2] the `model:` alias — dropped, the prior brain carries',
        says: [],
        brain: 'claude-opus-5[1m]',
      },
      {
        label: '[t3] the `brian:` typo — dropped, the prior brain carries',
        says: [],
        brain: 'claude-opus-5[1m]',
      },
      {
        label: '[t4] an EMPTY `brain:` — dropped, the prior brain carries',
        says: [],
        brain: 'claude-opus-5[1m]',
      },
      {
        label: '[t5] a sub-key typo beside a choice — the choice alone lands',
        says: ['@:driver-shim /model claude-haiku-4-5'],
        brain: 'claude-haiku-4-5',
      },
    ];

    STEPS.forEach((step, index) => {
      when(step.label, () => {
        const saysBefore = STEPS.slice(0, index).flatMap((s) => s.says).length;
        const res = useThen('the drive answers', async () => {
          await setPassage({ scene, passed: STONES.slice(0, index) });
          const cli = await drive({ scene });
          return {
            cli,
            says: await getSays({
              scene,
              count: saysBefore + step.says.length,
            }),
          };
        });

        then('the clone receives exactly the says the shape earns', () => {
          expect(res.says.slice(saysBefore)).toEqual(step.says);
        });

        then('the bucket names the brain the clone runs, and no effort', () => {
          expect(res.cli.stdout).toContain(`└─ brain = ${step.brain}`);
          expect(res.cli.stdout).not.toContain('effort =');
          expect(res.cli.stdout).not.toContain(HALT);
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    });
  });

  given(
    '[case4] a route whose EVERY `brain:` declaration is malformed',
    () => {
      /**
       * .what = the same route twice — once with malformed brain keys, once with no guard at all
       * .why = case=10's guarantee has the largest blast radius here: a route that never
       *        DECLARED a readable brain must drive byte-identically to one that never tried
       */
      const scenes = useBeforeAll(async () => ({
        malformed: await genBrainRoute({
          slug: 'brain-journey-malformed',
          stonesExtra: [],
          guards: {
            '1.vision': ['model: claude-opus-5[1m]'],
            '2.criteria': ['brian: claude-opus-5[1m]'],
            '3.plan': ['brain:'],
          },
        }),
        bare: await genBrainRoute({
          slug: 'brain-journey-bare',
          stonesExtra: [],
          guards: {},
        }),
      }));

      when('[t0] both routes are driven at 1.vision', () => {
        const res = useThen('the drives answer', async () => ({
          malformed: await drive({ scene: scenes.malformed }),
          bare: await drive({ scene: scenes.bare }),
          says: await getSays({ scene: scenes.malformed, count: 0 }),
        }));

        then('the two stdouts are byte-identical', () => {
          expect(res.malformed.stdout).toEqual(res.bare.stdout);
        });

        then('no brain row, no halt, and no say', () => {
          expect(res.malformed.stdout).not.toContain('brain');
          expect(res.malformed.stdout).not.toContain(HALT);
          expect(res.says).toEqual([]);
        });

        then('stdout has good vibes', () => {
          expect(
            sanitizeTimeForSnapshot(res.malformed.stdout),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case5] every answer the clone can give', () => {
    /**
     * .what = one stone that declares a choice and an effort, driven once per clone answer
     * .why = seven halt causes, each with its own diagnosis and fix; plus the two answers that
     *        LAND — a say the clone refuses, and a clone known by its serial alone
     *
     * .note = a failed switch releases its claim and records naught, so each halt step drives
     *         the same stone afresh. the two landed steps close the case, a claim expiry apart
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-clone',
        stonesExtra: [],
        guards: {
          '1.vision': ['brain:', '  choice: claude-haiku-4-5', '  effort: medium'],
        },
      }),
    );

    const HALTS = [
      {
        label: '[t0] `whoami` exits 2 — the driver is unenrolled',
        mode: 'unenrolled',
        live: 'unknown — no clone address was confirmed',
        fix: 'rhx enroll claude --as @:driver --roles driver',
      },
      {
        label: '[t1] `whoami` exits 1 — the clone is broken',
        mode: 'broken',
        live: 'unknown — the clone probe could not be read',
        fix: 'rhx clone whoami --output json',
      },
      {
        label: '[t2] `rhx` is absent — the probe cannot spawn',
        mode: 'absent',
        live: 'unknown — the clone probe could not be read',
        fix: 'rhx clone whoami --output json',
      },
      {
        label: '[t3] `whoami` writes prose where json was owed',
        mode: 'garbage',
        live: 'unknown — the clone probe wrote no readable json',
        fix: 'rhx clone whoami --output json',
      },
      {
        label: '[t4] `whoami` answers json with no address',
        mode: 'noaddress',
        live: 'unknown — the clone payload carried no address',
        fix: 'rhx clone whoami --output json',
      },
      {
        label: '[t5] `whoami` dies by a signal',
        mode: 'killed',
        live: 'unknown — the clone probe was terminated',
        fix: 'rhx clone whoami --output json',
      },
      {
        label: '[t6] `whoami` outlives the 10s cap',
        mode: 'slow',
        live: 'unknown — the clone probe did not answer in time',
        fix: 'rhx enroll claude --as @:driver --roles driver',
      },
      {
        label: '[t7] the address is confirmed, and `clone say` cannot launch',
        mode: 'saybreak',
        live: 'unknown — the switch was never submitted',
        fix: 'npm ci',
      },
    ];

    HALTS.forEach((step) => {
      when(step.label, () => {
        const res = useThen('the drive answers', async () => {
          await setMode({
            scene,
            mode: step.mode === 'absent' ? null : step.mode,
          });
          const rhxPath = path.join(scene.binDir, 'rhx');
          if (step.mode === 'absent')
            await fs.rename(rhxPath, `${rhxPath}.away`);
          const cli = await drive({ scene });
          if (step.mode === 'absent')
            await fs.rename(`${rhxPath}.away`, rhxPath);
          return { cli, says: await getSays({ scene, count: 0 }) };
        });

        then('NO say reaches the clone', () => {
          expect(res.says).toEqual([]);
        });

        then('the halt names this cause, and its own fix', () => {
          expect(res.cli.stdout).toContain(HALT);
          expect(res.cli.stdout).toContain(`this driver runs = ${step.live}`);
          expect(res.cli.stdout).toContain(`└─ ${step.fix}`);
        });

        then('the halt still names the prescription it could not apply', () => {
          expect(res.cli.stdout).toContain(
            asBucketRows({ brain: 'claude-haiku-4-5', effort: 'medium' }),
          );
        });

        then('the unswitched stone never reads as ready', () => {
          expect(res.cli.stdout).not.toContain('--as passed');
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    });

    when('[t8] each `clone say` exits non-zero after it records', () => {
      const res = useThen('the drive answers', async () => {
        await setMode({ scene, mode: 'sayfails' });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 2 }) };
      });

      then('both says were submitted', () => {
        expect(res.says.sort()).toEqual([
          '@:driver-shim /effort medium',
          '@:driver-shim /model claude-haiku-4-5',
        ]);
      });

      then('the drive reads it as REQUESTED — a refusal is unseen (case=3)', () => {
        // 🔴 .why = the dispatch is fire-and-forget; the wisher deferred a read of the reply
        //    until `clone whoami` reports the live brain (S6). this pins the accepted residual
        expect(res.cli.stdout).not.toContain(HALT);
        expect(res.cli.stdout).toContain('--as passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t9] `whoami` names the clone by its SERIAL alone', () => {
      const res = useThen('the drive answers', async () => {
        await setMode({ scene, mode: 'serialonly' });
        await setClaimExpired({ scene });
        const cli = await drive({ scene });
        return { cli, says: await getSays({ scene, count: 4 }) };
      });

      then('the says address the serial — a blank slug is no address', () => {
        expect(res.says.slice(2).sort()).toEqual([
          '@:s7 /effort medium',
          '@:s7 /model claude-haiku-4-5',
        ]);
      });

      then('the switch lands, and the stone reads as ready', () => {
        expect(res.cli.stdout).not.toContain(HALT);
        expect(res.cli.stdout).toContain('--as passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case6] the dispatch cadence, per surface', () => {
    /**
     * .what = one brain stone, driven on each surface, inside and past the claim window
     *
     *    | step | surface | the window | says | why                                        |
     *    |------|---------|------------|------|--------------------------------------------|
     *    | t0   | onStop  | —          | +2   | the ENTRY tick dispatches                  |
     *    | t1   | onStop  | open       | +0   | a later tick of the same stone never does  |
     *    | t2   | direct  | open       | +0   | the claim holds one switch per window      |
     *    | t3   | onBoot  | open       | +0   | the claim holds on boot too                |
     *    | t4   | onBoot  | expired    | +2   | a boot ALWAYS re-asserts — a resumed session |
     *    | t5   | direct  | expired    | +2   | a direct drive re-asserts, once per window |
     *    | t6   | onStop  | expired    | +0   | onStop re-dispatches on entry alone        |
     *
     * 🔴 .why t1-t3 = a skipped tick still NAMES the brain that landed (S12 parity). it once
     *    rendered `none`, so the second look at a brain stone read like a stone with no brain
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-cadence',
        stonesExtra: [],
        guards: {
          '1.vision': ['brain:', '  choice: claude-opus-5[1m]', '  effort: high'],
        },
      }),
    );
    const BUCKET = asBucketRows({ brain: 'claude-opus-5[1m]', effort: 'high' });

    const STEPS: Array<{
      label: string;
      when: 'hook.onStop' | 'hook.onBoot' | undefined;
      expire: boolean;
      says: number;
    }> = [
      { label: '[t0] onStop, the entry tick', when: 'hook.onStop', expire: false, says: 2 },
      { label: '[t1] onStop, a second tick', when: 'hook.onStop', expire: false, says: 2 },
      { label: '[t2] direct, inside the window', when: undefined, expire: false, says: 2 },
      { label: '[t3] onBoot, inside the window', when: 'hook.onBoot', expire: false, says: 2 },
      { label: '[t4] onBoot, past the window', when: 'hook.onBoot', expire: true, says: 4 },
      { label: '[t5] direct, past the window', when: undefined, expire: true, says: 6 },
      { label: '[t6] onStop, past the window', when: 'hook.onStop', expire: true, says: 6 },
    ];

    STEPS.forEach((step) => {
      when(step.label, () => {
        const res = useThen('the drive answers', async () => {
          if (step.expire) await setClaimExpired({ scene });
          const cli = await drive({ scene, when: step.when });
          return { cli, says: await getSays({ scene, count: step.says }) };
        });

        then(`the clone has received ${step.says} says in all`, () => {
          expect(res.says).toHaveLength(step.says);
        });

        then('the bucket names the brain and effort, dispatched or not', () => {
          expect(res.cli.stdout).toContain(BUCKET);
          expect(res.cli.stdout).not.toContain(HALT);
        });

        if (step.when === 'hook.onStop')
          then('the stop is blocked — the stone is unpassed', () => {
            expect(res.cli.code).toEqual(2);
          });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    });
  });

  given('[case7] an unenrolled driver, on consecutive onStop ticks', () => {
    /**
     * .what = the halt on every tick, then the self-heal once the driver enrolls
     * .why = `S8`: a safety gate halts EVERY time, never once-then-quiet. and a failed switch
     *        records naught, so a mid-session `rhx enroll` lands on the very next tick
     *
     * 🔴 .note = t1 is the regression clamp: the block counter rewrites `state.stone` every
     *    tick, and while that field gated the dispatch, the second tick read as not-an-entry —
     *    no retry, no halt, and no brain row
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-heal',
        stonesExtra: [],
        guards: {
          '1.vision': ['brain:', '  choice: claude-opus-5[1m]', '  effort: high'],
        },
      }),
    );

    [
      { label: '[t0] the first tick', mode: 'unenrolled', says: 0 },
      { label: '[t1] the second tick', mode: 'unenrolled', says: 0 },
      { label: '[t2] the third tick', mode: 'unenrolled', says: 0 },
    ].forEach((step) => {
      when(step.label, () => {
        const res = useThen('the hook answers', async () => {
          await setMode({ scene, mode: step.mode });
          const cli = await drive({ scene, when: 'hook.onStop' });
          return { cli, says: await getSays({ scene, count: step.says }) };
        });

        then('the halt renders, with the prescription', () => {
          expect(res.cli.stdout).toContain(HALT);
          expect(res.cli.stdout).toContain(
            asBucketRows({ brain: 'claude-opus-5[1m]', effort: 'high' }),
          );
          expect(res.says).toEqual([]);
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
        });
      });
    });

    when('[t3] the driver enrolls, and the next tick runs', () => {
      const res = useThen('the hook answers', async () => {
        await setMode({ scene, mode: null });
        const cli = await drive({ scene, when: 'hook.onStop' });
        return { cli, says: await getSays({ scene, count: 2 }) };
      });

      then('the switch lands at once — no reboot, no re-entry', () => {
        expect(res.says.sort()).toEqual([
          '@:driver-shim /effort high',
          '@:driver-shim /model claude-opus-5[1m]',
        ]);
        expect(res.cli.stdout).not.toContain(HALT);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case8] brainless stones with naught to inherit', () => {
    /**
     * .what = an opted-in route whose record is empty — before its first brain stone, and
     *         after a brain stone that halted
     * .why = a halted switch submitted no brain, so an attribution would name a brain never
     *        sent (`rule.forbid.failhide`); the row must drop, never guess
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-naught',
        stonesExtra: [],
        guards: {
          '2.criteria': ['brain:', '  choice: claude-opus-5[1m]', '  effort: high'],
        },
      }),
    );

    when('[t0] the brainless FIRST stone, before any switch', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: [] });
        return { cli: await drive({ scene }) };
      });

      then('no brain row — no switch has landed on this route', () => {
        expect(res.cli.stdout).not.toContain('brain');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] the brain stone, with the driver unenrolled', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: ['1.vision'] });
        await setMode({ scene, mode: 'unenrolled' });
        return { cli: await drive({ scene }) };
      });

      then('the halt renders', () => {
        expect(res.cli.stdout).toContain(HALT);
      });
    });

    when('[t2] the brainless stone AFTER the halted one', () => {
      const res = useThen('the drive answers', async () => {
        await setPassage({ scene, passed: ['1.vision', '2.criteria'] });
        return {
          cli: await drive({ scene }),
          says: await getSays({ scene, count: 0 }),
        };
      });

      then('no brain row — the halted switch sent naught to carry', () => {
        expect(res.cli.stdout).not.toContain('brain');
        expect(res.says).toEqual([]);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case9] a brain halt above a route halt', () => {
    /**
     * .what = the driver walled the brain stone with `--as blocked`, and is also unenrolled
     * .why = the brain halt STACKS as the first branch of the route halt's own tree — one owl,
     *        one root — so a human who comes to fix the wall also learns the brain never landed
     */
    const scene = useBeforeAll(() =>
      genBrainRoute({
        slug: 'brain-journey-stack',
        stonesExtra: [],
        guards: {
          '1.vision': ['brain:', '  choice: claude-opus-5[1m]', '  effort: high'],
        },
      }),
    );

    when('[t0] the hook runs, on both surfaces', () => {
      const res = useThen('the hooks answer', async () => {
        await setPassage({ scene, passed: [], blocked: '1.vision' });
        await setMode({ scene, mode: 'unenrolled' });
        return {
          onStop: await drive({ scene, when: 'hook.onStop' }),
          onBoot: await drive({ scene, when: 'hook.onBoot' }),
        };
      });

      then('the brain halt precedes the route halt, in one tree', () => {
        const stdout = res.onStop.stdout;
        // a `├─` elbow = the brain halt is NOT the tree's last branch; the route halt follows
        expect(stdout).toContain(`   ├─ ${HALT}`);
        expect(stdout.split('🗿')).toHaveLength(2);
        expect(stdout.split('🦉')).toHaveLength(2);
      });

      then('both surfaces render the stack alike', () => {
        expect(res.onBoot.stdout).toEqual(res.onStop.stdout);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(res.onStop.stdout)).toMatchSnapshot();
      });
    });
  });
});
