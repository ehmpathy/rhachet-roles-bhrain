import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getError, given, then, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from '../__test_assets__/answerEveryPeerGiven';
import { genContextReviewBrainSupplyDemo } from '../__test_assets__/genContextReviewBrainSupplyDemo';
import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { setStoneAsConcernAbsorbed } from './setStoneAsConcernAbsorbed';
import { setStoneAsPassed } from './setStoneAsPassed';

const noopContext = genContextReviewBrainSupplyDemo();

/**
 * .what = the WRITE path of a stance — `setStoneAsConcernAbsorbed` invoked directly, with the
 *         passage ledger read back to prove what it recorded.
 *
 * .why = the reviewer read this suite as absent and graded a blocker (r010 blocker.1):
 *        the only stance test hit the GATE function `asAbsorptionIsNotContrary` in
 *        isolation, so it never drove the production write path and never inspected
 *        `passage.jsonl`. a clamp that stops before the write cannot catch a defect in
 *        the write — `rule.require.clamp-edge-cases` names that a toothless clamp.
 *
 * 🔴 each `then` below goes RED under a real regression:
 *      - drop the `alreadyOnRecord` guard → [t2] finds two conceded rows, not one
 *      - drop `asAbsorptionIsNotContrary` → [t3] records a row instead of a throw
 *      - accept an ungraded concede → [case2 t1] records a row instead of a throw
 *      - accept a dispute with no `--why` → [case2 t0] records a row instead of a throw
 *      - drop `assertFulcrumFitsDispute` → [case4] records each dispute it should refuse
 *    so the suite clamps the write, not merely the parse.
 */
