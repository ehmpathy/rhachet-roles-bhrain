import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { setRouteStoneGuardReviewPeerMeter } from '@src/domain.operations/route/guard/review/peer/meter/setRouteStoneGuardReviewPeerMeter';
import { setPassageReport } from '@src/domain.operations/route/passage/setPassageReport';
import { stepRouteStatusLine } from '@src/domain.operations/route/stepRouteStatusLine';
import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';
import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

import {
  asRouteStatusLineCachePath,
  DIR_OF_ROUTE_STATUS_LINE_CACHE,
} from './cache/asRouteStatusLineCachePath';
import { stepRouteStatusLineCached } from './stepRouteStatusLineCached';

/**
 * .what = integration tests for the cached status line
 * .why = the clamp the wish asks for, at the grain that observes the cost: across repeated
 *        repaints of an unchanged route, the render runs ONCE, not once per repaint. against
 *        the uncached renderer every repaint renders, so these go red without the cache
 *
 * .note = the real render ops run over a real temp repo on disk, with no module intercepted.
 *         a render is observed by its effect: every miss renders and then writes the cache by
 *         rename, so a new cache-file inode per repaint IS a render; a hit writes naught
 * .note = the bind lookup a young miss skips is observed by its effect too: a second bind flag
 *         planted by hand faults the lookup, so a miss that renders over it did not look up
 *         (`[case9]` [t3])
 * .note = the real bind lookup reads paths relative to process.cwd(), so each repaint runs
 *         inside a chdir to the temp repo, restored after (as the extant bind tests do)
 */

/**
 * .what = the inode of the cache file, or null when it is absent
 * .why = a miss replaces the file by rename, so its inode changes; a hit leaves it be
 *
 * .note = lstat, so a cache path that is a symlink to itself (`[case5c]`) reads, never faults
 */
const getOneCacheInode = (input: { cachePath: string }): number | null => {
  try {
    return fs.lstatSync(input.cachePath).ino;
  } catch (error) {
    if (getFsErrorCode(error) === 'ENOENT') return null;
    throw error;
  }
};

/**
 * .what = one repaint, and whether it missed (rendered and rewrote the cache)
 * .why = the render count is the cost the cache must remove; the inode reads it with no
 *        module intercepted
 */
const repaintObserved = async (input: {
  cachePath: string;
  context?: Parameters<typeof stepRouteStatusLineCached>[1];
}): Promise<{
  result: Awaited<ReturnType<typeof stepRouteStatusLineCached>>;
  missed: boolean;
}> => {
  const inodeBefore = getOneCacheInode(input);
  const result = await stepRouteStatusLineCached({}, input.context ?? {});
  return { result, missed: getOneCacheInode(input) !== inodeBefore };
};

/**
 * .what = runs a step inside a chdir to the temp repo
 * .why = the bind ops and the real bind lookup read paths relative to process.cwd()
 */
const withinTempRepo = async <T>(
  input: { tempDir: string },
  logic: () => Promise<T>,
): Promise<T> => {
  const cwdOriginal = process.cwd();
  process.chdir(input.tempDir);
  try {
    return await logic();
  } finally {
    process.chdir(cwdOriginal);
  }
};

/**
 * .what = a temp git repo with one route bound to its branch (stone 1.vision, unpassed)
 * .why = each case needs a hermetic bound route whose render inputs it can then move
 */
const genBoundRouteRepo = (input: {
  slug: string;
  guard?: string;
  metersRaw?: string;
}): { tempDir: string; routeDir: string; stateDir: string; branch: string } => {
  const tempDir = genTempDir({ slug: input.slug, git: true });
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: tempDir,
    encoding: 'utf-8',
  }).trim();
  const routeDir = path.join(tempDir, 'my-route');
  const stateDir = path.join(routeDir, '.route');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish');
  fs.writeFileSync(path.join(routeDir, '1.vision.stone'), '# stone: vision');
  fs.writeFileSync(
    path.join(stateDir, `.bind.${sanitizeBranchName({ branch })}.flag`),
    '',
  );
  if (input.guard !== undefined)
    fs.writeFileSync(path.join(routeDir, '1.vision.guard'), input.guard);
  if (input.metersRaw !== undefined)
    fs.writeFileSync(
      path.join(stateDir, 'reviewPeerMeters.jsonl'),
      input.metersRaw,
    );
  return { tempDir, routeDir, stateDir, branch };
};

