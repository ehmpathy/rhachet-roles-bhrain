import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getOneWarmerCost } from '@src/domain.operations/review/warmer/getOneWarmerCost';
import { NAME_OF_WARMER_ROWS } from '@src/domain.operations/review/warmer/setOneWarmerPokeRow';

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * .what = clamps the join `0.wish` bar 9 exists for — a warmer's rows, read back
 *         by the surface that reports what a round cost
 *
 * .why = bar 9 is three claims and only two were met: the rows land in the run
 *        dir (name, tested) and a suite asserts they land there, and no cost
 *        surface ever opened them. the grep that proved it returned the warmer
 *        and its own tests, and naught else (F27).
 *
 * .note = the fixtures are written by hand rather than by a warmer run, because the
 *         two acts under test — a DEFER that spends naught, and an ABSENT file —
 *         are states a live warmer reaches only on a clock this suite cannot wait
 *         out.
 */
const setOneRunDir = (input: {
  slug: string;
  rows: string[] | null;
}): string => {
  const dir = genTempDir({ slug: input.slug });
  if (input.rows !== null)
    fs.writeFileSync(
      path.join(dir, NAME_OF_WARMER_ROWS),
      `${input.rows.join('\n')}\n`,
    );
  return dir;
};

/**
 * .what = reads a run dir once and records whether the read resolved or rejected
 * .why = the reject cases assert several facts of one read, so they share one
 *        call via `useThen`. the outcome rides in a plain object, since the
 *        `useThen` proxy does not carry an Error instance through itself
 */
const getOneWarmerCostOutcome = async (input: {
  dir: string;
}): Promise<{ outcome: string; error: unknown }> =>
  getOneWarmerCost({ dir: input.dir }).then(
    () => ({ outcome: 'resolved', error: null }),
    (error: unknown) => ({ outcome: 'rejected', error }),
  );

const asPokeRow = (input: {
  attempt: number;
  hit: boolean;
  cost: string;
}): string =>
  JSON.stringify({
    at: `2026-09-24T16:3${input.attempt}:00.000Z`,
    reviewer: 'repo-rules',
    attempt: input.attempt,
    act: 'poke',
    why: '15m since the last touch',
    measured: {
      promptTokens: 3_225,
      cacheGetTokens: input.hit ? 3_224 : 0,
      hit: input.hit,
      cost: input.cost,
    },
  });

const ROW_OF_DEFER = JSON.stringify({
  at: '2026-09-24T16:31:00.000Z',
  reviewer: 'repo-rules',
  attempt: 1,
  act: 'defer',
  why: 'a real review touched this prefix 0m ago',
  measured: null,
});

/**
 * .note = a faulted attempt shares `measured: null` with a defer and a retire, and
 *         is the one of the three that MAY HAVE BILLED — `setReviewWarmerPokes`
 *         states it plainly: a timeout abandons our wait and cannot cancel the
 *         provider's work. so the three cannot be read off `measured === null`
 *         alone. that predicate parts a poke from the rest; the ACT parts a
 *         measured naught from an unmeasured maybe.
 */
/**
 * .what = the TERMINATOR — the row a healthy warmer writes when its plan is spent
 * .why = it measures naught, so it changes no sum and adds one fact: this ledger
 *        is complete. with no terminator at the tail, a record cannot be told
 *        from one that stopped — `setReviewWarmerPokes`'s own phrase for the
 *        harm, and the read `[case6]` clamps.
 */
const ROW_OF_RETIRE = JSON.stringify({
  at: '2026-09-24T16:45:00.000Z',
  reviewer: 'repo-rules',
  attempt: 3,
  act: 'retire',
  why: 'the plan is spent — 3 of 3 attempts',
  measured: null,
});

const ROW_OF_FAULT = JSON.stringify({
  at: '2026-09-24T16:32:00.000Z',
  reviewer: 'repo-rules',
  attempt: 2,
  act: 'fault',
  why: 'Error: timeout of 120000ms exceeded',
  measured: null,
});

