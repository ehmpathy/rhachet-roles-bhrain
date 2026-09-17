import { BadRequestError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';
import { type Bottleneck, genBottleneck } from 'with-bottleneck';

import { getOneReviewLevelPourBound } from './getOneReviewLevelPourBound';
import { runWithinConcurrencyBounds } from './runWithinConcurrencyBounds';

/**
 * .what = a promise the test holds open, so every lane can be observed in flight
 * .why  = a bound is only observable while lanes are BLOCKED on it. a lane that
 *         completes before its co-members launch proves no bound at all
 */
const genGate = () => {
  const state: { open: () => void } = { open: () => undefined };
  const promise = new Promise<void>((resolve) => {
    state.open = () => resolve();
  });
  return { promise, open: () => state.open() };
};

/**
 * .what = one lane that announces its entry, waits on the gate, announces its exit
 * .why  = the timeline is the observation. max-in-flight and starvation are both
 *         read off it, so neither needs a timer nor a sampled count
 */
const genLane =
  (input: { name: string; gate: Promise<void>; log: string[] }) =>
  async (): Promise<string> => {
    input.log.push(`${input.name}.enter`);
    await input.gate;
    input.log.push(`${input.name}.exit`);
    return input.name;
  };

/**
 * .what = the highest number of lanes ever in flight at one instant
 * .why  = a count sampled once can miss the peak; a fold over the whole timeline
 *         cannot
 */
const getMaxInFlight = (input: { log: string[] }): number =>
  input.log.reduce(
    (acc, event) => {
      const now = event.endsWith('.enter') ? acc.now + 1 : acc.now - 1;
      return { now, max: Math.max(acc.max, now) };
    },
    { now: 0, max: 0 },
  ).max;

/** .what = drains every queued microtask and one macrotask turn */
const flush = async (): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, 20));

/**
 * .what = launches N lanes through the bounds, holds them, reports what got in
 * .why  = every bound case below is the same experiment with different numbers
 */
const measureAdmitted = async (input: {
  lanes: { name: string; group: string | null }[];
  level: Bottleneck;
  byGroup: Map<string, Bottleneck>;
}): Promise<{ log: string[]; maxInFlight: number }> => {
  const log: string[] = [];
  const gate = genGate();

  const poured = input.lanes.map(
    async (lane) =>
      await runWithinConcurrencyBounds({
        group: lane.group,
        level: input.level,
        byGroup: input.byGroup,
        run: genLane({ name: lane.name, gate: gate.promise, log }),
      }),
  );

  await flush();
  const admitted = [...log];

  gate.open();
  await Promise.all(poured);

  return { log: admitted, maxInFlight: getMaxInFlight({ log: admitted }) };
};