/**
 * .what = a peer-review guard for stone 1.vision (one level-1 reviewer)
 * .why = the meter and degrade cases need a guard whose phase reads the peer meters
 */
const PEER_GUARD = [
  'artifacts:',
  '  - "$route/1.vision*.md"',
  'reviews:',
  '  peer:',
  '    - slug: reviewer-a',
  '      run: echo test',
  '      budget: 3',
  '      level: 1',
  'judges: []',
].join('\n');

/**
 * .what = runs N repaints in sequence, and collects each line and the count that rendered
 * .why = names the loop so each case reads as narrative
 */
const runRepaints = async (input: {
  cwd: string;
  branch: string;
  count: number;
  context?: Parameters<typeof stepRouteStatusLineCached>[1];
}): Promise<{ lines: string[]; renders: number }> => {
  const cachePath = asRouteStatusLineCachePath({
    cwd: input.cwd,
    branch: input.branch,
  });
  return withinTempRepo({ tempDir: input.cwd }, async () =>
    // one repaint at a time, in order, as a harness repaints a seat
    Array.from({ length: input.count }).reduce<
      Promise<{ lines: string[]; renders: number }>
    >(async (tallyPrior) => {
      const tally = await tallyPrior;
      const { result, missed } = await repaintObserved({
        cachePath,
        context: input.context,
      });
      return {
        lines: [...tally.lines, result.line],
        renders: tally.renders + (missed ? 1 : 0),
      };
    }, (async () => ({ lines: [], renders: 0 }))()),
  );
};

