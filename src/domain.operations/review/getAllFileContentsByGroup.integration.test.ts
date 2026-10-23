import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getAllFileContentsByGroup } from '@src/domain.operations/review/getAllFileContentsByGroup';

/**
 * .what = clamps the bounded, group-shaped content reader against a real filesystem
 * .why = 🔴 the bound's stated subject — the descriptor table and the libuv
 *        threadpool — is a PROCESS limit (`ulimit -n`), so no corpus a test may
 *        honestly build reaches it. what IS observable is the property a wave can
 *        silently break: that every file is read, and read IN THE ORDER ASKED.
 *
 *        ⇒ so the corpus here deliberately EXCEEDS one wave (64), because a suite
 *        that stayed under it would exercise a single `Promise.all` and clamp the
 *        wave logic not at all.
 *
 * .note = 🔴 the GROUP shape is what `[case5]` grades, and it is the property the
 *         four-call form could not have: several named lists poured ONCE, split back
 *         apart by count. a split that drifted by one would hand a group its
 *         neighbour's file with every other assertion here still green.
 */
describe('getAllFileContentsByGroup', () => {
  const COUNT_PAST_ONE_WAVE = 150; // > the 64-wide bound, so several waves pour

  const scene = useBeforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bounded-reads-'));
    const files = Array.from(
      { length: COUNT_PAST_ONE_WAVE },
      (_, at) => `file.${String(at).padStart(3, '0')}.txt`,
    );
    await Promise.all(
      files.map((one, at) =>
        fs.writeFile(path.join(dir, one), `content of ${at}`, 'utf-8'),
      ),
    );
    return { dir, files };
  });

  given('[case1] a corpus larger than one wave', () => {
    when('[t0] the contents are read', () => {
      // 🔴 read ONCE and shared. this call opens 150 real files across several
      // waves, and it ran three times over — once per adjacent assertion — where
      // all three observe the SAME read
      // (rule.forbid.redundant-expensive-operations).
      //
      // ⚠️ and the de-duplication is not merely cheaper, it is MORE correct here:
      // three separate reads could each have succeeded on a different pour, so
      // `length`, `order`, and `content` were graded against three distinct
      // results. one read makes the three assertions describe one object, which
      // is what the case's own label claims
      // 🟡 the read is wrapped in a PLAIN OBJECT rather than handed back bare.
      // `useThen` hands you a proxy over what the thunk returned, and a proxy
      // over an Array does not forward `length` or `map` — both read as
      // `undefined`, so the two assertions below fail with the read intact. one
      // `{ of }` wrapper makes every member reachable, whatever its type
      const read = useThen('the read completes', async () => ({
        of: (
          await getAllFileContentsByGroup({
            cwd: scene.dir,
            groups: { only: scene.files },
          })
        ).only,
      }));

      then('every file is present — no wave drops its tail', () => {
        expect(read.of.length).toEqual(COUNT_PAST_ONE_WAVE);
      });

      then('🔴 the ORDER ASKED is preserved across wave boundaries', () => {
        expect(read.of.map((one) => one.path)).toEqual(scene.files);
      });

      then('each path carries ITS OWN content, never a neighbour’s', () => {
        expect(read.of[0]!.content).toEqual('content of 0');
        expect(read.of[64]!.content).toEqual('content of 64'); // the 2nd wave's head
        expect(read.of[149]!.content).toEqual('content of 149');
      });
    });
  });

  given('[case2] an ABSOLUTE path in the list', () => {
    when('[t0] it is read', () => {
      then('it is read as-is, never joined onto cwd', async () => {
        const read = await getAllFileContentsByGroup({
          cwd: '/a/cwd/that/does/not/exist',
          groups: { only: [path.join(scene.dir, scene.files[0]!)] },
        });
        expect(read.only[0]!.content).toEqual('content of 0');
      });
    });
  });

  given('[case3] a file in the list that is not there', () => {
    when('[t0] the read is attempted', () => {
      then(
        '🔴 it THROWS rather than grades absence to an empty body',
        async () => {
          // an enumerated file that will not open is a server fault. a bare catch
          // would hand the prompt an empty rule and review naught, confidently
          await expect(
            getAllFileContentsByGroup({
              cwd: scene.dir,
              groups: { only: ['file.000.txt', 'this.one.is.absent.txt'] },
            }),
          ).rejects.toThrow('failed to read file: this.one.is.absent.txt');
        },
      );
    });
  });

  given('[case3b] a path node refuses as an argument, not as a read', () => {
    when('[t0] the read is attempted', () => {
      then(
        '🔴 the argument fault surfaces as itself, never dressed as a read fault',
        async () => {
          // a null byte makes node throw `ERR_INVALID_ARG_VALUE` before any read;
          // that is a code defect, so it must not take the `failed to read file` wrap
          const error = await getAllFileContentsByGroup({
            cwd: scene.dir,
            groups: { only: ['file\u0000.txt'] },
          }).catch((caught: unknown) => caught);
          expect(Reflect.get(Object(error), 'code')).toEqual(
            'ERR_INVALID_ARG_VALUE',
          );
          expect(String(error)).not.toContain('failed to read file');
        },
      );
    });
  });

  given('[case4] an empty file list', () => {
    when('[t0] the read is attempted', () => {
      then(
        'it answers an empty list, and does not hang on a zero-wide wave',
        async () => {
          const read = await getAllFileContentsByGroup({
            cwd: scene.dir,
            groups: { only: [] },
          });
          expect(read.only).toEqual([]);
        },
      );
    });
  });

  given('[case5] FOUR named groups, across several wave boundaries', () => {
    // the shape `stepReview` actually asks for: four lists, one pour. the
    // boundaries are deliberately UNALIGNED to the 64-wide wave, so a group's
    // edge falls mid-wave and a split that walked the wrong list would show
    const groups = {
      rules: ['file.000.txt', 'file.001.txt'],
      refs: Array.from(
        { length: 70 },
        (_, at) => `file.${String(at + 10).padStart(3, '0')}.txt`,
      ),
      conversation: [] as string[], // 🔴 an EMPTY group is a real case — the first round has no dialogue
      targets: Array.from(
        { length: 70 },
        (_, at) => `file.${String(at + 80).padStart(3, '0')}.txt`,
      ),
    };

    when('[t0] the four are read in one pour', () => {
      const read = useThen('the read completes', async () => ({
        of: await getAllFileContentsByGroup({ cwd: scene.dir, groups }),
      }));

      then(
        '🔴 each group carries exactly the files IT asked for, in order',
        () => {
          expect(read.of.rules.map((one) => one.path)).toEqual(groups.rules);
          expect(read.of.refs.map((one) => one.path)).toEqual(groups.refs);
          expect(read.of.targets.map((one) => one.path)).toEqual(
            groups.targets,
          );
        },
      );

      then('an empty group answers empty, never absent', () => {
        expect(read.of.conversation).toEqual([]);
      });

      then(
        '🔴 the content belongs to the group that asked, across a wave edge',
        () => {
          // `refs` spans indices 10..79 and `targets` 80..149, so the split point
          // between them sits INSIDE the second wave. a one-off offset hands
          // `targets` a `refs` read and passes every other check in this case
          expect(read.of.refs[0]!.content).toEqual('content of 10');
          expect(read.of.refs[69]!.content).toEqual('content of 79');
          expect(read.of.targets[0]!.content).toEqual('content of 80');
          expect(read.of.targets[69]!.content).toEqual('content of 149');
        },
      );
    });
  });

  given('[case6] the SAME path in two groups', () => {
    // 🔴 legitimate, and it carries the split's whole design: a file may be both a
    // rule and a target, so the split must part the reads by COUNT and never by a
    // path match. every assertion in `[case5]` stays green under a path-keyed split
    //
    // 🟡 .note = what this case can see, and what it CANNOT — measured by neuter,
    //         because the two halves of "never by a path match" are not equally
    //         observable at THIS grain:
    //
    //         | the neuter | here | at `asReadsByGroup.test` |
    //         |---|---|---|
    //         | a `filter`-by-path split (the ARITY half) | ✅ 1 of 12 red | ✅ red |
    //         | a `find`-by-path split (the IDENTITY half) | 🔴 **GREEN** | ✅ 3 of 5 red |
    //
    //         ⇒ the `find` half is unobservable here BY CONSTRUCTION: a file has one
    //         body, so the read a path-key finds and the read a count-key slices
    //         carry identical `path` AND identical `content`. no fixture repair
    //         reaches it — only a read that carries an identity beyond its path can,
    //         which is why `asReadsByGroup.test [case3]` tags its reads with an `at`.
    //         stated rather than left implied, because this case's own label claims
    //         the whole property and holds half of it
    const groups = {
      rules: ['file.000.txt'],
      targets: ['file.000.txt', 'file.001.txt'],
    };

    when('[t0] the two are read in one pour', () => {
      then('🔴 BOTH groups get their own copy of the shared path', async () => {
        const read = await getAllFileContentsByGroup({
          cwd: scene.dir,
          groups,
        });
        expect(read.rules.map((one) => one.path)).toEqual(['file.000.txt']);
        expect(read.targets.map((one) => one.path)).toEqual([
          'file.000.txt',
          'file.001.txt',
        ]);
        expect(read.rules[0]!.content).toEqual('content of 0');
        expect(read.targets[0]!.content).toEqual('content of 0');
      });
    });
  });
});