describe('runWithinConcurrencyBounds', () => {
  given('[case1] four ungrouped lanes at a level bounded to two', () => {
    when('[t0] all four are poured at once', () => {
      const measured = useThen('the pour settles', async () =>
        measureAdmitted({
          lanes: [1, 2, 3, 4].map((n) => ({ name: `u${n}`, group: null })),
          level: genBottleneck({ concurrency: 2 }),
          byGroup: new Map(),
        }),
      );

      then('exactly two are in flight — the level bound holds', () => {
        expect(measured.maxInFlight).toEqual(2);
      });
    });
  });

  given('[case2] a group NARROWER than its level', () => {
    when(
      '[t0] three members of a group of one pour at a level of three',
      () => {
        const measured = useThen('the pour settles', async () =>
          measureAdmitted({
            lanes: [1, 2, 3].map((n) => ({
              name: `g${n}`,
              group: 'anthropic',
            })),
            level: genBottleneck({ concurrency: 3 }),
            byGroup: new Map([
              ['anthropic', genBottleneck({ concurrency: 1 })],
            ]),
          }),
        );

        then('exactly one is in flight — the narrower bound governs', () => {
          expect(measured.maxInFlight).toEqual(1);
        });
      },
    );
  });

  given('[case3] a group WIDER than its level', () => {
    /**
     * .note = this is the `min(group, level)` claim the extant comment asserted
     *         and no test reached. a group declared at 10 must still pour at the
     *         level's 2, or a wide group is a hole in the level bound
     */
    when('[t0] four members of a group of ten pour at a level of two', () => {
      const measured = useThen('the pour settles', async () =>
        measureAdmitted({
          lanes: [1, 2, 3, 4].map((n) => ({ name: `g${n}`, group: 'local' })),
          level: genBottleneck({ concurrency: 2 }),
          byGroup: new Map([['local', genBottleneck({ concurrency: 10 })]]),
        }),
      );

      then(
        'exactly two are in flight — the nest yields min(group, level)',
        () => {
          expect(measured.maxInFlight).toEqual(2);
        },
      );
    });
  });

  given(
    '[case4] a grouped lane beside an ungrouped one, the group saturated',
    () => {
      /**
       * .note = this is the ORDER clamp, and the only case that can tell the two
       *         nest orders apart. group OUTSIDE: the blocked member `g2` holds no
       *         level slot, so `u1` takes the free one and runs. level OUTSIDE:
       *         `g2` parks a level slot it cannot use, and `u1` is STARVED
       */
      when(
        '[t0] two members of a group of one pour beside an ungrouped lane',
        () => {
          const measured = useThen('the pour settles', async () =>
            measureAdmitted({
              lanes: [
                { name: 'g1', group: 'anthropic' },
                { name: 'g2', group: 'anthropic' },
                { name: 'u1', group: null },
              ],
              level: genBottleneck({ concurrency: 2 }),
              byGroup: new Map([
                ['anthropic', genBottleneck({ concurrency: 1 })],
              ]),
            }),
          );

          then(
            'the ungrouped lane runs — it was not starved by a blocked member',
            () => {
              expect(measured.log).toContain('u1.enter');
            },
          );

          then('the blocked group member holds no level slot', () => {
            expect(measured.log).not.toContain('g2.enter');
          });

          then('both level slots are spent on lanes that can USE them', () => {
            expect(measured.maxInFlight).toEqual(2);
          });
        },
      );
    },
  );

  given('[case5] a lane that names a group with no bound declared', () => {
    /**
     * .note = a direct await rather than `useThen`. the refusal is an in-process
     *         throw with no i/o, so there is no expensive result to share — and
     *         `useThen` hands back a PROXY, which `toBeInstanceOf` cannot see
     *         through. the class is the claim here, so the proxy is not usable
     */
    const genRefusal = async () =>
      await getError(
        runWithinConcurrencyBounds({
          group: 'undeclared',
          level: genBottleneck({ concurrency: 2 }),
          byGroup: new Map([['anthropic', genBottleneck({ concurrency: 1 })]]),
          run: async () => 'ran',
        }),
      );

    when('[t0] it is poured', () => {
      then('it throws loudly rather than pours unbounded', async () => {
        expect(await genRefusal()).toBeInstanceOf(BadRequestError);
      });

      then('the error names the group that could not resolve', async () => {
        expect((await genRefusal()).message).toContain('undeclared');
      });

      then('the error names the fix', async () => {
        expect((await genRefusal()).message).toContain(
          'reviews.groups.undeclared.concurrency',
        );
      });
    });
  });

  given(
    '[case6] 🔴 the F13 hazard — an ungrouped lane pours past its level-mate group bound',
    () => {
      /**
       * .what = the hazard `RouteStoneGuardReviewPeer.group` documents, measured
       *         rather than described
       *
       * .why  = F13 is the lowest-confidence entry on this feature's fulcrum
       *         board (84%), and its whole mitigation is a docblock. a docblock
       *         states the hazard; this states its CONSEQUENCE, so the residual
       *         risk is demonstrated rather than only argued in prose
       *
       * .note = it clamps the CURRENT behavior, which is the hazardous one — on
       *         purpose. F13's option D (require `group:` on every reviewer) and
       *         option G (advise at the pour) would each move this number, so a
       *         traveler who lands either goes red HERE and learns which
       *         disposition they changed. ⚠️ a gap no test describes is
       *         invisible to a silent fix, which is the one way this hazard
       *         could be closed without the council that owns it
       *
       * .note = the AUTHOR's mistake is out of reach at every grain, and that is
       *         why F13 stays open. no test can know the author believed
       *         `anthropic` was their only lane on that resource. what IS
       *         reachable is the mechanical half — a bound declared at 1 admits
       *         2 — and that half carries the hazard's whole teeth
       */
      const GROUP_BOUND = 1;

      when('[t0] one group member pours beside one ungrouped lane', () => {
        const measured = useThen('the pour settles', async () =>
          measureAdmitted({
            lanes: [
              { name: 'g1', group: 'anthropic' },
              { name: 'u1', group: null },
            ],
            // the repo default, so this is the shape a real guard carries
            level: genBottleneck({ concurrency: 10 }),
            byGroup: new Map([
              ['anthropic', genBottleneck({ concurrency: GROUP_BOUND })],
            ]),
          }),
        );

        then('the group member runs', () => {
          expect(measured.log).toContain('g1.enter');
        });

        then(
          'the ungrouped lane runs BESIDE it, untouched by the group bound',
          () => {
            expect(measured.log).toContain('u1.enter');
          },
        );

        then(
          'so in-flight EXCEEDS the bound the author declared for that resource',
          () => {
            expect(measured.maxInFlight).toBeGreaterThan(GROUP_BOUND);
            expect(measured.maxInFlight).toEqual(2);
          },
        );
      });
    },
  );

  given('[case7] one group whose members SPAN two levels', () => {
    /**
     * .what = the same group bound, reused across two sequential level pours
     *
     * .why  = a group is keyed by name, never by level, so an author who tags
     *         reviewers at l1 and l3 with one `group:` hands both pours the SAME
     *         `Bottleneck` instance. that is safe only if every slot it hands out
     *         is returned, and a semaphore that leaks a slot does not fail loud —
     *         it STARVES the later level, which reads as a hung reviewer
     *
     * .note = the second pour is the assertion. the first exists only to spend
     *         the bound's slots, so the second measures whether they came back
     *
     * ⚠️ .the bound = this proves the SETTLE path only. the REJECT path is
     *     `[case8]`/`[case9]`, added at i031/r7 — this case once claimed no
     *     teeth proof was owed for it, and that claim was wrong: the property
     *     belongs to a third-party semaphore, so it was assumed rather than
     *     measured
     */
    const bound = genBottleneck({ concurrency: 1 });
    const byGroup = new Map([['anthropic', bound]]);

    when('[t0] two members pour at the first level', () => {
      const first = useThen('the first pour settles', async () =>
        measureAdmitted({
          lanes: [1, 2].map((n) => ({ name: `a${n}`, group: 'anthropic' })),
          level: genBottleneck({ concurrency: 10 }),
          byGroup,
        }),
      );

      then('the group bound governs — one in flight', () => {
        expect(first.maxInFlight).toEqual(1);
      });
    });

    when('[t1] two more members pour at the next level', () => {
      const second = useThen('the second pour settles', async () =>
        measureAdmitted({
          lanes: [3, 4].map((n) => ({ name: `a${n}`, group: 'anthropic' })),
          level: genBottleneck({ concurrency: 10 }),
          byGroup,
        }),
      );

      then('the later level is NOT starved — a slot came back', () => {
        expect(second.log).toContain('a3.enter');
      });

      then('and the shared bound still governs it', () => {
        expect(second.maxInFlight).toEqual(1);
      });
    });
  });

  given('[case8] a lane whose run REJECTS, at a bound of one', () => {
    /**
     * .what = the reject path's slot-release, proven rather than assumed
     *
     * .why  = `runOneStoneGuardReview` can throw — a disk write failure on the
     *         artifact, a `BadRequestError` from `validateNoNpx`, an
     *         `UnexpectedCodePathError` in `asEventReviewer`. the pour is
     *         `Promise.allSettled`, so the rejection is captured and re-thrown
     *         after the level settles. but that says no word about whether the
     *         `Bottleneck` token the lane HELD comes back.
     *
     *         🔴 if it does not, one thrown lane permanently narrows the bound
     *         for the rest of the pass, and the symptom is a hung reviewer at a
     *         later level rather than a loud failure — intermittent, silent, and
     *         on the one feature whose whole claim is a predictable bound
     *         (`rule.forbid.behavior-hazards`). raised i031/r7 blocker.1
     *
     * .note = `[case7]` proves slots return across two pours that SETTLE. this
     *         is the arm it does not reach, and it reads the SAME shared bound
     *         instance across the two pours so a leak cannot hide behind a fresh
     *         semaphore
     *
     * ⚠️ .the teeth = there is no arm to revert here, because the property is
     *     owned by the dependency. to prove it bites, wrap the `schedule` call
     *     in `runWithinConcurrencyBounds` so it swallows the rejection and never
     *     resolves — `[t1]` then hangs on a slot that never returns
     */
    const bound = genBottleneck({ concurrency: 1 });
    const byGroup = new Map([['anthropic', bound]]);

    when('[t0] the only member of the group throws', () => {
      // .note = a direct await rather than `useThen`, for `[case5]`'s reason —
      //         the proxy cannot be read through, and the message is the claim
      then('the rejection surfaces, and is not swallowed', async () => {
        const thrown = await getError(
          runWithinConcurrencyBounds({
            group: 'anthropic',
            level: genBottleneck({ concurrency: 10 }),
            byGroup,
            run: async () => {
              throw new BadRequestError('the lane blew up mid-flight');
            },
          }),
        );
        expect(thrown.message).toContain('the lane blew up mid-flight');
      });
    });

    when('[t1] two more members pour through the SAME bound after', () => {
      const after = useThen('the second pour settles', async () =>
        measureAdmitted({
          lanes: [1, 2].map((n) => ({ name: `a${n}`, group: 'anthropic' })),
          level: genBottleneck({ concurrency: 10 }),
          byGroup,
        }),
      );

      then('a slot came back — the thrown lane did not leak it', () => {
        expect(after.log).toContain('a1.enter');
      });

      then('and the bound still governs at its declared width', () => {
        expect(after.maxInFlight).toEqual(1);
      });
    });
  });

  given('[case9] a lane whose run REJECTS, at a LEVEL bound of one', () => {
    /**
     * .what = the same proof for the ungrouped reach, which takes the level slot
     *         directly rather than through a group
     *
     * .why  = `runWithinConcurrencyBounds` has two arms, and they acquire from
     *         two different semaphores. a leak proof for one says no word about
     *         the other — and the ungrouped arm is the one every l1 lane in this
     *         repo's own guard takes
     */
    const level = genBottleneck({ concurrency: 1 });

    when('[t0] the ungrouped lane throws', () => {
      // .note = a direct await rather than `useThen`, for `[case5]`'s reason
      then('the rejection surfaces, and is not swallowed', async () => {
        const thrown = await getError(
          runWithinConcurrencyBounds({
            group: null,
            level,
            byGroup: new Map(),
            run: async () => {
              throw new BadRequestError('the ungrouped lane blew up');
            },
          }),
        );
        expect(thrown.message).toContain('the ungrouped lane blew up');
      });
    });

    when(
      '[t1] two more ungrouped lanes pour through the SAME level bound',
      () => {
        const after = useThen('the second pour settles', async () =>
          measureAdmitted({
            lanes: [1, 2].map((n) => ({ name: `u${n}`, group: null })),
            level,
            byGroup: new Map(),
          }),
        );

        then('a slot came back — the thrown lane did not leak it', () => {
          expect(after.log).toContain('u1.enter');
        });

        then('and the level bound still governs at its declared width', () => {
          expect(after.maxInFlight).toEqual(1);
        });
      },
    );
  });

  /**
   * .what = the CROSS-MODEL clamp — the ANNOUNCED bound and the ENFORCED bound
   *         are one number, checked, never two formulas kept in step by comment
   *
   * .why  = `getOneReviewLevelPourBound` (the announce arithmetic) and this
   *         scheduler are two independent models of one cap. both docblocks admit
   *         it and ask a future author to hold them in lockstep by hand. this
   *         asserts that lockstep MECHANICALLY: per roster, the peak the scheduler
   *         admits equals the number the arithmetic announces — or the whole
   *         roster, where the arithmetic answers null (a bound that binds naught).
   *         reverse the nest in `runWithinConcurrencyBounds` or drop a `min` from
   *         the arithmetic and a row here goes red. raised i019/r011 blocker.1
   *
   * .note = the last two rows ARE this route's own dogfood — an l1 of nine behind
   *         a group bound of seven admits seven; an l3 of two behind a bound of
   *         three admits two, and the arithmetic answers null (the bound is inert)
   */
  const CROSS_MODEL_CASES: {
    name: string;
    lanes: { name: string; group: string | null }[];
    levelConcurrency: number;
    groups: Record<string, { concurrency: number }>;
    announced: number | null;
  }[] = [
    {
      name: 'four ungrouped at a level of two',
      lanes: [1, 2, 3, 4].map((n) => ({ name: `u${n}`, group: null })),
      levelConcurrency: 2,
      groups: {},
      announced: 2,
    },
    {
      name: 'three in a group of one at a level of three',
      lanes: [1, 2, 3].map((n) => ({ name: `g${n}`, group: 'a' })),
      levelConcurrency: 3,
      groups: { a: { concurrency: 1 } },
      announced: 1,
    },
    {
      name: 'four in a group of ten at a level of two',
      lanes: [1, 2, 3, 4].map((n) => ({ name: `g${n}`, group: 'a' })),
      levelConcurrency: 2,
      groups: { a: { concurrency: 10 } },
      announced: 2,
    },
    {
      name: 'a group of two behind a bound of five — inert, announces null',
      lanes: [1, 2].map((n) => ({ name: `g${n}`, group: 'a' })),
      levelConcurrency: 10,
      groups: { a: { concurrency: 5 } },
      announced: null,
    },
    {
      name: 'dogfood l1 — nine behind a group bound of seven',
      lanes: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
        name: `l1-${n}`,
        group: 'L1',
      })),
      levelConcurrency: 10,
      groups: { L1: { concurrency: 7 } },
      announced: 7,
    },
    {
      name: 'dogfood l3 — two behind a group bound of three, inert',
      lanes: [1, 2].map((n) => ({ name: `l3-${n}`, group: 'L3' })),
      levelConcurrency: 10,
      groups: { L3: { concurrency: 3 } },
      announced: null,
    },
  ];

  // 🔴 [case10..] and NOT [case8] — the six below once shared the id of the
  //    reject-path `given('[case8] …')` above, so the case-identity keys in this
  //    one suite were not unique and a reader could not part the reject path
  //    from the cross-model arithmetic by id alone. raised i020/r9 nitpick.1
  //
  //    ⇒ the index is `+ 10`, which keeps each cross-model case at a STABLE id
  //    of its own rather than a shared one. append to `CROSS_MODEL_CASES` and
  //    the new entry takes the next free id; it does not renumber its peers
  CROSS_MODEL_CASES.forEach((testCase, testCaseIdx) =>
    given(
      `[case${testCaseIdx + 10}] cross-model bound — ${testCase.name}`,
      () => {
        const announced = getOneReviewLevelPourBound({
          members: testCase.lanes.map((lane) => ({ group: lane.group })),
          levelConcurrency: testCase.levelConcurrency,
          groups: testCase.groups,
        });

        // the cap the pour must honor: the announced number, or the whole roster
        // where the arithmetic answers null (a bound that admits every member)
        const effective = announced ?? testCase.lanes.length;

        when('[t0] the arithmetic computes the announced bound', () => {
          then('it matches the declared expectation', () => {
            expect(announced).toEqual(testCase.announced);
          });
        });

        when('[t1] the scheduler pours the same roster', () => {
          const measured = useThen('the pour settles', async () =>
            measureAdmitted({
              lanes: testCase.lanes,
              level: genBottleneck({ concurrency: testCase.levelConcurrency }),
              byGroup: new Map(
                Object.entries(testCase.groups).map(([groupName, bound]) => [
                  groupName,
                  genBottleneck({ concurrency: bound.concurrency }),
                ]),
              ),
            }),
          );

          then(
            'the observed peak equals the announced cap — one bound, two models',
            () => {
              expect(measured.maxInFlight).toEqual(effective);
            },
          );
        });
      },
    ),
  );
});