describe('stepRouteStatusLineCached.integration', () => {
  given('[case1] a bound route whose inputs do not change', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case1' }),
    );

    when('[t0] the line repaints five times', () => {
      const result = useThen('it repaints', async () =>
        runRepaints({ cwd: scene.tempDir, branch: scene.branch, count: 5 }),
      );

      then('CLAMP: the render runs once, not once per repaint', () => {
        expect(result.renders).toEqual(1);
      });

      then('every repaint prints the same, correct line', () => {
        expect(new Set(result.lines)).toEqual(
          new Set(['🗿 1.vision, yield 🌾']),
        );
      });

      then('the cache file is written under .agent/.cache, per branch', () => {
        expect(
          fs.existsSync(
            asRouteStatusLineCachePath({
              cwd: scene.tempDir,
              branch: scene.branch,
            }),
          ),
        ).toEqual(true);
      });

      then(
        'CLAMP: the cache never shows as untracked, in a repo no roles link touched',
        () => {
          const porcelain = execSync(
            'git status --porcelain --untracked-files=all',
            { cwd: scene.tempDir },
          ).toString();
          expect(porcelain).not.toContain('.agent/');
        },
      );
    });
  });

  given('[case2] a bound route whose passage changes between repaints', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case2' }),
    );

    when(
      '[t0] the line repaints, a passage row is appended, then it repaints again',
      () => {
        const result = useThen('it repaints across the change', async () => {
          const before = await runRepaints({
            cwd: scene.tempDir,
            branch: scene.branch,
            count: 2,
          });
          // the real writer, so a rename of its ledger turns this case red
          await setPassageReport({
            route: path.dirname(scene.stateDir),
            report: new PassageReport({
              stone: '1.vision',
              status: 'blocked',
            }),
          });
          const after = await runRepaints({
            cwd: scene.tempDir,
            branch: scene.branch,
            count: 2,
          });
          return { before, after };
        });

        then('the next repaint after the change shows it', () => {
          expect(result.before.lines).toEqual([
            '🗿 1.vision, yield 🌾',
            '🗿 1.vision, yield 🌾',
          ]);
          expect(result.after.lines[0]).toEqual(
            '🗿 1.vision, yield, blocked ✋',
          );
        });

        then('the render runs once per change, not once per repaint', () => {
          expect(result.before.renders + result.after.renders).toEqual(2);
        });
      },
    );
  });

  given('[case3] a repo with no route bound', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'statusline-cached-case3',
        git: true,
      });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
      })
        .toString()
        .trim();
      return { tempDir, branch };
    });

    when('[t0] the line repaints three times', () => {
      const result = useThen('it repaints', async () =>
        runRepaints({ cwd: scene.tempDir, branch: scene.branch, count: 3 }),
      );

      then('every repaint prints the blank line', () => {
        expect(result.lines).toEqual(['', '', '']);
      });

      then(
        'the repo-wide bind glob runs once, then the blank is served from cache',
        () => {
          // only a miss looks up the bind, and only the first repaint missed
          expect(result.renders).toEqual(1);
        },
      );
    });
  });

  given('[case4] a hook writes a file the render never reads', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case4' }),
    );

    when(
      '[t0] the drive blockers file and a bouncer cache change between repaints',
      () => {
        const result = useThen('it repaints', async () => {
          const before = await runRepaints({
            cwd: scene.tempDir,
            branch: scene.branch,
            count: 1,
          });
          fs.writeFileSync(
            path.join(scene.stateDir, '.drive.blockers.latest.json'),
            '{}',
          );
          fs.writeFileSync(
            path.join(scene.stateDir, '.bouncer.cache.json'),
            '{}',
          );
          const after = await runRepaints({
            cwd: scene.tempDir,
            branch: scene.branch,
            count: 2,
          });
          return { renders: before.renders + after.renders };
        });

        then(
          'the repaints stay hits: the allowlist keeps hook writes out',
          () => {
            expect(result.renders).toEqual(1);
          },
        );
      },
    );
  });

  given('[case5] a corrupt cache file', () => {
    const scene = useBeforeAll(async () => {
      const repo = genBoundRouteRepo({ slug: 'statusline-cached-case5' });
      const cachePath = asRouteStatusLineCachePath({
        cwd: repo.tempDir,
        branch: repo.branch,
      });
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, '{ torn half a recor');
      return { ...repo, cachePath };
    });

    when('[t0] the line repaints', () => {
      const result = useThen('it repaints', async () =>
        withinTempRepo({ tempDir: scene.tempDir }, () =>
          repaintObserved({ cachePath: scene.cachePath }),
        ),
      );

      then(
        'the line is correct: a corrupt cache is a miss, never a fault',
        () => {
          expect(result.result.line).toEqual('🗿 1.vision, yield 🌾');
          expect(result.missed).toEqual(true);
        },
      );

      then('the cache is rewritten as a valid record', () => {
        const record = JSON.parse(fs.readFileSync(scene.cachePath, 'utf-8'));
        expect(record.line).toEqual('🗿 1.vision, yield 🌾');
      });
    });
  });

  given('[case5b] a cache dir that cannot be written', () => {
    const scene = useBeforeAll(async () => {
      const repo = genBoundRouteRepo({ slug: 'statusline-cached-case5b' });
      // a FILE where the cache dir must go makes every write fail
      const blocker = path.join(repo.tempDir, DIR_OF_ROUTE_STATUS_LINE_CACHE);
      fs.mkdirSync(path.dirname(blocker), { recursive: true });
      fs.writeFileSync(blocker, 'not a dir');
      return repo;
    });

    when('[t0] the line repaints', () => {
      const result = useThen('it repaints', async () =>
        withinTempRepo({ tempDir: scene.tempDir }, () =>
          stepRouteStatusLineCached(),
        ),
      );

      then('the line still prints, correct', () => {
        expect(result.line).toEqual('🗿 1.vision, yield 🌾');
      });

      then(
        'the write fault is returned with its code and path, to report loud',
        () => {
          expect(result.cacheWriteFault?.code).toMatch(/^E[A-Z]+$/);
          expect(result.cacheWriteFault?.cachePath).toContain(
            'skill=route.status.line',
          );
        },
      );
    });
  });

  given('[case5c] a cache file that cannot be read', () => {
    const scene = useBeforeAll(async () => {
      const repo = genBoundRouteRepo({ slug: 'statusline-cached-case5c' });
      const cachePath = asRouteStatusLineCachePath({
        cwd: repo.tempDir,
        branch: repo.branch,
      });
      // a symlink to itself makes the cache read fault (ELOOP); root-proof, unlike a chmod
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.symlinkSync(cachePath, cachePath);
      return { ...repo, cachePath };
    });

    when('[t0] the line repaints twice', () => {
      const result = useThen('it repaints', async () =>
        withinTempRepo({ tempDir: scene.tempDir }, async () => {
          const first = await repaintObserved({ cachePath: scene.cachePath });
          const second = await repaintObserved({ cachePath: scene.cachePath });
          return { first, second };
        }),
      );

      then(
        'CLAMP: the line still prints, correct: an unreadable cache is a miss',
        () => {
          expect(result.first.result.line).toEqual('🗿 1.vision, yield 🌾');
          expect(result.first.missed).toEqual(true);
        },
      );

      then(
        'the read fault is returned with its code and path, to report loud',
        () => {
          // the step names the path under the process cwd, which the chdir realpaths
          expect(result.first.result.cacheReadFault).toEqual({
            code: 'ELOOP',
            cachePath: path.join(
              fs.realpathSync(path.dirname(scene.cachePath)),
              path.basename(scene.cachePath),
            ),
          });
        },
      );

      then('the miss write replaces the file, so the next repaint hits', () => {
        expect(result.second.result.cacheReadFault).toEqual(null);
        expect(result.second.result.line).toEqual('🗿 1.vision, yield 🌾');
        expect(result.second.missed).toEqual(false);
      });
    });
  });

  given('[case6] a peer review appends a meter row, no passage write', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case6', guard: PEER_GUARD }),
    );

    when(
      '[t0] the line repaints, a round 1 meter row lands, then it repaints',
      () => {
        const result = useThen(
          'it repaints across the meter append',
          async () => {
            const before = await runRepaints({
              cwd: scene.tempDir,
              branch: scene.branch,
              count: 1,
            });
            // the real writer, so a rename of its ledger turns this case red
            await setRouteStoneGuardReviewPeerMeter({
              route: path.dirname(scene.stateDir),
              meter: new RouteStoneGuardReviewPeerMeter({
                stone: '1.vision',
                reviewer: { slug: 'reviewer-a' },
                rounds: 1,
              }),
            });
            const after = await runRepaints({
              cwd: scene.tempDir,
              branch: scene.branch,
              count: 1,
            });
            return { before, after };
          },
        );

        then('the phase counter moves on the next repaint', () => {
          expect(result.before.lines).toEqual(['🗿 1.vision, yield 🌾']);
          expect(result.after.lines).toEqual([
            '🗿 1.vision, review.peer, l1@i001 🔍',
          ]);
        });

        then(
          'the meter file is a render input: the append missed and rendered',
          () => {
            expect(result.before.renders + result.after.renders).toEqual(2);
          },
        );
      },
    );
  });

  given('[case6b] a warm cache aged past the max age', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case6b' }),
    );

    when('[t0] the cache file is backdated 31s, then the line repaints', () => {
      const result = useThen('it repaints', async () => {
        const before = await runRepaints({
          cwd: scene.tempDir,
          branch: scene.branch,
          count: 1,
        });
        const cachePath = asRouteStatusLineCachePath({
          cwd: scene.tempDir,
          branch: scene.branch,
        });
        const backdated = new Date(Date.now() - 31_000);
        fs.utimesSync(cachePath, backdated, backdated);
        const after = await runRepaints({
          cwd: scene.tempDir,
          branch: scene.branch,
          count: 1,
        });
        return { renders: before.renders + after.renders };
      });

      then('the render runs once more: the max age is the backstop', () => {
        expect(result.renders).toEqual(2);
      });
    });
  });

  given('[case7] a bound route whose phase derivation faults (degrade)', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({
        slug: 'statusline-cached-case7',
        guard: PEER_GUARD,
        metersRaw: '{ this is not valid json\n',
      }),
    );

    when('[t0] the line repaints twice, then the ledger is repaired', () => {
      const result = useThen('it repaints', async () => {
        const cachePath = asRouteStatusLineCachePath({
          cwd: scene.tempDir,
          branch: scene.branch,
        });

        // two repaints over the corrupt ledger, each result kept whole
        const before = await withinTempRepo(
          { tempDir: scene.tempDir },
          async () => {
            const miss = await repaintObserved({ cachePath });
            const hit = await repaintObserved({ cachePath });
            return { miss, hit };
          },
        );

        // repair the corrupt meter ledger, then repaint once more
        fs.writeFileSync(
          path.join(scene.stateDir, 'reviewPeerMeters.jsonl'),
          '',
        );
        const after = await withinTempRepo({ tempDir: scene.tempDir }, () =>
          repaintObserved({ cachePath }),
        );
        return { before, after };
      });

      then('each repaint degrades to the plain stone line', () => {
        expect(result.before.miss.result.line).toEqual('🗿 1.vision');
        expect(result.before.hit.result.line).toEqual('🗿 1.vision');
      });

      then(
        'a degraded line is cached: the second repaint renders naught',
        () => {
          expect(result.before.miss.missed).toEqual(true);
          expect(result.before.hit.missed).toEqual(false);
        },
      );

      then(
        'the miss returns the fault row, and the hit returns it again',
        () => {
          expect(result.before.miss.result.degradeRow).toContain(
            'phase derivation faulted for stone "1.vision"',
          );
          expect(result.before.hit.result.degradeRow).toEqual(
            result.before.miss.result.degradeRow,
          );
        },
      );

      then('a repair of the ledger misses at once and renders afresh', () => {
        expect(result.after.missed).toEqual(true);
        expect(result.after.result.degradeRow).toEqual(null);
      });
    });
  });

  given('[case8] a passage row lands while a render is in flight', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'statusline-cached-case8' }),
    );

    when('[t0] the first render reads stale state, then repaints twice', () => {
      const result = useThen('it repaints across the race', async () => {
        // the first render computes its line via the real render, then a passage row lands
        // before the cache write; each later render is the real one, untouched
        const passagePath = path.join(scene.stateDir, 'passage.jsonl');
        const first = await runRepaints({
          cwd: scene.tempDir,
          branch: scene.branch,
          count: 1,
          context: {
            renderRoute: async (args) => {
              const rendered = await stepRouteStatusLine(args);
              fs.appendFileSync(
                passagePath,
                `${JSON.stringify({ stone: '1.vision', status: 'blocked' })}\n`,
              );
              return rendered;
            },
          },
        });
        const rest = await runRepaints({
          cwd: scene.tempDir,
          branch: scene.branch,
          count: 2,
        });
        return {
          lines: [...first.lines, ...rest.lines],
          renders: first.renders + rest.renders,
        };
      });

      then('the in-flight render prints the state it read', () => {
        expect(result.lines[0]).toEqual('🗿 1.vision, yield 🌾');
      });

      then('the next repaint heals to the landed passage', () => {
        expect(result.lines.slice(1)).toEqual([
          '🗿 1.vision, yield, blocked ✋',
          '🗿 1.vision, yield, blocked ✋',
        ]);
      });

      then('the heal costs one render, then the cache holds', () => {
        expect(result.renders).toEqual(2);
      });
    });
  });

  given(
    '[case9] a seat whose route is bound, then unbound, via the real bind ops',
    () => {
      // the bind ops read process.cwd(), as the extant bind tests do, so each repaint runs
      // inside a chdir to the temp repo, restored after
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-cached-case9',
          git: true,
        });
        execSync('git checkout -b vlad/test-statusline-bind', { cwd: tempDir });
        const routeDir = path.join(tempDir, 'my-route');
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish');
        fs.writeFileSync(
          path.join(routeDir, '1.vision.stone'),
          '# stone: vision',
        );
        return { tempDir, routeDir };
      });

      /**
       * .what = one repaint, inside the temp repo the bind ops act on
       * .why = names the step so each case reads as narrative
       */
      const repaint = async (): Promise<string> =>
        (await stepRouteStatusLineCached()).line;

      /**
       * .what = runs a case step inside a chdir to this scene's temp repo
       * .why = the bind ops read process.cwd(), so the whole step must run there
       */
      const withinSceneRepo = <T>(logic: () => Promise<T>): Promise<T> =>
        withinTempRepo({ tempDir: scene.tempDir }, logic);

      when(
        '[t0] the seat repaints unbound, a route is bound, the seat repaints, then it is unbound',
        () => {
          const result = useThen('it repaints across the bind ops', async () =>
            withinSceneRepo(async () => {
              const unbound = [await repaint(), await repaint()];
              await setRouteBind({ route: 'my-route' });
              const bound = await repaint();
              await delRouteBind();
              const unboundAgain = await repaint();
              return { unbound, bound, unboundAgain };
            }),
          );

          then('the unbound seat prints the blank line, cached', () => {
            expect(result.unbound).toEqual(['', '']);
          });

          then(
            'CLAMP: after route.bind.set the next repaint shows the route, with no wait for the max age',
            () => {
              expect(result.bound).toEqual('🗿 1.vision, yield 🌾');
            },
          );

          then('after route.bind.del the next repaint is blank again', () => {
            expect(result.unboundAgain).toEqual('');
          });

          then('the lines of the step match their snapshot', () => {
            expect(result).toMatchSnapshot();
          });
        },
      );

      when('[t1] the bind flag is removed by hand, with no bind op', () => {
        const result = useThen('it repaints across a hand unbind', async () =>
          withinSceneRepo(async () => {
            await setRouteBind({ route: 'my-route' });
            const bound = await repaint();
            const branch = execSync('git rev-parse --abbrev-ref HEAD', {
              cwd: scene.tempDir,
              encoding: 'utf-8',
            }).trim();
            fs.rmSync(
              path.join(
                scene.routeDir,
                '.route',
                `.bind.${sanitizeBranchName({ branch })}.flag`,
              ),
            );
            const unbound = await repaint();
            return { bound, unbound };
          }),
        );

        then(
          'the next repaint is blank: the flag stat is in the fingerprint',
          () => {
            expect(result.bound).toEqual('🗿 1.vision, yield 🌾');
            expect(result.unbound).toEqual('');
          },
        );

        then('the lines of the step match their snapshot', () => {
          expect(result).toMatchSnapshot();
        });
      });

      when('[t2] route.bind.set races a repaint', () => {
        const result = useThen('it repaints across the race', async () =>
          withinSceneRepo(async () => {
            const before = await repaint();
            const [, racer] = await Promise.all([
              setRouteBind({ route: 'my-route' }),
              repaint(),
            ]);
            const after = await repaint();
            return { before, racer, after };
          }),
        );

        then('the racer prints either the prior line or the new one', () => {
          expect(result.before).toEqual('');
          expect(['', '🗿 1.vision, yield 🌾']).toContain(result.racer);
        });

        then('the next repaint shows the new route', () => {
          expect(result.after).toEqual('🗿 1.vision, yield 🌾');
        });

        then('the settled lines of the step match their snapshot', () => {
          // the racer is left out: either line is correct mid-race, so it cannot be pinned
          expect({
            before: result.before,
            after: result.after,
          }).toMatchSnapshot();
        });
      });

      when(
        '[t3] a second bind flag is planted by hand, then a passage lands',
        () => {
          const result = useThen(
            'it repaints across the multi-bind',
            async () =>
              withinSceneRepo(async () => {
                await setRouteBind({ route: 'my-route' });
                const bound = await repaint();
                const branch = execSync('git rev-parse --abbrev-ref HEAD', {
                  cwd: scene.tempDir,
                  encoding: 'utf-8',
                }).trim();
                const routeOther = path.join(scene.tempDir, 'my-route-other');
                fs.mkdirSync(path.join(routeOther, '.route'), {
                  recursive: true,
                });
                fs.writeFileSync(
                  path.join(
                    routeOther,
                    '.route',
                    `.bind.${sanitizeBranchName({ branch })}.flag`,
                  ),
                  '',
                );
                fs.appendFileSync(
                  path.join(scene.routeDir, '.route', 'passage.jsonl'),
                  `${JSON.stringify({ stone: '1.vision', status: 'blocked' })}\n`,
                );
                const young = await repaint();

                // age the record past the max age: the next miss runs the full lookup
                const cachePath = asRouteStatusLineCachePath({
                  cwd: scene.tempDir,
                  branch,
                });
                const backdated = new Date(Date.now() - 31_000);
                fs.utimesSync(cachePath, backdated, backdated);
                const error = await getError(repaint());
                return { bound, young, error };
              }),
          );

          then(
            'a young miss renders the cached route: its own flag still stands',
            () => {
              expect(result.bound).toEqual('🗿 1.vision, yield 🌾');
              expect(result.young).toEqual('🗿 1.vision, yield, blocked ✋');
            },
          );

          then(
            'CLAMP: past the max age the miss looks up the bind afresh and faults loud on the multi-bind',
            () => {
              expect(result.error.message).toContain('multiple routes bound');
            },
          );

          then('the fault matches its snapshot', () => {
            // the flag paths sit under a per-run temp dir; tokenize it so the snap is stable
            expect(
              result.error.message.replace(
                /\/tmp\/\S*?(?=\/my-route)/g,
                '$TEMP',
              ),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );

  given('[case9b] a route bound from a subdir of the repo', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.realpathSync(
        genTempDir({ slug: 'statusline-cached-case9b', git: true }),
      );
      execSync('git checkout -b vlad/test-statusline-subdir', {
        cwd: tempDir,
      });
      const routeDir = path.join(tempDir, 'my-route');
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        '# stone: vision',
      );
      const subDir = path.join(tempDir, 'src');
      fs.mkdirSync(subDir, { recursive: true });
      return { tempDir, subDir };
    });

    when(
      '[t0] the root seat repaints, a bind runs from the subdir, then the root seat repaints',
      () => {
        const result = useThen(
          'it repaints across the subdir bind',
          async () => {
            const before = await withinTempRepo(
              { tempDir: scene.tempDir },
              () => stepRouteStatusLineCached(),
            );
            await withinTempRepo({ tempDir: scene.subDir }, () =>
              setRouteBind({ route: '../my-route' }),
            );
            const after = await withinTempRepo({ tempDir: scene.tempDir }, () =>
              stepRouteStatusLineCached(),
            );
            return { before: before.line, after: after.line };
          },
        );

        then(
          'CLAMP: the root seat shows the route at once: the drop lands at the git root',
          () => {
            expect(result.before).toEqual('');
            expect(result.after).toEqual('🗿 1.vision, yield 🌾');
          },
        );
      },
    );
  });

  given('[case9c] a route bound twice to the same route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.realpathSync(
        genTempDir({ slug: 'statusline-cached-case9c', git: true }),
      );
      execSync('git checkout -b vlad/test-statusline-rebind', {
        cwd: tempDir,
      });
      const routeDir = path.join(tempDir, 'my-route');
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, '0.wish.md'), '# wish');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        '# stone: vision',
      );
      const cachePath = asRouteStatusLineCachePath({
        cwd: tempDir,
        branch: 'vlad/test-statusline-rebind',
      });
      return { tempDir, cachePath };
    });

    when('[t0] the seat repaints, then the same route is bound again', () => {
      const result = useThen('it repaints across the re-bind', async () =>
        withinTempRepo({ tempDir: scene.tempDir }, async () => {
          await setRouteBind({ route: 'my-route' });
          await stepRouteStatusLineCached();
          const cachedBefore = fs.existsSync(scene.cachePath);
          await setRouteBind({ route: 'my-route' });
          const cachedAfter = fs.existsSync(scene.cachePath);
          return { cachedBefore, cachedAfter };
        }),
      );

      then(
        'CLAMP: the idempotent re-bind still drops the cache, so a re-bind refreshes the line',
        () => {
          expect(result.cachedBefore).toEqual(true);
          expect(result.cachedAfter).toEqual(false);
        },
      );
    });
  });
});
