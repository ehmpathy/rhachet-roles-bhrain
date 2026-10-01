import { given, then, useThen, when } from 'test-fns';

import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import {
  DriveBlockerState,
  DriveBrainInheritance,
} from '../drive/DriveBlocker';
import { applyStoneBrainOnEntry } from './applyStoneBrainOnEntry';
import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = unit test for the F7/F14 entry rule
 * .why = an injectable seam makes each arm a plain call (rule.require.test-coverage-by-grain)
 */
describe('applyStoneBrainOnEntry', () => {
  // a stone that DECLARES a brain — the only shape that reaches the dispatch path
  const guardBrained = new RouteStoneGuard({
    path: '/tmp/1.guard',
    artifacts: [],
    reviews: {},
    judges: [],
    protect: [],
    brain: { choice: 'opus', effort: null },
  });
  const stone = { name: '1', guard: guardBrained };
  const requested: StoneBrainOutcome = {
    outcome: 'requested',
    brain: 'opus',
    effort: null,
    guard: '/tmp/1.guard',
    reviewers: [],
  };

  const undispatched: StoneBrainOutcome = {
    outcome: 'undispatched',
    brain: 'opus',
    effort: null,
    guard: '/tmp/1.guard',
    cause: 'unenrolled',
  };

  // a seam that records whether state was read, the brain dispatched, the entry marked.
  // `returns` sets the outcome setBrain reports (default: a dispatched `requested`).
  const genSeam = (input: {
    /** the block counter's stone — every onStop tick rewrites it, so it must NOT gate */
    markerStone: string | null;
    /**
     * the stone whose switch last LANDED (the brain record's stone) — the real entry marker.
     * absent means no switch has landed on this route yet
     */
    landedStone?: string | null;
    returns?: StoneBrainOutcome;
    /**
     * whether this caller WINS the dispatch claim. absent means it wins.
     *
     * .why = the claim is a real file under a real lock; unstubbed, every arm would write
     *        into jest's cwd (`rule.forbid.unit.remote-boundaries`)
     */
    claimWon?: boolean;
  }) => {
    const calls = {
      read: false,
      dispatched: false,
      marked: null as string | null,
      // the BRAIN the entry write recorded, apart from the stone. a later brainless stone
      // renders `brain = <slug>` from this pair, so a dropped slug must fail here (case=7)
      markedBrain: null as string | null,
      // the EFFORT the entry write recorded — the slug's peer, for case=7's effort line
      markedEffort: null as string | null,
      claimed: 0,
      released: 0,
    };
    return {
      calls,
      options: {
        getState: async () => {
          calls.read = true;
          // `brain: null` by default = an opted-in route before its first landed switch,
          // so an arm that seeds no record exercises "no attribution owed" (case=7 `[t1]`)
          return new DriveBlockerState({
            count: 0,
            stone: input.markerStone,
            brain: input.landedStone
              ? new DriveBrainInheritance({
                  slug: 'opus',
                  effort: null,
                  stone: input.landedStone,
                })
              : null,
          });
        },
        setBrain: async () => {
          calls.dispatched = true;
          return input.returns ?? requested;
        },
        setEntry: async (i: {
          route: string;
          stone: string;
          brain: string | null;
          effort: string | null;
        }) => {
          calls.marked = i.stone;
          calls.markedBrain = i.brain;
          calls.markedEffort = i.effort;
          // .note = the carry-through of a prior record is `setDriveEntryStone`'s to test;
          //         this fake holds no prior record
          return {
            state: new DriveBlockerState({
              count: 0,
              stone: i.stone,
              brain:
                i.brain || i.effort
                  ? new DriveBrainInheritance({
                      slug: i.brain,
                      effort: i.effort,
                      stone: i.stone,
                    })
                  : null,
            }),
          };
        },
        genClaim: async () => {
          calls.claimed += 1;
          return { won: input.claimWon ?? true };
        },
        delClaim: async () => {
          calls.released += 1;
        },
      },
    };
  };

  given('dispatchAlways = true (onBoot / direct-mode)', () => {
    when('the switch ALREADY landed on this stone (resumed session)', () => {
      const seam = genSeam({ markerStone: '1', landedStone: '1' });
      const outcome = useThen('dispatches anyway', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: true,
          },
          seam.options,
        ),
      );

      then('the brain IS dispatched despite entered === false (F7)', () => {
        expect(outcome.outcome).toEqual('requested');
        expect(seam.calls.dispatched).toEqual(true);
      });

      then('the entry is re-marked', () => {
        expect(seam.calls.marked).toEqual('1');
      });
    });

    when('the dispatch requested a choice AND an effort', () => {
      const seam = genSeam({
        markerStone: '0',
        returns: {
          outcome: 'requested',
          brain: 'opus',
          effort: 'high',
          guard: '/tmp/1.guard',
          reviewers: [],
        },
      });
      useThen('dispatches', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: true,
          },
          seam.options,
        ),
      );

      then(
        'the entry write records BOTH, so a later stone inherits both (F30)',
        () => {
          expect(seam.calls.markedBrain).toEqual('opus');
          expect(seam.calls.markedEffort).toEqual('high');
        },
      );
    });
  });

  given('dispatchAlways = false (onStop)', () => {
    when('the switch ALREADY landed on this stone (not an entry)', () => {
      const seam = genSeam({ markerStone: '1', landedStone: '1' });
      const outcome = useThen('skips the dispatch', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          seam.options,
        ),
      );

      then('NO per-tick re-dispatch', () => {
        expect(seam.calls.dispatched).toEqual(false);
        expect(seam.calls.claimed).toEqual(0);
      });

      then('the tick still names the brain that landed (S12 parity)', () => {
        // 🔴 .why = `none` dropped the `brain =` row, so the second tick of a brain stone read
        //    like a stone that never declared one
        expect(outcome.outcome).toEqual('inherited');
        if (outcome.outcome !== 'inherited') throw new Error('unreachable');
        expect(outcome.brain).toEqual('opus');
        expect(outcome.stone).toEqual('1');
      });
    });

    when(
      'the block counter records this stone, and NO switch has landed here',
      () => {
        // 🔴 the regression clamp. every onStop tick writes `state.stone` for the block count;
        //    when that field was the entry marker, a HALTED stone read as entered on its second
        //    tick, and the retry and the halt both went silent (S8)
        const seam = genSeam({
          markerStone: '1',
          landedStone: '0',
          returns: undispatched,
        });
        const outcome = useThen('attempts the switch again', async () =>
          applyStoneBrainOnEntry(
            {
              stone,
              route: '/r',
              routeDeclaresBrain: true,
              dispatchAlways: false,
            },
            seam.options,
          ),
        );

        then('the switch is RE-ATTEMPTED, and the halt renders again', () => {
          expect(seam.calls.dispatched).toEqual(true);
          expect(outcome.outcome).toEqual('undispatched');
        });
      },
    );

    when('the last switch landed on a DIFFERENT stone (a real entry)', () => {
      const seam = genSeam({ markerStone: '0', landedStone: '0' });
      const outcome = useThen('dispatches on the entry edge', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          seam.options,
        ),
      );

      then('the brain IS dispatched and the entry marked', () => {
        expect(outcome.outcome).toEqual('requested');
        expect(seam.calls.dispatched).toEqual(true);
        expect(seam.calls.marked).toEqual('1');
      });
    });
  });

  given('a stone that declares NO brain (every extant guard, case=10)', () => {
    // 🔴 the scope-leak clamp: a brainless stone pays NAUGHT — no state read, no dispatch,
    //    no marker write — even on dispatchAlways. asserted as positive non-invocation
    const cases: Array<{ label: string; guard: RouteStoneGuard | null }> = [
      { label: 'a null guard', guard: null },
      {
        label: 'a guard with no brain key',
        guard: new RouteStoneGuard({
          path: '/tmp/2.guard',
          artifacts: [],
          reviews: {},
          judges: [],
          protect: [],
        }),
      },
    ];

    cases.forEach(({ label, guard }) => {
      when(`the guard is ${label}, on dispatchAlways`, () => {
        const seam = genSeam({ markerStone: '0' });
        const outcome = useThen('returns with no disk I/O', async () =>
          applyStoneBrainOnEntry(
            {
              stone: { name: '2', guard },
              route: '/r',
              // .why FALSE = both stones declare no brain; the route parts case=10 (never
              //    opted in) from case=7. flip to `true` and case=7's arm runs
              routeDeclaresBrain: false,
              dispatchAlways: true,
            },
            seam.options,
          ),
        );

        then('the outcome is none', () => {
          expect(outcome.outcome).toEqual('none');
        });

        then('NO state read, NO dispatch, NO marker write occurred', () => {
          expect(seam.calls.read).toEqual(false);
          expect(seam.calls.dispatched).toEqual(false);
          expect(seam.calls.marked).toEqual(null);
        });

        then(
          'and NO dispatch claim was taken — case=10 still pays naught',
          () => {
            // .why = every extant guard takes this branch; a claim here would put a lock
            //    and a write on every stone entry everywhere, for a dispatch that cannot happen
            expect(seam.calls.claimed).toEqual(0);
            expect(seam.calls.released).toEqual(0);
          },
        );
      });
    });
  });

  given(
    'a brainless stone on a route that ALREADY dispatched a brain (case=7)',
    () => {
      /**
       * .what = the SECOND brainless cell. the guard read is identical; the route parts them:
       *
       *      case=10 `absent-from-launch`  → the route never opted in → silence, no I/O
       *      case=7  `absent-after-switch` → a prior stone dispatched → the attribution
       *
       * .why = a driver left on an expensive brain its own guard never named must learn which
       *        stone set it, or the one-edit fix is unfindable (case=7 `[t2]`/`[t3]`)
       *
       * .note = the absent-record row: a route whose switches all halted has inherited naught,
       *         so the record is written on the `requested` arm alone (`rule.forbid.failhide`)
       */
      const brainless = { name: '2', guard: null };

      when('[t0] the route HAS a record — the brain was inherited', () => {
        const seam = genSeam({ markerStone: '1' });
        const inheritance = new DriveBrainInheritance({
          slug: 'claude-opus-5[1m]',
          effort: 'high',
          stone: '3.3.1.blueprint',
        });
        const outcome = useThen('reads the record', async () =>
          applyStoneBrainOnEntry(
            {
              stone: brainless,
              route: '/r',
              routeDeclaresBrain: true,
              dispatchAlways: true,
            },
            {
              ...seam.options,
              getState: async () => {
                seam.calls.read = true;
                return new DriveBlockerState({
                  count: 0,
                  stone: '1',
                  brain: inheritance,
                });
              },
            },
          ),
        );

        then('the outcome names the brain AND the stone that set it', () => {
          // .why both = the SLUG answers "what does this cost me"; the STONE answers
          //    "which guard do i edit"
          expect(outcome.outcome).toEqual('inherited');
          if (outcome.outcome !== 'inherited') throw new Error('unreachable');
          expect(outcome.brain).toEqual('claude-opus-5[1m]');
          expect(outcome.stone).toEqual('3.3.1.blueprint');
        });

        then(
          'and it names the inherited EFFORT, as it names the brain (F30)',
          () => {
            if (outcome.outcome !== 'inherited') throw new Error('unreachable');
            expect(outcome.effort).toEqual('high');
          },
        );

        then('and STILL no dispatch, no claim, no marker write', () => {
          // the sticky half is unchanged by the attribution: a brainless stone renders a
          // line about a switch that already happened, and attempts no switch of its own
          expect(seam.calls.dispatched).toEqual(false);
          expect(seam.calls.claimed).toEqual(0);
          expect(seam.calls.marked).toEqual(null);
        });
      });

      when('[t1] the route has NO record — no switch ever landed', () => {
        const seam = genSeam({ markerStone: '1' });
        const outcome = useThen('reads, and finds naught', async () =>
          applyStoneBrainOnEntry(
            {
              stone: brainless,
              route: '/r',
              routeDeclaresBrain: true,
              dispatchAlways: true,
            },
            seam.options,
          ),
        );

        then('the outcome is none — no brain is attributed', () => {
          // `genSeam`'s state carries `brain: null`, which is what an opted-in route looks
          // like before its first successful dispatch — and after a run of halted ones
          expect(outcome.outcome).toEqual('none');
          expect(seam.calls.read).toEqual(true);
        });
      });
    },
  );

  given('a CONCURRENT peer that already holds the dispatch claim', () => {
    // 🔴 the concurrency clamp. two hook processes on one route each end in a DETACHED
    //    `clone say` that writes into one pty; two interleave keystrokes into one line
    //
    // .why a claim, never a mutex = the child outlives any lock its parent holds; only a
    //    WINDOW sized to `clone say`'s submit-verify timeout bounds it
    [true, false].forEach((dispatchAlways) => {
      when(`[t0] a peer holds it, dispatchAlways=${dispatchAlways}`, () => {
        const seam = genSeam({ markerStone: '0', claimWon: false });
        const outcome = useThen('stands down', async () =>
          applyStoneBrainOnEntry(
            { stone, route: '/r', routeDeclaresBrain: true, dispatchAlways },
            seam.options,
          ),
        );

        then('NO dispatch is spawned', () => {
          // 🔴 the assertion that IS the repair. before the claim this read `true` on both
          //    rows, which is two `clone say` children in one pty
          expect(seam.calls.dispatched).toEqual(false);
        });

        then('the marker is NOT burned by the stand-down', () => {
          // .why = the peer that WON the claim marks the entry; a mark here would record a
          //        dispatch never made, and silence a later failure of the peer's switch
          expect(seam.calls.marked).toEqual(null);
        });

        then(
          'it renders `none`, so no duplicate line reaches the driver',
          () => {
            // .why = case=8's record is per SWITCH, never per process. the winner renders it
            expect(outcome.outcome).toEqual('none');
          },
        );

        then('and the claim is NOT released — its holder still owns it', () => {
          // .why = only the winner may release; a release here reopens the window mid-write
          expect(seam.calls.released).toEqual(0);
        });
      });
    });

    when(
      "[t0b] a peer holds it, and THIS stone's switch already landed",
      () => {
        const seam = genSeam({
          markerStone: '1',
          landedStone: '1',
          claimWon: false,
        });
        const outcome = useThen('stands down', async () =>
          applyStoneBrainOnEntry(
            {
              stone,
              route: '/r',
              routeDeclaresBrain: true,
              dispatchAlways: true,
            },
            seam.options,
          ),
        );

        then('no dispatch, and the landed brain still renders', () => {
          // .why = a re-drive inside the window is the common case: the driver re-runs
          //        `route.drive` on the stone it just entered, and must still read its brain
          expect(seam.calls.dispatched).toEqual(false);
          expect(outcome.outcome).toEqual('inherited');
        });
      },
    );

    when('[t1] this caller WINS the claim and the switch lands', () => {
      const seam = genSeam({ markerStone: '0' });
      const outcome = useThen('dispatches', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: true,
          },
          seam.options,
        ),
      );

      then('the switch is dispatched and the entry marked', () => {
        // .why = the control half. it proves [t0]'s silence comes from the CLAIM rather
        //        than from a gate that suppresses every dispatch
        expect(outcome.outcome).toEqual('requested');
        expect(seam.calls.dispatched).toEqual(true);
        expect(seam.calls.marked).toEqual('1');
      });

      then('the claim is HELD, never released, so the window stands', () => {
        // .why = the claim must outlive this process: the detached child is still mid-write
        expect(seam.calls.released).toEqual(0);
      });
    });

    when('[t2] this caller WINS the claim and the switch FAILS', () => {
      const seam = genSeam({ markerStone: '0', returns: undispatched });
      const outcome = useThen('attempts the switch', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          seam.options,
        ),
      );

      then('the claim is RELEASED, so the next tick retries at once', () => {
        // 🔴 .why = the claim is written BEFORE the dispatch; left after a FAILURE it would
        //    silence the retry for 15s. it suppresses a duplicate of a success, never a
        //    retry after a failure (`.dream/v2026_09_15.fix.stone-brain-undispatched-overload-and-retry-backoff.md`)
        expect(outcome.outcome).toEqual('undispatched');
        expect(seam.calls.released).toEqual(1);
      });

      then('and the marker is still not burned', () => {
        // .why = the two levers are independent and both are owed. a released claim with a
        //        burned marker would still go silent on the next tick
        expect(seam.calls.marked).toEqual(null);
      });
    });
  });

  given('a switch that FAILED to dispatch (undispatched)', () => {
    // 🔴 the retry clamp: a failed switch must NOT burn the entry marker, so the next onStop
    //    tick retries and a mid-session fix (rhx enroll / npm ci) self-heals
    when('the outcome is undispatched, on an onStop entry edge', () => {
      const seam = genSeam({ markerStone: '0', returns: undispatched });
      const outcome = useThen('attempts the switch', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          seam.options,
        ),
      );

      then('the brain IS dispatched but the entry is NOT marked', () => {
        expect(outcome.outcome).toEqual('undispatched');
        expect(seam.calls.dispatched).toEqual(true);
        // 🔴 the whole fix: no mark → `entered` stays true → the next tick retries
        expect(seam.calls.marked).toEqual(null);
      });
    });

    when('a SECOND consecutive onStop tick runs after the failure', () => {
      // the marker was never written, so the marker still records a DIFFERENT stone —
      // the second tick therefore computes `entered === true` and RE-ATTEMPTS the switch
      const seam = genSeam({ markerStone: '0', returns: undispatched });
      const outcome = useThen('retries the switch', async () =>
        applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          seam.options,
        ),
      );

      then('the switch is RE-ATTEMPTED, not silently skipped', () => {
        expect(outcome.outcome).toEqual('undispatched');
        expect(seam.calls.dispatched).toEqual(true);
        expect(seam.calls.marked).toEqual(null);
      });
    });
  });

  given('the RETRY CADENCE over consecutive onStop ticks', () => {
    /**
     * .what = the retry cadence, pinned in both directions
     * .why = a FAILED switch costs one dispatch per tick; a SUCCEEDED one costs exactly one.
     *        the second half proves the first is the MARKER at work
     *
     * .note = this pins the CURRENT cost (no backoff). when the `F21` dwell lands, the
     *         failed-tick row must change, with its number re-argued
     */
    const TICKS = 4;
    const TICK_INDEXES = [...Array(TICKS).keys()];

    /**
     * .what = a seam whose entry marker PERSISTS across calls, as the disk does
     * .why = `genSeam` returns a fixed marker, and a cadence needs state between ticks
     *
     * .note = `disk` is a deliberate per-test accumulator for the one file this op touches
     */
    const genSeamPersisted = (input: {
      markerStone: string | null;
      returns?: StoneBrainOutcome;
    }) => {
      const disk = {
        stone: input.markerStone,
        brain: null as DriveBrainInheritance | null,
      };
      const calls = { dispatches: 0, marks: 0, claims: 0, releases: 0 };
      return {
        calls,
        options: {
          getState: async () =>
            new DriveBlockerState({
              count: 0,
              stone: disk.stone,
              brain: disk.brain,
            }),
          setBrain: async () => {
            calls.dispatches += 1;
            return input.returns ?? requested;
          },
          setEntry: async (i: {
            route: string;
            stone: string;
            brain: string | null;
            effort: string | null;
          }) => {
            calls.marks += 1;
            disk.stone = i.stone;
            // the attribution rides the marker's write, so the two cannot drift.
            // .note = naught dispatched keeps the prior record, as the real op does
            disk.brain =
              i.brain || i.effort
                ? new DriveBrainInheritance({
                    slug: i.brain,
                    effort: i.effort,
                    stone: i.stone,
                  })
                : disk.brain;
            return {
              state: new DriveBlockerState({
                count: 0,
                stone: i.stone,
                brain: disk.brain,
              }),
            };
          },
          // .why the claim always grants = the rows below then measure the MARKER alone
          genClaim: async () => {
            calls.claims += 1;
            return { won: true };
          },
          delClaim: async () => {
            calls.releases += 1;
          },
        },
      };
    };

    /**
     * .what = drives `TICKS` consecutive onStop ticks against ONE seam, in order
     * .note = sequential; a `Promise.all` would race every tick against one marker
     */
    const runTicks = async (input: {
      options: NonNullable<Parameters<typeof applyStoneBrainOnEntry>[1]>;
    }): Promise<StoneBrainOutcome[]> => {
      const outcomes: StoneBrainOutcome[] = [];
      for (const tick of TICK_INDEXES)
        outcomes[tick] = await applyStoneBrainOnEntry(
          {
            stone,
            route: '/r',
            routeDeclaresBrain: true,
            dispatchAlways: false,
          },
          input.options,
        );
      return outcomes;
    };

    when(`[t0] the switch FAILS on every one of ${TICKS} ticks`, () => {
      const seam = genSeamPersisted({
        markerStone: '0',
        returns: undispatched,
      });
      const outcomes = useThen('every tick returns undispatched', async () =>
        runTicks({ options: seam.options }),
      );

      then('EVERY tick re-attempts — no backoff, no dwell, no breaker', () => {
        // .why an exact count = `toBeGreaterThan(1)` stays green under a dwell
        expect(seam.calls.dispatches).toEqual(TICKS);
        // .note = indexed, never `.map`. `useThen` hands back a proxy that defers ACCESS,
        //         so a method call on it is not the array's own method
        expect(TICK_INDEXES.map((tick) => outcomes[tick]!.outcome)).toEqual(
          Array(TICKS).fill('undispatched'),
        );
      });

      then('and the marker is never burned, so the retry can self-heal', () => {
        // .why = a mark would silence tick N+1; a mid-session `rhx enroll` must self-heal
        expect(seam.calls.marks).toEqual(0);
      });
    });

    when(`[t1] the switch SUCCEEDS on the first of ${TICKS} ticks`, () => {
      const seam = genSeamPersisted({ markerStone: '0' });
      const outcomes = useThen('the first tick dispatches', async () =>
        runTicks({ options: seam.options }),
      );

      then('exactly ONE dispatch happens — the rest are spared', () => {
        // .why = the control half: [t0]'s count comes from the MARKER, not a blind re-run
        expect(seam.calls.dispatches).toEqual(1);
        expect(seam.calls.marks).toEqual(1);
      });

      then(
        'and every later tick renders the landed switch, with no subprocess spawn',
        () => {
          expect(TICK_INDEXES.map((tick) => outcomes[tick]!.outcome)).toEqual([
            'requested',
            ...Array(TICKS - 1).fill('inherited'),
          ]);
        },
      );
    });
  });
});
