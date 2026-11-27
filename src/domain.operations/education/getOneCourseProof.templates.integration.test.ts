import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { emitEducationRefusal } from '@src/contract/cli/emitEducationRefusal';

import { genBootClaimsBefore } from './genBootClaimsBefore';
import { getOneCourseProof } from './getOneCourseProof';
import type { EducationRole } from './getOneEducationRole';

const TEMPLATES_DIR = path.join(__dirname, 'course', 'templates');

/**
 * .what = whether a line belongs to a stone's example yield: a table line, a blank, or `key = value`
 */
const isExampleLine = (input: { line: string }): boolean =>
  input.line.trim() === '' ||
  input.line.trim().startsWith('|') ||
  /^[a-z][a-z ]* = \S/.test(input.line.trim());

/**
 * .what = the example yield a stone shows after its `emit into …yield.md` line; null if none
 * .why = the stone text is what a driver copies; this test feeds that text to the reader, so a
 *        template edit that the reader cannot read turns the suite red
 */
const asStoneYieldExample = (input: { stone: string }): string | null => {
  const lines = input.stone.split('\n');
  const emit = lines.findIndex((line) => /^emit into .*\.yield\.md/.test(line));
  if (emit === -1) return null;
  const tail = lines.slice(emit + 1);
  const end = tail.findIndex((line) => !isExampleLine({ line }));
  const block = (end === -1 ? tail : tail.slice(0, end)).join('\n').trim();
  return block.includes('|') ? `${block}\n` : null;
};

/**
 * .what = a native role with no boot spec, rooted in a temp repo: its briefs need only exist
 */
const ROLE_NATIVE: EducationRole = {
  slug: 'mechanic',
  kind: 'native',
  repo: '.this',
  briefsDir: '.agent/repo=.this/role=mechanic/briefs',
  skillsDir: '.agent/repo=.this/role=mechanic/skills',
  bootPath: '.agent/repo=.this/role=mechanic/boot.yml',
};

/**
 * .what = a temp repo with one course whose yields are the examples its stones show
 */
const genSceneOfTemplates = (input: { slug: string }) => {
  const repoRoot = genTempDir({ slug: input.slug });
  const pursuitRoute = path.join(repoRoot, '.route', 'pursuit');
  const route = path.join(
    pursuitRoute,
    '2.courses.pursue.yield',
    'course=1.idempotency',
  );
  mkdirSync(route, { recursive: true });
  writeFileSync(
    path.join(pursuitRoute, '1.courses.plot.yield.md'),
    '| k | course | subject | builds on |\n|---|---|---|---|\n| 1 | idempotency | converge | — |\n',
  );
  readdirSync(TEMPLATES_DIR)
    .filter((name) => name.endsWith('.stone'))
    .forEach((name) => {
      const example = asStoneYieldExample({
        stone: readFileSync(path.join(TEMPLATES_DIR, name), 'utf-8'),
      });
      if (example)
        writeFileSync(
          path.join(route, name.replace(/\.stone$/, '.yield.md')),
          example.replace(/\$BRIEFS_DIR/g, ROLE_NATIVE.briefsDir),
        );
    });

  // the brief the entool example names, written where the role holds it
  const briefPath = path.join(
    ROLE_NATIVE.briefsDir,
    'rule.require.idempotency-key-at-external-boundaries.md',
  );
  mkdirSync(path.join(repoRoot, ROLE_NATIVE.briefsDir), { recursive: true });
  writeFileSync(path.join(repoRoot, briefPath), '# rule\n');
  return { repoRoot, pursuitRoute, route, briefPath };
};

/**
 * .what = the proof read of the one course of a scene
 */
const getOneProofOfScene = (input: {
  scene: ReturnType<typeof genSceneOfTemplates>;
  role: EducationRole;
}) =>
  getOneCourseProof({
    course: {
      route: input.scene.route,
      ordinal: 1,
      slug: 'idempotency',
      exited: true,
    },
    pursuitRoute: input.scene.pursuitRoute,
    repoRoot: input.scene.repoRoot,
    role: input.role,
  });