/**
 * .why = every case wraps its result in an object because `useBeforeAll` answers a
 *        proxy that defers the read to property-access time, so
 *        `expect(proxy).toEqual(null)` can never pass, and — the sharp half —
 *        `expect(proxy).not.toEqual(null)` can never fail. a first draft asserted
 *        both directly and had a false green on the very distinction this suite
 *        exists to clamp. the wrapper makes the null a property, which the proxy
 *        reads through.
 */
describe('getOneWarmerCost', () => {
  given('[case1] a run a warmer poked twice — one miss, one hit', () => {
    const read = useBeforeAll(async () => ({
      spend: await getOneWarmerCost({
        dir: setOneRunDir({
          slug: 'warmer-spend-poked',
          rows: [
            // the measured live shape: poke 1 met a cold replica and billed in
            // full; poke 2 landed on the replica poke 1 populated. 37.7x apart
            asPokeRow({ attempt: 1, hit: false, cost: '$0.001383360' }),
            asPokeRow({ attempt: 2, hit: true, cost: '$0.000036648' }),
          ],
        }),
      }),
    }));

    when('[t0] the cost surface reads the run', () => {
      then('🔴 it FINDS the spend — the join bar 9 exists for', () => {
        expect(read.spend).not.toEqual(null);
      });

      then('it counts the pokes that were actually sent', () => {
        expect(read.spend?.pokes).toEqual(2);
      });

      then('🔴 it names the HITS beside them, never as a rate', () => {
        // a rate of 50% hides that the miss cost 37.7x the hit. the two terms are
        // not interchangeable and the surface must not average them
        expect(read.spend?.hits).toEqual(1);
      });

      then('and it sums what the pokes measured, never a projection', () => {
        // 0.001383360 + 0.000036648, summed at full precision rather than rounded
        // to a display width — a bill of many sub-cent pokes rounds to zero.
        // words, never the human form — this figure is summed across runs into
        // the net a verdict reads, so it rides in the canonical glossary form
        expect(read.spend?.cost).toEqual('USD 0.001_420_008');
      });
    });
  });

  given('[case2] a run whose warmer only ever DEFERRED', () => {
    const read = useBeforeAll(async () => ({
      spend: await getOneWarmerCost({
        dir: setOneRunDir({
          slug: 'warmer-spend-deferred',
          rows: [ROW_OF_DEFER, ROW_OF_DEFER],
        }),
      }),
    }));

    when('[t0] the cost surface reads the run', () => {
      then('🔴 it reports a warmer that RAN and spent naught', () => {
        // the protected-for-free case. it is a real fact and must not read as an
        // absent warmer (`0.wish` bar 16)
        expect(read.spend).not.toEqual(null);
        expect(read.spend?.pokes).toEqual(0);
      });

      then('a defer is not a poke, so it buys no hit either', () => {
        expect(read.spend?.hits).toEqual(0);
      });

      then(
        '🔴 and a defer is not a FAULT — it measured a naught it KNOWS',
        () => {
          // the assertion that parts the two predicates. a defer and a fault both
          // carry `measured: null`, so a fault count read off that field would
          // report 2 here and turn a protected-for-free run into a possibly-billed
          // one. the count must come from the act
          expect(read.spend?.faults).toEqual(0);
        },
      );
    });
  });

  given('[case3] a run no warmer ever protected', () => {
    const read = useBeforeAll(async () => ({
      spend: await getOneWarmerCost({
        dir: setOneRunDir({ slug: 'warmer-spend-absent', rows: null }),
      }),
    }));

    when('[t0] the cost surface reads the run', () => {
      then('🔴 it answers NULL, which is not the same fact as zero', () => {
        // the whole meter turns on this distinction (`getOneAccountedCost`): an absent
        // warmer was never there, a deferred one was there and cost naught. to
        // flatten them would state the first fact about the second case
        expect(read.spend).toEqual(null);
      });
    });
  });

  given('[case4] a warmer row that is present and unparseable', () => {
    const dir = setOneRunDir({
      slug: 'warmer-spend-torn',
      rows: [asPokeRow({ attempt: 1, hit: true, cost: '$0.00003' }), '{"at":'],
    });

    when('[t0] the cost surface reads the run', () => {
      const read = useThen('it reads', async () =>
        getOneWarmerCostOutcome({ dir }),
      );

      then('🔴 it FAILS LOUD rather than reads as an absent warmer', () => {
        // a warmer appends one whole row per write, so a torn line is a real defect
        // — to swallow it would under-report a bill and look identical to a clean
        // read (rule.forbid.failhide)
        expect(read.outcome).toEqual('rejected');
        expect(String(read.error)).toContain('present but unparseable');
      });

      then('and the error names the row and the dir', () => {
        const error = read.error;
        // the metadata form, never prose. the row rides beside `dir` in the
        // error's metadata bag, because the caller that catches this is the
        // meter's per-run isolation — it stringifies the throw into a `defect`
        // row, and metadata survives that hop as filterable keys where prose
        // arrives as prose. the `dir` assertion below already reads that form,
        // so a prose expectation here would hold one error to two shapes
        expect(String(error)).toContain('"row": 2');
        expect(String(error)).toContain(dir);
      });
    });
  });

  // .note = a parse fault of any other class (a RangeError from the engine) surfaces as
  //         itself. that allowlist is pure, so `asWarmerRowParseFault.test.ts` proves it
  //         with real error instances, never a mock of the parser here

  given('[case9] a ledger read while a warmer appends its next row', () => {
    /**
     * .why = a live warmer appends `${row}\n` while a cost read may run. a read that
     *        lands mid-append sees a complete row plus an unterminated partial tail —
     *        an append in flight, never a defect, so it must not fail the read
     */
    const read = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'warmer-spend-inflight' });
      fs.writeFileSync(
        path.join(dir, NAME_OF_WARMER_ROWS),
        `${asPokeRow({ attempt: 1, hit: true, cost: '$0.00003' })}\n{"at":"2026-09-24T16:3`,
      );
      return { spend: await getOneWarmerCost({ dir }) };
    });

    when('[t0] the cost surface reads the run', () => {
      then('🔴 it reads the complete rows and skips the tail in flight', () => {
        expect(read.spend?.pokes).toEqual(1);
        expect(read.spend?.hits).toEqual(1);
      });
    });
  });

  /**
   * .what = the warmer's own `unknown`, and the cell the `faults` field exists for
   * .why = a fault is the one act of the four that measured naught and MAY HAVE
   *        BILLED: `setReviewWarmerPokes` abandons the wait on a timeout, and
   *        abandonment cannot cancel the provider's work. so the sum of what the
   *        pokes measured is a floor. before this case, a fault was dropped by
   *        the same filter that drops a defer and a retire — so a run that
   *        faulted twice reported the same figure as one that faulted never, and
   *        `$0.001420008` read as a total rather than a floor. that is `0.wish`
   *        bar 4's inversion (`unknown` rendered as a measured nil) one layer
   *        below the run grade that already repairs it.
   */
  given('[case5] 🔴 a run whose warmer poked once and FAULTED once', () => {
    const read = useBeforeAll(async () => ({
      spend: await getOneWarmerCost({
        dir: setOneRunDir({
          slug: 'warmer-spend-faulted',
          rows: [
            asPokeRow({ attempt: 1, hit: false, cost: '$0.001383360' }),
            ROW_OF_FAULT,
          ],
        }),
      }),
    }));

    when('[t0] the cost surface reads the run', () => {
      then('the fault is NOT a poke — it measured naught to sum', () => {
        expect(read.spend?.pokes).toEqual(1);
        expect(read.spend?.cost).toEqual('USD 0.001_383_360');
      });

      then('🔴 but it is COUNTED, so the cost above reads as a FLOOR', () => {
        // the whole point. to drop it silent would report a possibly-billed act
        // as nil spend, which is the inversion bar 4 refuses
        expect(read.spend?.faults).toEqual(1);
      });
    });

    when('[t1] the same dir is read with the fault withheld', () => {
      const alone = useBeforeAll(async () => ({
        spend: await getOneWarmerCost({
          dir: setOneRunDir({
            slug: 'warmer-spend-unfaulted',
            rows: [asPokeRow({ attempt: 1, hit: false, cost: '$0.001383360' })],
          }),
        }),
      }));

      then('🔴 the two agree on COST and part on the fault count', () => {
        // the pair that proves the field bears weight rather than decorates. the
        // measured spend is identical, so `cost` alone cannot tell the two runs
        // apart — only `faults` can (rule.require.clamp-edge-cases)
        expect(alone.spend?.cost).toEqual(read.spend?.cost);
        expect(alone.spend?.faults).toEqual(0);
        expect(read.spend?.faults).toEqual(1);
      });
    });
  });

  /**
   * .why = the TERMINATOR, read. `setReviewWarmerPokes` writes a `retire` row on
   *        every healthy exit and states the harm of its absence in its own
   *        words — a record with no terminator cannot be told from a record
   *        that stopped. that sentence describes a reader, and until
   *        2026-09-25 no reader checked, so the terminator was written and
   *        nobody looked at it — `0.wish` bar 9's own failure a layer down,
   *        the one F27 closed for these rows: the write was clamped and the
   *        purpose was not.
   * .note = the tail it reads is reached by the one command this product
   *         documents. `emitReviewWarmerSpawn` prints `stop: kill <pid>`;
   *         node's default SIGTERM handler terminates with no JS unwind, so
   *         no `retire` row lands and `faults` stays 0 — exactly the shape a
   *         floor driven by faults alone misses.
   */
  given(
    '[case6] 🔴 a ledger with no terminator, beside one that has it',
    () => {
      const rowsOfPokes = [
        asPokeRow({ attempt: 1, hit: false, cost: '$0.001383360' }),
        asPokeRow({ attempt: 2, hit: true, cost: '$0.000036648' }),
      ];

      const unfinished = useBeforeAll(async () => ({
        spend: await getOneWarmerCost({
          dir: setOneRunDir({
            slug: 'warmer-spend-unterminated',
            rows: rowsOfPokes,
          }),
        }),
      }));

      const finished = useBeforeAll(async () => ({
        spend: await getOneWarmerCost({
          dir: setOneRunDir({
            slug: 'warmer-spend-terminated',
            rows: [...rowsOfPokes, ROW_OF_RETIRE],
          }),
        }),
      }));

      when('[t0] both are read', () => {
        then('🔴 they agree on every measured figure, to the cent', () => {
          // the pair that proves the field carries weight rather than decorates. a
          // `retire` measures naught, so the two ledgers are identical in cost, in
          // pokes, in hits, and in faults — and no extant field can part them
          // (rule.require.clamp-edge-cases)
          expect(finished.spend?.cost).toEqual(unfinished.spend?.cost);
          expect(finished.spend?.pokes).toEqual(unfinished.spend?.pokes);
          expect(finished.spend?.hits).toEqual(unfinished.spend?.hits);
          expect(finished.spend?.faults).toEqual(unfinished.spend?.faults);
          expect(finished.spend?.faults).toEqual(0);
        });

        then('🔴 and they part on the TERMINATOR alone', () => {
          expect(unfinished.spend?.truncated).toEqual(true);
          expect(finished.spend?.truncated).toEqual(false);
        });
      });

      when('[t1] a ledger ends on a FAULT', () => {
        /**
         * .note = a fault is not a terminator, and this is the case that says so.
         *         a warmer survives a fault and keeps its schedule, so a fault
         *         mid-plan is followed by more rows and then a `retire`. a fault
         *         at the tail therefore means what an absent terminator means —
         *         the plan did not finish. `setReviewWarmerPokes` names this
         *         exact tail as the sharpest one: "poke, poke, fault" is the log
         *         of a warmer that spent its budget and of one that died on a
         *         wedged provider with pokes still owed. the terminator is what
         *         parts them, and this asserts the reader uses it.
         */
        const faulted = useBeforeAll(async () => ({
          spend: await getOneWarmerCost({
            dir: setOneRunDir({
              slug: 'warmer-spend-fault-tail',
              rows: [...rowsOfPokes, ROW_OF_FAULT],
            }),
          }),
        }));

        then('🔴 it is truncated — a fault ends no plan', () => {
          expect(faulted.spend?.truncated).toEqual(true);
          expect(faulted.spend?.faults).toEqual(1);
        });
      });

      when('[t2] a ledger is EMPTY', () => {
        const empty = useBeforeAll(async () => ({
          spend: await getOneWarmerCost({
            dir: setOneRunDir({ slug: 'warmer-spend-empty', rows: [] }),
          }),
        }));

        then('🔴 it is NOT truncated — a warmer with naught to say yet', () => {
          // the boundary, and it is the reason the read is `rows.length > 0 && …`
          // rather than a bare tail check. an absent terminator over zero rows is a
          // warmer that has not reached its first wake, never a plan cut short — and
          // to grade it truncated would hang a floor caveat on every such run
          expect(empty.spend?.truncated).toEqual(false);
          expect(empty.spend?.pokes).toEqual(0);
        });

        then('🔴 and it is still a SPEND record, never a null', () => {
          // an empty file is a warmer that ran and has yet to act; an ABSENT file is a
          // run that spawned none. the two are different facts (`[case3]`)
          expect(empty.spend).not.toEqual(null);
        });
      });

      when('[t3] a warmer that could not boot its brain', () => {
        /**
         * .note = the ledger `review._.warmer` writes when its brain never boots: ONE
         *         `retire` at attempt 0, whose why names the boot. it is set beside
         *         the shape the boot once wrote — a lone `fault` — so the pair shows
         *         what the terminator buys: the same $0, read as a WHOLE ledger
         *         rather than a floor over a warmer "still AWAKE"
         */
        const rowOfBootRetire = JSON.stringify({
          at: '2026-09-24T16:30:00.000Z',
          reviewer: 'repo-rules',
          attempt: 0,
          act: 'retire',
          why: 'the warmer could not boot its brain, so it cost naught — BrainChoiceNotFoundError',
          measured: null,
        });
        const rowOfBootFault = JSON.stringify({
          ...JSON.parse(rowOfBootRetire),
          act: 'fault',
        });

        const booted = useBeforeAll(async () => ({
          spend: await getOneWarmerCost({
            dir: setOneRunDir({
              slug: 'warmer-spend-boot-retire',
              rows: [rowOfBootRetire],
            }),
          }),
        }));
        const faultedAtBoot = useBeforeAll(async () => ({
          spend: await getOneWarmerCost({
            dir: setOneRunDir({
              slug: 'warmer-spend-boot-fault',
              rows: [rowOfBootFault],
            }),
          }),
        }));

        then('🔴 the boot retire reads as a WHOLE ledger, no floor', () => {
          expect(booted.spend?.truncated).toEqual(false);
          expect(booted.spend?.faults).toEqual(0);
          expect(booted.spend?.pokes).toEqual(0);
        });

        then('🔴 where a lone boot fault would read as cut short', () => {
          // the shape the boot no longer writes, kept as the contrast
          expect(faultedAtBoot.spend?.truncated).toEqual(true);
          expect(faultedAtBoot.spend?.faults).toEqual(1);
        });
      });
    },
  );

  /**
   * .what = a ledger row whose `act` this reader does not know
   * .why = `asSpendGrade`'s `never` gate is the repair for a defect that already
   *        shipped — its own docblock says the prior shape could absorb a new
   *        member in silence, which is what it did, and the member was `fault`
   *        (`[case5]`). so the gate is not a hypothetical guard; it is a clamp
   *        on a recurrence. and until this case, nobody had proven it fires —
   *        every other row in this suite carries a declared act, so the
   *        default branch was unreachable from every test that existed.
   * .note = this is not a synthetic cast — it is the real forward-compat path.
   *         the ledger is a file, so a newer warmer can write an act an older
   *         reader was never compiled against, and the two versions coexist
   *         the moment a route outlives a release. two dreams already want a
   *         fifth act (`covered`, and a marker for a failed ledger write), so
   *         this row is what the next version writes and this version must
   *         refuse to price.
   */
  given(
    '[case7] a row written by a newer warmer, with an act this reader lacks',
    () => {
      const dir = setOneRunDir({
        slug: 'warmer-spend-unknown-act',
        rows: [
          asPokeRow({ attempt: 1, hit: true, cost: '$0.00003' }),
          JSON.stringify({
            at: '2026-09-25T16:31:00.000Z',
            reviewer: 'repo-rules',
            attempt: 2,
            act: 'covered',
            why: 'a real review already warmed this prefix, so the poke was skipped',
            measured: null,
          }),
          // the terminator isolates the gate under test. `getOneWarmerCost` holds
          // two `never` gates in series — `asSpendGrade`, and `isWarmerRowTerminal`
          // on the tail — so an unknown act at the tail is refused by whichever
          // gate runs first, and a neuter of one leaves the other to throw. with
          // no terminator, a neuter of `asSpendGrade` still went 1 of 3 red, with
          // the two survivors instead getting the second gate's throw — both
          // said "rejected", so the clamp could not tell which gate answered.
          // with `retire` at the tail the terminal read cannot fire, so all three
          // assertions bear on `asSpendGrade` alone (rule.require.clamp-edge-cases).
          // the defence-in-depth is a property of the operation, never a defect.
          ROW_OF_RETIRE,
        ],
      });

      when('[t0] the cost surface reads the run', () => {
        const read = useThen('it reads', async () =>
          getOneWarmerCostOutcome({ dir }),
        );

        then('🔴 it FAILS LOUD rather than prices the row as naught', () => {
          // the silent alternative is the defect this gate was built for: an unknown act
          // absorbed by the `measured === null` filter reads as "spent naught", so the
          // sum reports a total where the truth is a floor — `0.wish` bar 4's inversion,
          // committed a second time by the very shape that repaired it once
          expect(read.outcome).toEqual('rejected');
          expect(String(read.error)).toContain('carries no spend grade');
        });

        then('and the error names the act, so the gap is traceable', () => {
          // an author who ships a fifth act and trips this needs to know which one —
          // otherwise the throw sends them to read a union they just edited
          expect(String(read.error)).toContain('covered');
        });

        then('the whole refusal renders as snapped', () => {
          // the fragments above pin the two facts; the snapshot pins the render, so a
          // reword or a reformat of the error body goes red in review
          // (rule.require.contract-snapshot-exhaustiveness)
          expect(String(read.error)).toMatchSnapshot();
        });

        then(
          '🔴 and it does NOT report the poke it managed to read first',
          () => {
            // the sharp half. the unknown row sits second, so a reader that summed as it
            // went would have a valid `$0.00003` in hand when it hit the gate. to return
            // that partial figure would be the worst of the three outcomes: a real
            // number, lower than the truth, with no caveat at all
            expect(read.outcome).toEqual('rejected');
          },
        );
      });
    },
  );

  /**
   * .why = the row that is structurally valid and materially torn — `act: 'poke'`
   *        beside `measured: null`. every other absence in this file is loud: a
   *        bad JSON line throws (`[case4]`), an unknown act throws (`[case7]`),
   *        an absent file answers null (`[case3]`). this one slipped between
   *        all three, because it parses, its act is known, and its file is
   *        present. the prior read was `row.measured?.cost ?? '$0'`, so the row
   *        folded in as a poke that cost naught — and `measured?.hit` read its
   *        hit as `false` beside it. one torn row thus rendered a whole
   *        confident sentence: `$0 over 1 pokes, 0 of which HIT` — `0.wish` bar
   *        4's inversion at its purest: a nil that is an absence, printed as a
   *        nil that is a fact (rule.forbid.failhide).
   * .note = the type cannot catch it HERE. `WarmerPokeRow` is a union on `act`, so
   *         this repo's code cannot build the row (`WarmerPokeRow.test.ts` clamps
   *         that) — but this read gets it as `JSON.parse(line) as WarmerPokeRow`, a
   *         cast over a file a prior tool version or any hand can have written. so
   *         the guard at the parse boundary is a runtime read, and stays.
   */
  given(
    '[case8] 🔴 a poke row that parses, with no measurement inside it',
    () => {
      const ROW_OF_TORN_POKE = JSON.stringify({
        at: '2026-09-24T16:31:00.000Z',
        reviewer: 'repo-rules',
        attempt: 1,
        act: 'poke',
        why: '15m since the last touch',
        measured: null,
      });

      when('[t0] the torn row sits ALONE in the ledger', () => {
        const dir = setOneRunDir({
          slug: 'warmer-spend-poke-unmeasured',
          rows: [ROW_OF_TORN_POKE],
        });

        const read = useThen('it reads', async () =>
          getOneWarmerCostOutcome({ dir }),
        );

        then('🔴 it FAILS LOUD rather than prices the poke at $0', () => {
          expect(read.outcome).toEqual('rejected');
          expect(String(read.error)).toContain('carries no measurement');
        });

        then('and the error names the row, the attempt, and the lane', () => {
          // the metadata form, per `[case4]`'s own note: the meter's per-run
          // isolation stringifies this throw into a `defect` row, and metadata
          // survives that hop as filterable keys where prose arrives as prose
          const error = read.error;
          expect(String(error)).toContain('"row": 1');
          expect(String(error)).toContain('"attempt": 1');
          expect(String(error)).toContain('repo-rules');
        });
      });

      when('[t1] the torn row sits BESIDE two measured pokes', () => {
        const dir = setOneRunDir({
          slug: 'warmer-spend-poke-unmeasured-mixed',
          rows: [
            asPokeRow({ attempt: 1, hit: false, cost: '$0.001383360' }),
            ROW_OF_TORN_POKE,
            asPokeRow({ attempt: 3, hit: true, cost: '$0.000036648' }),
          ],
        });

        /**
         * .note = the sharp half, and the same one `[case7]` makes: a partial
         *         figure is the worst of the three outcomes. a reader that
         *         summed as it went would hold a real `$0.001383360` when it
         *         reached the torn row — a number that is correct, lower than
         *         the truth, and carries no caveat at all.
         */
        const read = useThen('it reads', async () =>
          getOneWarmerCostOutcome({ dir }),
        );

        then('🔴 it reports NO figure, not the pokes it read first', () => {
          expect(read.outcome).toEqual('rejected');
        });

        then(
          'and it names the row by its LEDGER position, never its poke index',
          () => {
            // `"row": 2` is the line in the file. an author sent to line 1 or 3
            // reads a healthy row and concludes the error is spurious — so the
            // number must count the ledger, never the filtered poke list
            expect(String(read.error)).toContain('"row": 2');
          },
        );
      });

      /**
       * .note = the pair that proves the guard reads the act and not merely
       *         `null`. a defer, a retire, and a fault all carry
       *         `measured: null` legitimately, so a guard written as "throw on
       *         a null measurement" would refuse every healthy ledger in this
       *         file — and `[case2]`'s defer-only run is the loudest of them.
       */
      when('[t2] the same null measurement rides a DEFER instead', () => {
        const read = useBeforeAll(async () => ({
          spend: await getOneWarmerCost({
            dir: setOneRunDir({
              slug: 'warmer-spend-defer-unmeasured',
              rows: [ROW_OF_DEFER, ROW_OF_RETIRE],
            }),
          }),
        }));

        then('it reads clean — a defer measures naught by contract', () => {
          expect(read.spend?.pokes).toEqual(0);
          // `$0.00`, never `$0`. a zero-poke ledger yields the ISO-4217
          // two-place form, and the distinction from `null` is what carries
          // weight here — a warmer that only deferred protected the prefix for
          // free, which `getOneAccountedCost` must not read as an absent record
          expect(read.spend?.cost).toEqual('USD 0.00');
          expect(read.spend?.faults).toEqual(0);
        });
      });
    },
  );
});