describe('setStoneAsConcernAbsorbed.integration', () => {
  given('[case1] a rejected lane, answered, ready for a stance', () => {
    let tempDir: string;
    let fulcrumRel: string;

    const readPassageRows = async (): Promise<Record<string, unknown>[]> => {
      const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
      const content = await fs.readFile(passagePath, 'utf-8');
      return content
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    };

    const absorptionsFor = async (input: {
      status: string;
      about: string;
    }): Promise<Record<string, unknown>[]> =>
      (await readPassageRows()).filter(
        (row) => row.status === input.status && row.about === input.about,
      );

    beforeAll(async () => {
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-stanced-write-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      // its own git root, so path relativization behaves as a real checkout does
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

      // a reviewer that raises ONE blocker and ONE nitpick, so a stance has both a
      // blocker.1 concern to dispute and a nitpick.1 concern to concede. default
      // thresholds (allow 0/0) make the verdict `rejected`, so R2 finds a subject.
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 1\\ntest review"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );

      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

      // the fulcrum path a dispute can cite. no brackets in the name — a glob
      // metacharacter in a filename is forbidden (rule.forbid.brackets-in-filenames).
      // the entry itself is written AFTER the first round ([t0]): an open human-owed dispute
      // on a route with no human gate refuses the last stone's passage
      fulcrumRel = '.fulcrums/inventory.of=fulcrums.case=F001-test.md';
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when(
      '[t0] the first pass raises a rejection and the driver answers it',
      () => {
        const outcome = useThen(
          'the round runs, the gate holds, and the given is answered',
          async () => {
            const passed = await setStoneAsPassed(
              { stone: '1.test', route: tempDir },
              noopContext,
            );
            const pathsTaken = await answerEveryPeerGiven({
              route: tempDir,
              stone: '1.test',
            });
            await fs.mkdir(path.join(tempDir, '.fulcrums'), {
              recursive: true,
            });
            await fs.writeFile(
              path.join(tempDir, fulcrumRel),
              genFulcrumEntryContent({ case: 'F001-test' }),
            );
            return { passed, pathsTaken };
          },
        );

        then('the stone did not pass — a rejection stands', () => {
          expect(outcome.passed.passed).toBe(false);
        });

        then('exactly one given was answered', () => {
          // a broken glob that writes zero takens would make R1 pass for the wrong
          // reason downstream, so the count is asserted (rule.forbid.failhide)
          expect(outcome.pathsTaken).toHaveLength(1);
        });
      },
    );

    when(
      '[t1] an UNGRADED concede is REFUSED — severity is a mandatory invariant',
      () => {
        then('it throws — there is no ungraded concede', async () => {
          // 🔴 red without the `conceded && !severity` throw. every concession is graded
          //    by its harm; a silent `better` default would let an ungraded concede pass
          //    (mandatory invariant, 2026-09-15). the refusal fires before any state moves
          const error = await getError(
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'conceded',
              with: 'limited',
              about: 'nitpick.1',
            }),
          );
          expect(error.message).toContain(
            '--severity is required for --as conceded',
          );
        });
      },
    );

    when(
      '[t1b] the driver CONCEDES nitpick.1, graded better, with an optional --why',
      () => {
        const result = useThen('the concede is recorded', async () =>
          setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'conceded',
            with: 'limited',
            about: 'nitpick.1',
            severity: 'better',
            // 🔴 a concede MAY carry a --why to record why it conceded — an optional
            //    justification a later reader can weigh (2026-09-15). red without removing
            //    the old `conceded && why` forbid-throw
            why: fulcrumRel,
          }),
        );

        then('the op reports a concede', () => {
          expect(result.conceded).toBe(true);
          expect(result.disputed).toBeUndefined();
        });

        then('passage.jsonl holds ONE conceded row for nitpick.1', async () => {
          const rows = await absorptionsFor({
            status: 'conceded',
            about: 'nitpick.1',
          });
          expect(rows).toHaveLength(1);
          expect(rows[0]!.reviewer).toEqual('limited');
          expect(rows[0]!.given).toEqual(expect.stringContaining('limited'));
        });

        then('the concede stores its explicit better grade', async () => {
          const rows = await absorptionsFor({
            status: 'conceded',
            about: 'nitpick.1',
          });
          expect(rows[0]!.severity).toEqual('better');
        });

        then(
          'the concede stores its optional --why justification',
          async () => {
            const rows = await absorptionsFor({
              status: 'conceded',
              about: 'nitpick.1',
            });
            expect(rows[0]!.fulcrum).toEqual(fulcrumRel);
          },
        );
      },
    );

    when(
      '[t2] the driver CONCEDES nitpick.1 a SECOND time, identically',
      () => {
        const result = useThen(
          'the identical concede is a no-op write',
          async () =>
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'conceded',
              with: 'limited',
              about: 'nitpick.1',
              severity: 'better',
            }),
        );

        then('the op still reports a concede', () => {
          expect(result.conceded).toBe(true);
        });

        then('passage.jsonl STILL holds exactly one conceded row', async () => {
          // 🔴 the idempotency clamp — red without the `alreadyOnRecord` guard, which
          //    would append a second row a council reads as two acts (r6 b2 / r7 b2)
          const rows = await absorptionsFor({
            status: 'conceded',
            about: 'nitpick.1',
          });
          expect(rows).toHaveLength(1);
        });
      },
    );

    when(
      '[t3] the driver tries a CONTRARY dispute on the conceded nitpick.1',
      () => {
        then('it throws — a stance is final for its given', async () => {
          // 🔴 red without asAbsorptionIsNotContrary — a flip-flop would record a
          //    disputed row over the conceded one (case=8, the flip-flop refused)
          const error = await getError(
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'disputed',
              with: 'limited',
              about: 'nitpick.1',
              why: fulcrumRel,
            }),
          );
          expect(error.message).toContain('is already conceded');
        });

        then('no disputed row was written for nitpick.1', async () => {
          const rows = await absorptionsFor({
            status: 'disputed',
            about: 'nitpick.1',
          });
          expect(rows).toHaveLength(0);
        });
      },
    );

    when('[t4] the driver DISPUTES blocker.1, with a fulcrum path', () => {
      const result = useThen('the dispute is recorded', async () =>
        setStoneAsConcernAbsorbed({
          stone: '1.test',
          route: tempDir,
          as: 'disputed',
          with: 'limited',
          about: 'blocker.1',
          why: fulcrumRel,
        }),
      );

      then('the op reports a dispute', () => {
        expect(result.disputed).toBe(true);
        expect(result.conceded).toBeUndefined();
      });

      then(
        'passage.jsonl holds a disputed row that cites the fulcrum verbatim',
        async () => {
          const rows = await absorptionsFor({
            status: 'disputed',
            about: 'blocker.1',
          });
          expect(rows).toHaveLength(1);
          expect(rows[0]!.reviewer).toEqual('limited');
          expect(rows[0]!.fulcrum).toEqual(fulcrumRel);
        },
      );

      then('a dispute carries no severity grade', async () => {
        const rows = await absorptionsFor({
          status: 'disputed',
          about: 'blocker.1',
        });
        expect(rows[0]!.severity).toBeUndefined();
      });
    });

    when(
      '[t5] a stance names an --about ordinal past what the lane raised',
      () => {
        then(
          'it throws — the ordinal is bounded by the given, so blocker.9 addresses no concern',
          async () => {
            // 🔴 red without the ordinal-range check (setStoneAsConcernAbsorbed.ts) — a phantom
            //    concern would enter the ledger and inflate the disputed sum, the exact
            //    hazard the check closes (ergo r009 blocker.1). the lane raised ONE blocker,
            //    so any ordinal above 1 is out of range and must be refused before a write.
            const error = await getError(
              setStoneAsConcernAbsorbed({
                stone: '1.test',
                route: tempDir,
                as: 'conceded',
                with: 'limited',
                about: 'blocker.9',
                // graded, so the ordinal-range check is the one that fires (severity is
                // validated first, before the concern parse)
                severity: 'better',
              }),
            );
            expect(error.message).toContain('out of range');
            expect(error.message).toContain('1..1');
            expect(error.message).toMatchSnapshot();
          },
        );

        then('no row was written for the out-of-range concern', async () => {
          const rows = await absorptionsFor({
            status: 'conceded',
            about: 'blocker.9',
          });
          expect(rows).toHaveLength(0);
        });
      },
    );
  });

  given(
    '[case3] an APPROVED lane — its concern still counts stone-wide, so it is disputable',
    () => {
      // 🔴 the clamp for the fundamental invariant (2026-09-15): the `reviewed?` judge tallies
      //    nitpicks STONE-WIDE, so an approved lane's nitpicks push the total, and the driver MUST
      //    be able to shed them. before the fix, a dispute on an approved lane threw
      //    `does not hold the road`; this whole case goes RED under that behavior.
      let tempDir: string;
      let fulcrumRel: string;

      const readPassageRows = async (): Promise<Record<string, unknown>[]> => {
        const content = await fs.readFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        return content
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as Record<string, unknown>);
      };

      beforeAll(async () => {
        tempDir = path.join(
          process.cwd(),
          '.tmp',
          `test-stanced-approved-${Date.now()}`,
        );
        await fs.mkdir(tempDir, { recursive: true });
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

        // a reviewer that raises 0 blockers and 2 nitpicks. the judge allows 5 nitpicks, so this
        // lane's own verdict is APPROVED (2 <= 5, 0 <= 0) — yet its 2 nitpicks still count toward
        // the stone-wide tally. the judge line carries the `reviewed?` marker + allowance so
        // getReviewedJudgeThresholds reads the same 5 the verdict uses.
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: friendly',
            '      run: echo "blockers: 0\\nnitpicks: 2\\ntest review"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: true\\nreason: within allowance --mechanism reviewed? --allow-nitpicks 5"',
          ].join('\n'),
        );
        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

        // the entry is written after the round ([t0]), so the lane's own passage is not held
        fulcrumRel = '.fulcrums/inventory.of=fulcrums.case=F001-test.md';
      });

      afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] the reviewer runs and its verdict holds the road', () => {
        const outcome = useThen(
          'the round runs and the lane approves',
          async () => {
            const passed = await setStoneAsPassed(
              { stone: '1.test', route: tempDir },
              noopContext,
            );
            await fs.mkdir(path.join(tempDir, '.fulcrums'), {
              recursive: true,
            });
            await fs.writeFile(
              path.join(tempDir, fulcrumRel),
              genFulcrumEntryContent({ case: 'F001-test' }),
            );
            return passed;
          },
        );

        then(
          'the lane approved — no blocker, nitpicks within allowance',
          () => {
            // an approved lane owes no answer (0 blockers), so a stance needs no prior `.taken`.
            // the check is the verdict itself, so a regression that blocks this lane goes red
            expect(outcome.passed).toBe(true);
          },
        );
      });

      when('[t1] the driver DISPUTES nitpick.1 on the APPROVED lane', () => {
        const result = useThen('the dispute is accepted', async () =>
          setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'disputed',
            with: 'friendly',
            about: 'nitpick.1',
            why: fulcrumRel,
          }),
        );

        then(
          'the op reports a dispute — an approved lane is a real subject',
          () => {
            expect(result.disputed).toBe(true);
          },
        );

        then(
          'passage.jsonl holds the disputed row for the approved lane',
          async () => {
            const rows = (await readPassageRows()).filter(
              (row) => row.status === 'disputed' && row.about === 'nitpick.1',
            );
            expect(rows).toHaveLength(1);
            expect(rows[0]!.reviewer).toEqual('friendly');
            expect(rows[0]!.fulcrum).toEqual(fulcrumRel);
          },
        );
      });
    },
  );

  given('[case2] the flag-shape refusals — each fails before any i/o', () => {
    let tempDir: string;
    let fulcrumRel: string;

    beforeAll(async () => {
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-stanced-refusals-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      const fulcrumsDir = path.join(tempDir, '.fulcrums');
      await fs.mkdir(fulcrumsDir, { recursive: true });
      fulcrumRel = '.fulcrums/inventory.of=fulcrums.case=F001-test.md';
      await fs.writeFile(
        path.join(tempDir, fulcrumRel),
        genFulcrumEntryContent({ case: 'F001-test' }),
      );
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] a dispute with NO --why', () => {
      then('the error names --why as required for a dispute', async () => {
        const error = await getError(
          setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'disputed',
            with: 'limited',
            about: 'blocker.1',
          }),
        );
        expect(error.message).toContain('--why is required');
        // r009 blocker.1 — pin the whole bytes, so a reword that keeps the
        // fragment but wrecks the shape surfaces in the diff, not in a driver
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] a concede with NO --severity', () => {
      then('the error names --severity as required for a concede', async () => {
        // severity is a mandatory invariant — there is no ungraded concede (2026-09-15)
        const error = await getError(
          setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'conceded',
            with: 'limited',
            about: 'nitpick.1',
          }),
        );
        expect(error.message).toContain(
          '--severity is required for --as conceded',
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] a dispute WITH a --severity', () => {
      then(
        'the error names --severity as unaccepted for a dispute',
        async () => {
          const error = await getError(
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'disputed',
              with: 'limited',
              about: 'blocker.1',
              why: fulcrumRel,
              severity: 'urgent',
            }),
          );
          expect(error.message).toContain('--severity is not accepted');
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when(
      '[t3] a dispute whose --why points at a file that does not exist',
      () => {
        then('the error names the absent fulcrum path', async () => {
          const error = await getError(
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'disputed',
              with: 'limited',
              about: 'blocker.1',
              why: '.fulcrums/inventory.of=fulcrums.case=F999-absent.md',
            }),
          );
          expect(error.message).toContain('no fulcrum entry');
          // tempDir carries Date.now() (a fresh dir per run), so it is normalized to a
          // stable placeholder before the pin — same fix as assertFulcrumPathExists's
          // integration test (r009 blocker.1, i005)
          expect(
            error.message.split(tempDir).join('<tempDir>'),
          ).toMatchSnapshot();
        });
      },
    );
  });

  /**
   * 🔴 the clamp for invariants 3 and 5 at dispute time — each refusal goes red without its
   *    check in `assertFulcrumFitsDispute`, and the two acceptances go red if a check over-reaches
   */
  given('[case4] a dispute whose fulcrum must carry it', () => {
    let tempDir: string;

    const writeFulcrum = async (input: {
      name: string;
      content: string;
    }): Promise<string> => {
      const rel = `.fulcrums/inventory.of=fulcrums.case=${input.name}.md`;
      await fs.writeFile(path.join(tempDir, rel), input.content);
      return rel;
    };

    const disputeWith = (input: {
      about: string;
      why: string;
      reflect?: string;
    }) =>
      setStoneAsConcernAbsorbed({
        stone: '1.test',
        route: tempDir,
        as: 'disputed',
        with: 'limited',
        about: input.about,
        why: input.why,
        reflect: input.reflect,
      });

    // each refusal is snapped by byte; the temp route is masked so the bytes stay stable
    const asStableRefusal = (input: { message: string }): string =>
      input.message.split(tempDir).join('<route>');

    beforeAll(async () => {
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-stanced-fulcrum-fit-${Date.now()}`,
      );
      await fs.mkdir(path.join(tempDir, '.fulcrums'), { recursive: true });
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 2\\nnitpicks: 0\\ntest review"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

      // the round runs and its given is answered, so R1 passes for the accepted cases
      await setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext);
      await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] the fulcrum has no frontmatter', () => {
      then(
        'the dispute is refused, and the fix names every field',
        async () => {
          const why = await writeFulcrum({
            name: 'F010-bare',
            content: '# F010 — prose alone',
          });
          const error = await getError(
            disputeWith({ about: 'blocker.1', why }),
          );
          expect(error.message).toContain('has no frontmatter');
          expect(error.message).toContain('confidence');
          expect(error.message).toContain('case: F010\n');
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when('[t1] the fulcrum frontmatter holds a value outside its set', () => {
      then(
        'the dispute is refused, and the malformed field is named',
        async () => {
          const why = await writeFulcrum({
            name: 'F011-bad-ground',
            content: genFulcrumEntryContent({
              case: 'F011-bad-ground',
            }).replace('ground: wrong', 'ground: maybe'),
          });
          const error = await getError(
            disputeWith({ about: 'blocker.1', why }),
          );
          expect(error.message).toContain('has an invalid frontmatter');
          expect(error.message).toContain('malformed');
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when(
      '[t2] the fulcrum declares an owed its ground and confidence do not derive',
      () => {
        then(
          'the dispute is refused, and the derived owed is named',
          async () => {
            const why = await writeFulcrum({
              name: 'F012-owed-lie',
              content: genFulcrumEntryContent({
                case: 'F012-owed-lie',
                confidence: 0.95,
                owed: 'human',
              }),
            });
            const error = await getError(
              disputeWith({ about: 'blocker.1', why }),
            );
            expect(error.message).toContain('derive owed: reflect');
            expect(asStableRefusal(error)).toMatchSnapshot();
          },
        );
      },
    );

    when('[t3] a sure misread is disputed with no --reflect', () => {
      then(
        'the dispute is refused, and the fix names the reflect ref',
        async () => {
          const why = await writeFulcrum({
            name: 'F013-sure',
            content: genFulcrumEntryContent({
              case: 'F013-sure',
              confidence: 0.95,
              owed: 'reflect',
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
            }),
          });
          const error = await getError(
            disputeWith({ about: 'blocker.1', why }),
          );
          expect(error.message).toContain('--reflect is required');
          expect(error.message).toContain(
            '--reflect ehmpathy/rhachet-roles-ehmpathy#12',
          );
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when(
      '[t4] a sure misread is disputed with a --reflect that differs',
      () => {
        then('the dispute is refused as a mismatch', async () => {
          const why = await writeFulcrum({
            name: 'F014-sure',
            content: genFulcrumEntryContent({
              case: 'F014-sure',
              confidence: 0.95,
              owed: 'reflect',
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
            }),
          });
          const error = await getError(
            disputeWith({
              about: 'blocker.1',
              why,
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#99',
            }),
          );
          expect(error.message).toContain('does not match');
          expect(asStableRefusal(error)).toMatchSnapshot();
        });
      },
    );

    when('[t5] a dispute on dirty ground carries a --reflect', () => {
      then(
        'the dispute is refused — a human always rules dirty ground',
        async () => {
          const why = await writeFulcrum({
            name: 'F015-dirty',
            content: genFulcrumEntryContent({
              case: 'F015-dirty',
              ground: 'dirty',
              confidence: 0.95,
            }),
          });
          const error = await getError(
            disputeWith({
              about: 'blocker.1',
              why,
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
            }),
          );
          expect(error.message).toContain(
            'refused for a dispute on dirty ground',
          );
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when('[t6] a human-owed dispute carries a --reflect', () => {
      then(
        'the dispute is refused — only a sure misread owes one',
        async () => {
          const why = await writeFulcrum({
            name: 'F016-unsure',
            content: genFulcrumEntryContent({ case: 'F016-unsure' }),
          });
          const error = await getError(
            disputeWith({
              about: 'blocker.1',
              why,
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
            }),
          );
          expect(error.message).toContain('owes a human');
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when('[t7] the fulcrum declares owed: none', () => {
      then(
        'the dispute is refused — a dispute owes a human or a reflection',
        async () => {
          const why = await writeFulcrum({
            name: 'F017-none',
            content: genFulcrumEntryContent({
              case: 'F017-none',
              owed: 'none',
            }),
          });
          const error = await getError(
            disputeWith({ about: 'blocker.1', why }),
          );
          expect(error.message).toContain('owed: none');
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });

    when('[t8] a sure misread is disputed with the matched --reflect', () => {
      const result = useThen('the dispute is accepted', async () =>
        disputeWith({
          about: 'blocker.1',
          why: await writeFulcrum({
            name: 'F018-sure',
            content: genFulcrumEntryContent({
              case: 'F018-sure',
              confidence: 0.95,
              owed: 'reflect',
              reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
            }),
          }),
          reflect: 'ehmpathy/rhachet-roles-ehmpathy#12',
        }),
      );

      then('the op reports a dispute, recorded and never halted', () => {
        expect(result.disputed).toBe(true);
      });
    });

    when('[t9] an unsure misread is disputed with no --reflect', () => {
      const result = useThen('the dispute is accepted', async () =>
        disputeWith({
          about: 'blocker.2',
          why: await writeFulcrum({
            name: 'F019-unsure',
            content: genFulcrumEntryContent({ case: 'F019-unsure' }),
          }),
        }),
      );

      then('the op reports a dispute, owed to the human', () => {
        expect(result.disputed).toBe(true);
      });
    });

    when(
      '[t10] the fulcrum does not hold the concern the dispute backs',
      () => {
        then(
          'the dispute is refused, and the fix names the hold to add',
          async () => {
            const why = await writeFulcrum({
              name: 'F020-holds-other',
              content: genFulcrumEntryContent({
                case: 'F020-holds-other',
                holds: ['limited/i001/blocker.2'],
              }),
            });
            const error = await getError(
              disputeWith({ about: 'blocker.1', why }),
            );
            expect(error.message).toContain('does not hold limited blocker.1');
            expect(error.message).toContain('limited/<iteration>/blocker.1');
            expect(asStableRefusal(error)).toMatchSnapshot();
          },
        );
      },
    );

    when('[t11] the fulcrum case differs from its file id', () => {
      then(
        'the dispute is refused, and the malformed case names the file id',
        async () => {
          const why = await writeFulcrum({
            name: 'F021-renamed',
            content: genFulcrumEntryContent({ case: 'F021-renamed' }).replace(
              'case: F021',
              'case: F099',
            ),
          });
          const error = await getError(
            disputeWith({ about: 'blocker.1', why }),
          );
          expect(error.message).toContain('case (equal to the file id, F021)');
          expect(asStableRefusal(error)).toMatchSnapshot();
        },
      );
    });
  });

  // the refusal teaches a block to paste; a block the same check then refuses is a fix that
  // re-breaks the file. so the round trip is clamped: paste what the refusal printed, re-dispute
  given(
    '[case5] a dispute refused for a bare fulcrum, then its paste block applied',
    () => {
      let tempDir: string;

      beforeAll(async () => {
        tempDir = path.join(
          process.cwd(),
          '.tmp',
          `test-stanced-fulcrum-paste-${Date.now()}`,
        );
        await fs.mkdir(path.join(tempDir, '.fulcrums'), { recursive: true });
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: limited',
            '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
          ].join('\n'),
        );
        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
        await setStoneAsPassed(
          { stone: '1.test', route: tempDir },
          noopContext,
        );
        await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });
      });

      afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] the driver pastes the block the refusal printed', () => {
        then('🔴 the re-dispute is accepted', async () => {
          const why = '.fulcrums/inventory.of=fulcrums.case=F030-pasted.md';
          const dispute = () =>
            setStoneAsConcernAbsorbed({
              stone: '1.test',
              route: tempDir,
              as: 'disputed',
              with: 'limited',
              about: 'blocker.1',
              why,
            });
          await fs.writeFile(path.join(tempDir, why), '# F030 — prose alone');
          const error = await getError(dispute());
          const block = error.message
            .split('\n')
            .filter((line) => line.startsWith('         │  '))
            .map((line) => line.slice('         │  '.length))
            .join('\n')
            .replace('<iteration>', 'i001');
          await fs.writeFile(
            path.join(tempDir, why),
            `${block}\n\n# F030 — the pasted block\n`,
          );
          await dispute();
        });
      });

      when('[t1] the driver mistypes --with', () => {
        then(
          '🔴 the refusal names the reviewer, never a hold to add for it',
          async () => {
            const error = await getError(
              setStoneAsConcernAbsorbed({
                stone: '1.test',
                route: tempDir,
                as: 'disputed',
                with: 'limitedd',
                about: 'blocker.1',
                why: '.fulcrums/inventory.of=fulcrums.case=F030-pasted.md',
              }),
            );
            expect(error.message).toContain(
              'invalid peer reviewer slug: "limitedd"',
            );
            expect(error.message).not.toContain('does not hold');
          },
        );
      });

      when('[t2] the --why file name declares no case', () => {
        then(
          '🔴 the refusal names the file name, as the linter does',
          async () => {
            const why = '.fulcrums/F47.deferral.md';
            await fs.writeFile(path.join(tempDir, why), '# F47 — misnamed');
            const error = await getError(
              setStoneAsConcernAbsorbed({
                stone: '1.test',
                route: tempDir,
                as: 'disputed',
                with: 'limited',
                about: 'blocker.1',
                why,
              }),
            );
            expect(error.message).toContain(
              'file name (inventory.of=fulcrums.case=<id>-<slug>.md)',
            );
            expect(error.message).not.toContain('case (equal to the file id');
          },
        );
      });
    },
  );
});
