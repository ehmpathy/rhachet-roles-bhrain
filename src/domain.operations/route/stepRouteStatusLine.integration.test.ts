import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { stepRouteStatusLine } from './stepRouteStatusLine';

/**
 * .what = integration tests for stepRouteStatusLine
 * .why = verifies the status line reflects the current stone AND its guard phase via
 *        the real filesystem (passage.jsonl, peer meters, self promises, guard files)
 *
 * .note = tests pass route param directly to avoid bind conflicts
 *         (all tests run in same git repo context)
 */
describe('stepRouteStatusLine.integration', () => {
  given('[case1] a guardless stone (still in the yield phase)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case1', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision\n\ndone when:\n- vision drafted',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the current stone line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the moai + stone name + yield phase', () => {
        expect(result.line).toEqual('🗿 1.vision, yield 🌾');
      });
    });
  });

  given('[case2] multiple stones, first passed (second still yields)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case2', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision',
      );
      await fs.writeFile(
        path.join(tempDir, '5.1.execution.from_vision.stone'),
        '# stone: execution',
      );

      // pass the first stone so the current stone is the second
      await fs.writeFile(
        path.join(tempDir, '1.vision.yield.md'),
        '# vision yielded',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.vision', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the next unpassed stone', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the second (current) stone in yield', () => {
        expect(result.line).toEqual('🗿 5.1.execution.from_vision, yield 🌾');
      });
    });
  });

  given('[case3] route with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case3', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.yield.md'),
        '# vision yielded',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.vision', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the route-complete line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows route complete + palmtree + shaka', () => {
        // a bound route whose stones all passed is `complete` — distinct from an
        // unbound / stone-less route (which stays blank). the palmtree + shaka mark
        // the finish (done, hang loose) so an observer sees the route wrapped
        expect(result.line).toEqual('🗿 route complete 🌴🤙');
      });
    });
  });

  given('[case4] empty route (no stones)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case4', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns an empty line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then(
        'line is blank (no stones → not complete: no stone was passed)',
        () => {
          expect(result.line).toEqual('');
        },
      );
    });
  });

  given('[case5] a route path that does not exist', () => {
    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns an empty line', async () =>
        stepRouteStatusLine({ route: '/does/not/exist/route' }),
      );

      then('line is blank (a dir with no stones is not complete)', () => {
        expect(result.line).toEqual('');
      });
    });
  });

  given('[case6] a parallel stone group (same numeric prefix)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case6', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      // two parallel stones share the 3.1 prefix; neither passed
      await fs.writeFile(path.join(tempDir, '3.1.a.stone'), '# stone: a');
      await fs.writeFile(path.join(tempDir, '3.1.b.stone'), '# stone: b');

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns a single current stone', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then(
        'line shows the first stone in yield (documented v1 tradeoff)',
        () => {
          // vision assumption: parallel groups show the first stone (@next-one),
          // the same rule route.drive uses; a group under-tells but never crashes
          expect(result.line).toEqual('🗿 3.1.a, yield 🌾');
        },
      );
    });
  });

  given('[case7] a stone blocked on self-review (r{done}/{total})', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case7', git: true });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  self:',
          '    - slug: slug-a',
          '      say: review a',
          '    - slug: slug-b',
          '      say: review b',
          'judges: []',
        ].join('\n'),
      );

      // promise one of two self-reviews, then record a review.self block
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', '1.test.guard.promise.slug-a.md'),
        '# promised',
      );
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.test',
          status: 'blocked',
          blocker: 'review.self',
        }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the self-review phase', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows r1/r2 (one of two promised) + magnifier', () => {
        expect(result.line).toEqual('🗿 1.test, review.self, r1/r2 🔍');
      });
    });
  });

  given('[case8] a stone blocked on peer-review (l{level}@i{rounds})', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case8', git: true });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: reviewer-a',
          '      run: echo test',
          '      budget: 3',
          '      level: 1',
          'judges: []',
        ].join('\n'),
      );

      // reviewer-a has consumed 2 rounds; a review.peer block is recorded
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
        JSON.stringify({
          stone: '1.test',
          reviewer: { slug: 'reviewer-a' },
          rounds: 2,
        }) + '\n',
      );
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.test',
          status: 'blocked',
          blocker: 'review.peer',
        }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the peer-review phase', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows l1@i002 (level 1, 2 rounds) + magnifier', () => {
        expect(result.line).toEqual('🗿 1.test, review.peer, l1@i002 🔍');
      });
    });
  });

  given('[case9] a stone blocked on human approval', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case9', git: true });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1.test',
          status: 'blocked',
          blocker: 'approval',
        }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the approval-judge phase', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows judge, approved? + the human wave', () => {
        expect(result.line).toEqual('🗿 1.test, judge, approved? 👋');
      });
    });
  });

  given(
    '[case10] a stone blocked on a non-approval judge (agent fixes)',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case10',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1.test',
            status: 'blocked',
            blocker: 'judge',
          }) + '\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen('returns the plain judge phase', async () =>
          stepRouteStatusLine({ route: scene.tempDir }),
        );

        then('line shows judge + magnifier (machine turn, no wave)', () => {
          expect(result.line).toEqual('🗿 1.test, judge 🔍');
        });
      });
    },
  );

  given(
    '[case11] a driver-blocked stone (halt on a wall over the peer phase)',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case11',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: reviewer-a',
            '      run: echo test',
            '      budget: 3',
            '      level: 1',
            'judges: []',
          ].join('\n'),
        );

        // the driver was mid-peer-review (2 rounds) then signalled a block
        // .note = a driver-initiated block has NO `blocker` field (distinct from a guard block)
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          JSON.stringify({
            stone: '1.test',
            reviewer: { slug: 'reviewer-a' },
            rounds: 2,
          }) + '\n',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1.test', status: 'blocked' }) + '\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen('returns the driver-wall halt', async () =>
          stepRouteStatusLine({ route: scene.tempDir }),
        );

        then('line keeps the peer phase text, appends blocked + ✋', () => {
          expect(result.line).toEqual(
            '🗿 1.test, review.peer, l1@i002, blocked ✋',
          );
        });
      });
    },
  );

  given(
    '[case12] a stone with an exhausted peer review (its own status)',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case12',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: reviewer-a',
            '      run: echo test',
            '      budget: 3',
            '      level: 1',
            'judges: []',
          ].join('\n'),
        );

        // reviewer-a spent its budget; the peer review is exhausted (its own status now)
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          JSON.stringify({
            stone: '1.test',
            reviewer: { slug: 'reviewer-a' },
            rounds: 3,
          }) + '\n',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1.test',
            status: 'exhausted',
          }) + '\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen(
          'returns the peer phase + exhausted halt',
          async () => stepRouteStatusLine({ route: scene.tempDir }),
        );

        then('line shows the peer phase + exhausted + the wave', () => {
          expect(result.line).toEqual(
            '🗿 1.test, review.peer, l1@i003, exhausted 👋',
          );
        });
      });
    },
  );

  given(
    '[case13] a stone blocked on uncontemplated peer review (agent replies)',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case13',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: reviewer-a',
            '      run: echo test',
            '      budget: 3',
            '      level: 1',
            'judges: []',
          ].join('\n'),
        );

        // reviewer-a raised a point the driver has not yet answered (a .taken awaited)
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          JSON.stringify({
            stone: '1.test',
            reviewer: { slug: 'reviewer-a' },
            rounds: 2,
          }) + '\n',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1.test',
            status: 'blocked',
            blocker: 'review.peer.uncontemplated',
          }) + '\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen(
          'returns the peer-review phase (machine turn)',
          async () => stepRouteStatusLine({ route: scene.tempDir }),
        );

        then('line shows the peer phase + magnifier (agent replies)', () => {
          expect(result.line).toEqual('🗿 1.test, review.peer, l1@i002 🔍');
        });
      });
    },
  );

  given(
    '[case14] a phase-derivation fault degrades to the plain stone line',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case14',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: reviewer-a',
            '      run: echo test',
            '      budget: 3',
            '      level: 1',
            'judges: []',
          ].join('\n'),
        );

        // a corrupt meter file faults the PHASE read (not the strict stone lookup,
        // which never reads reviewPeerMeters.jsonl) — so the best-effort catch fires
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          '{ this is not valid json\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen(
          'still returns a line (does not throw)',
          async () => stepRouteStatusLine({ route: scene.tempDir }),
        );

        then(
          'line degrades to the plain stone (phase dropped, base kept)',
          () => {
            expect(result.line).toEqual('🗿 1.test');
          },
        );
      });
    },
  );

  given(
    '[case15] a stone with a malfunctioned reviewer (its own status)',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-int-case15',
          git: true,
        });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# stone');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: reviewer-a',
            '      run: echo test',
            '      budget: 3',
            '      level: 1',
            'judges: []',
          ].join('\n'),
        );

        // reviewer-a ran, then a reviewer/judge malfunctioned mid-peer-review (2 rounds in)
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'reviewPeerMeters.jsonl'),
          JSON.stringify({
            stone: '1.test',
            reviewer: { slug: 'reviewer-a' },
            rounds: 2,
          }) + '\n',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1.test', status: 'malfunction' }) + '\n',
        );

        return { tempDir };
      });

      when('[t0] stepRouteStatusLine is called', () => {
        const result = useThen(
          'returns the peer phase + malfunction halt',
          async () => stepRouteStatusLine({ route: scene.tempDir }),
        );

        then('line shows the peer phase + malfunction + the collision', () => {
          expect(result.line).toEqual(
            '🗿 1.test, review.peer, l1@i002, malfunction 💥',
          );
        });
      });
    },
  );
});