/**
 * .what = a refusal as a student sees it at exit: the stderr render, temp paths masked
 */
const asRefusalStderr = (input: { error: unknown }): string => {
  if (!(input.error instanceof ConstraintError)) throw input.error;
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  emitEducationRefusal({ error: input.error });
  const stderr = spy.mock.calls.map((call) => String(call[0])).join('\n');
  spy.mockRestore();
  return stderr.replace(/\S*\/\.route\/pursuit\//g, '$REPO/.route/pursuit/');
};

describe('getOneCourseProof, fed the course templates own examples', () => {
  given(
    '[case1] a course whose yields are the examples its stones show',
    () => {
      const scene = useBeforeAll(async () =>
        genSceneOfTemplates({ slug: 'test-course-templates' }),
      );

      when('[t0] the reader reads the course', () => {
        then('every shape the pedigree reads is read from the examples', () => {
          const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
          expect(proof.outcome).toEqual({
            baseline: '1/3',
            after: '3/3',
            transfer: 'passed',
          });
          expect(proof.greats).toEqual(['helland']);
          expect(proof.claims).toEqual([
            {
              claim: 'k1 natural-key upsert dedupes a replay',
              verdict: 'held',
            },
            {
              claim: 'k7 backoff alone makes a write safe',
              verdict: 'refuted',
            },
          ]);
          expect(proof.yields).toEqual([
            { path: scene.briefPath, kind: 'brief', boot: 'say' },
          ]);
        });
      });
    },
  );

  given('[case2] a course whose yields the reader must refuse', () => {
    /**
     * .what = the refusal the reader raises once a scene is damaged
     * .why = every refusal is snapped, named by its scene, as a student sees it at `course exit`
     */
    const getOneRefusal = async (input: {
      slug: string;
      damage: (scene: ReturnType<typeof genSceneOfTemplates>) => void;
      role?: EducationRole;
    }) => {
      const scene = genSceneOfTemplates({ slug: input.slug });
      input.damage(scene);
      const error = await getError(async () =>
        getOneProofOfScene({ scene, role: input.role ?? ROLE_NATIVE }),
      );
      expect(asRefusalStderr({ error })).toMatchSnapshot(input.slug);
      return error;
    };

    when('[t0] a yield is absent', () => {
      then('it refuses, and names a drive or an edit in place', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-absent',
          damage: (scene) =>
            rmSync(path.join(scene.route, '5.1.outcome.assess.yield.md')),
        });
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain(
          'the yield of 5.1.outcome.assess is absent',
        );
        expect(error.message).toContain(
          'in place, in the shape 5.1.outcome.assess shows, then re-run',
        );
      });

      then(
        'it renders as a student sees it at exit, as the snapshot shows',
        async () => {
          const error = await getOneRefusal({
            slug: 'test-proof-absent-render',
            damage: (scene) =>
              rmSync(path.join(scene.route, '5.1.outcome.assess.yield.md')),
          });
          const stderr = asRefusalStderr({ error });
          expect(stderr).toContain('└─ fix: edit ');
          expect(stderr).not.toContain('drive it');
          expect(stderr).toMatchSnapshot();
        },
      );
    });

    when('[t1] a yield lacks its table', () => {
      then('it refuses, and names the columns owed', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-table',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '3.practice.vitro.yield.md'),
              'no table here\n',
            ),
        });
        expect(error.message).toContain(
          'a course yield lacks the table the pedigree reads',
        );
        expect(error.message).toContain('| claim | verdict |');
      });
    });

    when('[t2] a yield lacks its score line', () => {
      then('it refuses, and names the line owed', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-line',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '1.2.outcome.baseline.yield.md'),
              '| task | result | note |\n|---|---|---|\n| t1 | failed | x |\n',
            ),
        });
        expect(error.message).toContain('lacks its `score = …` line');
      });
    });

    when('[t3] a score is no n/m', () => {
      then('it refuses', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-score',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '1.2.outcome.baseline.yield.md'),
              'score = banana\n',
            ),
        });
        expect(error.message).toContain('a score that is no n/m');
      });
    });

    when('[t9] the assess is below the bar', () => {
      then(
        'a failed transfer refuses, and names the phase to return to',
        async () => {
          const error = await getOneRefusal({
            slug: 'test-proof-transfer-failed',
            damage: (scene) =>
              writeFileSync(
                path.join(scene.route, '5.1.outcome.assess.yield.md'),
                '| task | result | note |\n|---|---|---|\n| t1 | passed | x |\n\nscore = 3/3\ntransfer = failed\n',
              ),
          });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('the assess is below the bar');
          expect(error.message).toContain('return to the weakest phase');
        },
      );
      then('a task short of its bar refuses', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-score-short',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '5.1.outcome.assess.yield.md'),
              '| task | result | note |\n|---|---|---|\n| t1 | failed | x |\n\nscore = 2/3\ntransfer = passed\n',
            ),
        });
        expect(error.message).toContain('the assess is below the bar');
      });
    });

    when('[t10] the outcome cannot show a move', () => {
      then(
        'an assess over a different task count refuses, with both scores named',
        async () => {
          const error = await getOneRefusal({
            slug: 'test-proof-totals',
            damage: (scene) =>
              writeFileSync(
                path.join(scene.route, '5.1.outcome.assess.yield.md'),
                '| task | result | note |\n|---|---|---|\n| t1 | passed | x |\n\nscore = 4/4\ntransfer = passed\n',
              ),
          });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'the baseline and the assess score a different number of tasks',
          );
          expect(error.message).toContain('1/3');
          expect(error.message).toContain('4/4');
        },
      );
      then('a baseline already at the bar refuses', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-baseline-full',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '1.2.outcome.baseline.yield.md'),
              '| task | result | note |\n|---|---|---|\n| t1 | passed | x |\n\nscore = 3/3\n',
            ),
        });
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('the baseline already sits at the bar');
        expect(error.message).toContain('pick tasks the role fails today');
        expect(error.message).toContain(
          'rhx route.stone.set --stone 1.1.outcome.declare --as rewound',
        );
        expect(error.message).not.toContain('plot');
        expect(asRefusalStderr({ error })).toMatchSnapshot();
      });
      then('the baseline stone says to stop at a score at the bar', () => {
        const stone = readFileSync(
          path.join(TEMPLATES_DIR, '1.2.outcome.baseline.stone'),
          'utf-8',
        );
        expect(stone).toContain('score at the bar (n/n)? stop here');
        expect(stone).toContain(
          'rhx route.stone.set --stone 1.1.outcome.declare --as rewound',
        );
      });
    });

    when('[t4] a claim holds a verdict the stone does not define', () => {
      then('it refuses, with the verdicts allowed', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-verdict',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '3.practice.vitro.yield.md'),
              '| claim | verdict | evidence |\n|---|---|---|\n| k1 x | partial | y |\n',
            ),
        });
        expect(error.message).toContain('an unknown verdict');
        expect(error.message).toContain('held, refuted, untested');
      });
    });

    when('[t5] an entool row cites an artifact never written', () => {
      then('it refuses, with the path named', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-artifact',
          damage: (scene) => rmSync(path.join(scene.repoRoot, scene.briefPath)),
        });
        expect(error.message).toContain(
          'a course yield cites an artifact the role does not hold',
        );
        expect(error.message).toContain('rule.require.idempotency-key');
      });
    });

    when('[t11] a blueprint row rests on a refuted claim', () => {
      then('it refuses, and names the row and the claim', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-refuted',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.route, '4.1.entool.blueprint.yield.md'),
              '| path | kind | claims | serves |\n|---|---|---|---|\n| rule.require.idempotency-key-at-external-boundaries.md | brief | k1, k7 | t1 |\n',
            ),
        });
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain(
          'a blueprint row rests on a claim the practice did not hold',
        );
        expect(error.message).toContain(
          'rule.require.idempotency-key-at-external-boundaries.md rests on k7 (refuted)',
        );
      });
    });

    when(
      '[t12] a blueprint row cites a claim the practice never tested',
      () => {
        then('it refuses, and names the claim', async () => {
          const error = await getOneRefusal({
            slug: 'test-proof-untested-id',
            damage: (scene) =>
              writeFileSync(
                path.join(scene.route, '4.1.entool.blueprint.yield.md'),
                '| path | kind | claims | serves |\n|---|---|---|---|\n| rule.require.idempotency-key-at-external-boundaries.md | brief | k2 | t1 |\n',
              ),
          });
          expect(error.message).toContain(
            'rests on k2 (not in the vitro table)',
          );
        });
      },
    );

    when(
      '[t13] the entool writes an artifact the blueprint did not plan',
      () => {
        then('it refuses, and names the path', async () => {
          const error = await getOneRefusal({
            slug: 'test-proof-unplanned',
            damage: (scene) =>
              writeFileSync(
                path.join(scene.route, '4.1.entool.blueprint.yield.md'),
                '| path | kind | claims | serves |\n|---|---|---|---|\n| rule.require.other.md | brief | k1 | t1 |\n',
              ),
          });
          expect(error.message).toContain(
            'a course yield writes an artifact the blueprint did not plan',
          );
          expect(error.message).toContain(
            'rule.require.idempotency-key-at-external-boundaries.md',
          );
        });
      },
    );

    when('[t6] a role with a boot spec does not name the brief', () => {
      then('it refuses, and names the boot spec', async () => {
        const error = await getOneRefusal({
          slug: 'test-proof-unbooted',
          damage: (scene) =>
            writeFileSync(
              path.join(scene.repoRoot, ROLE_NATIVE.bootPath),
              'always:\n  briefs:\n    say:\n      - briefs/other.md\n',
            ),
        });
        expect(error.message).toContain(
          'a course yield cites a brief the boot spec does not name',
        );
        expect(error.message).toContain(ROLE_NATIVE.bootPath);
      });
    });

    when('[t8] a linked mod adds a skill its spec does not name', () => {
      then('it refuses, since rhachet refuses such a mod', async () => {
        const modDir = '.agent/repo=.mods/role=mechanic';
        const roleLinked: EducationRole = {
          slug: 'mechanic',
          kind: 'linked',
          repo: 'ehmpathy',
          briefsDir: `${modDir}/briefs`,
          skillsDir: `${modDir}/skills`,
          bootPath: `${modDir}/boot.yml`,
        };
        const error = await getOneRefusal({
          slug: 'test-proof-skill-unnamed',
          role: roleLinked,
          damage: (scene) => {
            mkdirSync(path.join(scene.repoRoot, modDir, 'briefs'), {
              recursive: true,
            });
            mkdirSync(path.join(scene.repoRoot, modDir, 'skills'), {
              recursive: true,
            });
            writeFileSync(
              path.join(scene.repoRoot, modDir, 'briefs', 'r.md'),
              '# r\n',
            );
            writeFileSync(
              path.join(scene.repoRoot, modDir, 'skills', 's.sh'),
              '#!/bin/sh\n',
            );
            writeFileSync(
              path.join(scene.repoRoot, modDir, 'boot.yml'),
              'of: ehmpathy/mechanic\nbriefs:\n  say:\n    - briefs/r.md\n',
            );
            writeFileSync(
              path.join(scene.route, '4.2.entool.execute.yield.md'),
              `| path | kind | boot |\n|---|---|---|\n| ${modDir}/briefs/r.md | brief | say |\n| ${modDir}/skills/s.sh | skill | say |\n`,
            );
          },
        });
        expect(error.message).toContain(
          'a course yield cites a skill the mod boot spec does not name',
        );
        expect(error.message).toContain('skills.<say|ref>');
      });
    });

    when('[t7] the boot spec names the brief under its row key', () => {
      then('the read passes', async () => {
        const scene = genSceneOfTemplates({ slug: 'test-proof-booted' });
        writeFileSync(
          path.join(scene.repoRoot, ROLE_NATIVE.bootPath),
          'always:\n  briefs:\n    say:\n      - briefs/rule.require.idempotency-key-at-external-boundaries.md\n',
        );
        const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
        expect(proof.yields).toHaveLength(1);
      });
    });

    when('[t14] the table rows a brief and its `.md.min` peer', () => {
      /**
       * .what = the scene, with the `.min` peer written and rowed beside the `.md`
       */
      const genSceneOfMinPeer = (input: { slug: string; rows: string[] }) => {
        const scene = genSceneOfTemplates({ slug: input.slug });
        writeFileSync(
          path.join(scene.repoRoot, `${scene.briefPath}.min`),
          '#\n',
        );
        writeFileSync(
          path.join(scene.route, '4.2.entool.execute.yield.md'),
          `| path | kind | boot |\n|---|---|---|\n${input.rows.join('\n')}\n`,
        );
        return scene;
      };

      then(
        'the pair folds into one brief, and a spec that names the `.md` passes',
        async () => {
          const scene = genSceneOfMinPeer({
            slug: 'test-proof-min-pair',
            rows: [
              `| ${ROLE_NATIVE.briefsDir}/rule.require.idempotency-key-at-external-boundaries.md | brief | say |`,
              `| ${ROLE_NATIVE.briefsDir}/rule.require.idempotency-key-at-external-boundaries.md.min | brief | say |`,
            ],
          });
          writeFileSync(
            path.join(scene.repoRoot, ROLE_NATIVE.bootPath),
            'always:\n  briefs:\n    say:\n      - briefs/rule.require.idempotency-key-at-external-boundaries.md\n',
          );
          const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
          expect(proof.yields).toEqual([
            { path: scene.briefPath, kind: 'brief', boot: 'say' },
          ]);
        },
      );

      then('a `.min` row alone stands for its `.md`', async () => {
        const scene = genSceneOfMinPeer({
          slug: 'test-proof-min-alone',
          rows: [
            `| ${ROLE_NATIVE.briefsDir}/rule.require.idempotency-key-at-external-boundaries.md.min | brief | say |`,
          ],
        });
        const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
        expect(proof.yields).toEqual([
          { path: scene.briefPath, kind: 'brief', boot: 'say' },
        ]);
      });

      then('the entool stone says to row the `.md` only', () => {
        const stone = readFileSync(
          path.join(TEMPLATES_DIR, '4.2.entool.execute.stone'),
          'utf-8',
        );
        expect(stone).toContain('name and row the `.md` only');
      });
    });
  });

  given(
    '[case3] a native role with no boot spec, and two briefs it held before the course',
    () => {
      const BRIEFS_EXTANT = ['rule.require.a.md', 'rule.require.b.md'];
      const BRIEF_NEW =
        'briefs/rule.require.idempotency-key-at-external-boundaries.md';

      /**
       * .what = the scene, with the extant briefs and the record course init writes
       * .note = the record is taken before the student writes any spec, as course init takes it
       */
      const genSceneOfExtant = (input: { slug: string }) => {
        const scene = genSceneOfTemplates({ slug: input.slug });
        for (const name of BRIEFS_EXTANT)
          writeFileSync(
            path.join(scene.repoRoot, ROLE_NATIVE.briefsDir, name),
            `# ${name}\n`,
          );
        genBootClaimsBefore({
          repoRoot: scene.repoRoot,
          role: ROLE_NATIVE,
          route: scene.route,
        });
        return scene;
      };
      const setSpec = (input: {
        scene: ReturnType<typeof genSceneOfTemplates>;
        spec: string;
      }) =>
        writeFileSync(
          path.join(input.scene.repoRoot, ROLE_NATIVE.bootPath),
          input.spec,
        );
      const setEntoolRows = (input: {
        scene: ReturnType<typeof genSceneOfTemplates>;
        rows: string[];
      }) =>
        writeFileSync(
          path.join(input.scene.route, '4.2.entool.execute.yield.md'),
          `| path | kind | boot |\n|---|---|---|\n${input.rows.join('\n')}\n`,
        );

      when('[t0] the student writes no spec, as the 4.2 note says', () => {
        then('the proof passes, every brief still at say', () => {
          const scene = genSceneOfExtant({ slug: 'test-boot-kept-nospec' });
          const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
          expect(proof.yields).toEqual([
            { path: scene.briefPath, kind: 'brief', boot: 'say' },
          ]);
        });
      });

      when(
        '[t1] the student writes the stone first example, a subject spec with the new brief at say',
        () => {
          then(
            'it refuses: the extant briefs drop out of the boot',
            async () => {
              const scene = genSceneOfExtant({
                slug: 'test-boot-moved-subject',
              });
              setSpec({
                scene,
                spec: `always:\n  briefs:\n    say:\n      - ${BRIEF_NEW}\n`,
              });
              const error = await getError(async () =>
                getOneProofOfScene({ scene, role: ROLE_NATIVE }),
              );
              expect(error).toBeInstanceOf(ConstraintError);
              expect(error.message).toContain(
                'the boot spec moves briefs the role booted before the course',
              );
              expect(error.message).toContain(
                'briefs/rule.require.a.md (say → none)',
              );
              expect(error.message).toContain(
                'briefs/rule.require.b.md (say → none)',
              );
            },
          );
        },
      );

      when(
        '[t2] the student writes a simple spec with the new brief at say',
        () => {
          then(
            'it refuses: the extant briefs move from say to ref, as the snapshot shows',
            async () => {
              const scene = genSceneOfExtant({
                slug: 'test-boot-moved-simple',
              });
              setSpec({ scene, spec: `briefs:\n  say:\n    - ${BRIEF_NEW}\n` });
              const error = await getError(async () =>
                getOneProofOfScene({ scene, role: ROLE_NATIVE }),
              );
              if (!(error instanceof ConstraintError)) throw error;
              expect(error.message).toContain(
                'briefs/rule.require.a.md (say → ref)',
              );
              expect(asRefusalStderr({ error })).toMatchSnapshot();
            },
          );
        },
      );

      when(
        '[t3] the student writes a simple spec with the new brief at ref alone',
        () => {
          then('the proof passes, the extant briefs still at say', () => {
            const scene = genSceneOfExtant({ slug: 'test-boot-kept-ref' });
            setSpec({ scene, spec: `briefs:\n  ref:\n    - ${BRIEF_NEW}\n` });
            setEntoolRows({
              scene,
              rows: [`| ${scene.briefPath} | brief | ref |`],
            });
            const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
            expect(proof.yields).toEqual([
              { path: scene.briefPath, kind: 'brief', boot: 'ref' },
            ]);
          });
        },
      );

      when(
        '[t4] the course demotes an extant brief it names as a yield',
        () => {
          then('the proof passes, since the row states the move', () => {
            const scene = genSceneOfExtant({ slug: 'test-boot-demoted' });
            const demoted = path.join(ROLE_NATIVE.briefsDir, BRIEFS_EXTANT[0]!);
            setSpec({
              scene,
              spec: `briefs:\n  ref:\n    - briefs/${BRIEFS_EXTANT[0]}\n`,
            });
            setEntoolRows({
              scene,
              rows: [
                `| ${scene.briefPath} | brief | say |`,
                `| ${demoted} | brief | ref |`,
              ],
            });
            writeFileSync(
              path.join(scene.route, '4.1.entool.blueprint.yield.md'),
              `| path | kind | claims | serves |\n|---|---|---|---|\n| ${path.basename(scene.briefPath)} | brief | k1 | t1 |\n| ${BRIEFS_EXTANT[0]} | brief | k1 | t1 |\n`,
            );
            const proof = getOneProofOfScene({ scene, role: ROLE_NATIVE });
            expect(proof.yields).toHaveLength(2);
          });
        },
      );
    },
  );
});
