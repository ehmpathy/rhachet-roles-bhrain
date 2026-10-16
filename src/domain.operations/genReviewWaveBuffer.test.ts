import { given, then, when } from 'test-fns';

import { genReviewWaveBuffer } from './genReviewWaveBuffer';

describe('genReviewWaveBuffer', () => {
  given('[case1] a wave of three, settled out of declared order', () => {
    when('[t0] slot 1 settles before slot 0', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 3 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.launch({ slot: 1, beganMs: 1010 });

      const afterSlot1 = wave.settle({ slot: 1, block: ['b1'] });

      then('slot 1 is withheld — the cursor is owed slot 0', () => {
        expect(afterSlot1).toEqual([]);
      });

      when('[t1] slot 0 then settles', () => {
        const afterSlot0 = wave.settle({ slot: 0, block: ['b0'] });

        then('both release at once, in DECLARED order', () => {
          expect(afterSlot0).toEqual([['b0'], ['b1']]);
        });
      });
    });
  });

  given('[case2] a wave settled in declared order', () => {
    when('[t0] each slot settles in turn', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 2 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.launch({ slot: 1, beganMs: 1000 });

      const first = wave.settle({ slot: 0, block: ['b0'] });
      const second = wave.settle({ slot: 1, block: ['b1'] });

      then('each releases immediately, one at a time', () => {
        expect(first).toEqual([['b0']]);
        expect(second).toEqual([['b1']]);
      });
    });
  });

  given('[case3] a lane that never settles', () => {
    when('[t0] slot 0 throws, so only slots 1 and 2 land', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 3 });
      wave.launch({ slot: 0, beganMs: 1000 });
      const afterSlot1 = wave.settle({ slot: 1, block: ['b1'] });
      const afterSlot2 = wave.settle({ slot: 2, block: ['b2'] });

      then('no block has released — the cursor stalls on slot 0', () => {
        expect(afterSlot1).toEqual([]);
        expect(afterSlot2).toEqual([]);
      });

      when('[t1] the wave is drained', () => {
        const drained = wave.drain();

        then('every buffered block escapes, still in declared order', () => {
          expect(drained).toEqual([['b1'], ['b2']]);
        });

        then('drain is TERMINAL — status() reports no lane still aloft', () => {
          // .why = slot 0 was launched and never settled, so before the fix a
          //        post-drain status() read `inflight: 1` for a wave that had
          //        released every block it held — a wrong peak with no error
          //        (i025/r2 blocker.3). `left` stays 1 because slot 0 genuinely
          //        produced no block; what drain owes is a HONEST inflight count
          expect(wave.status().inflight).toEqual(0);
        });
      });
    });
  });

  given('[case4] the status counters', () => {
    when('[t0] two of three are aloft', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 3 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.launch({ slot: 1, beganMs: 1010 });

      then('inflight counts the aloft, and `left` holds the invariant', () => {
        expect(wave.status()).toEqual({
          inflight: 2,
          done: 0,
          left: 3,
          beganMs: 1000,
        });
      });

      then('beganMs is the FIRST launch, never the latest', () => {
        expect(wave.status().beganMs).toEqual(1000);
      });
    });

    when('[t1] one of three has settled', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 3 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.launch({ slot: 1, beganMs: 1010 });
      wave.settle({ slot: 0, block: ['b0'] });

      then('`done + left` equals the member count', () => {
        const status = wave.status();
        expect(status.done + status.left).toEqual(3);
      });

      then('`left` is inflight PLUS queued, never queued alone', () => {
        // slot 1 is aloft, slot 2 is queued ⇒ left = 2, not 1
        expect(wave.status()).toEqual({
          inflight: 1,
          done: 1,
          left: 2,
          beganMs: 1000,
        });
      });
    });
  });

  given('[case5] a second wave, the first one SPENT', () => {
    when('[t0] a new level begins once the prior level is spent', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 1 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.settle({ slot: 0, block: ['b0'] });

      const orphans = wave.begin({ level: 3, total: 3 });

      then('the counters reset to the new wave', () => {
        expect(wave.status()).toEqual({
          inflight: 0,
          done: 0,
          left: 3,
          beganMs: null,
        });
      });

      then(
        'it hands back no orphans — the prior wave released every block',
        () => {
          expect(orphans).toEqual([]);
        },
      );
    });

    when('[t1] the SAME level begins again, mid-flight', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 2 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.settle({ slot: 0, block: ['b0'] });

      const orphans = wave.begin({ level: 1, total: 2 });

      then('it is a no-op — `begin` fires on EVERY event of its level', () => {
        expect(wave.status()).toEqual({
          inflight: 0,
          done: 1,
          left: 1,
          beganMs: 1000,
        });
      });

      then('and it hands back no orphans', () => {
        expect(orphans).toEqual([]);
      });
    });
  });

  /**
   * .what = the level-keyed reset, on the one shape a cursor proxy got wrong
   * .why = `begin` once keyed on `cursor < total`, which reads `spent` and
   *        `cut short` alike. so a prior wave a mid-flight throw left short
   *        REFUSED the next level's begin, and every block of that next level
   *        then sat behind a gap that can never close — emitted never, with no
   *        error. keyed on the level, the new wave is always correct, and the
   *        prior wave's orphans come back rather than vanish (raised i004/r011)
   *
   * ⚠️ .note = unreachable from this repo's own call graph today: a lane that
   *         throws aborts the whole cli, so no second level follows it. the
   *         clamp is what makes the guarantee a property of the UNIT rather
   *         than of a call graph nobody has written down
   */
  given('[case6] a prior wave that a mid-flight throw CUT SHORT', () => {
    when('[t0] slot 0 never settles, and a new level begins', () => {
      const wave = genReviewWaveBuffer();
      wave.begin({ level: 1, total: 3 });
      wave.launch({ slot: 0, beganMs: 1000 });
      wave.launch({ slot: 1, beganMs: 1010 });
      wave.settle({ slot: 1, block: ['a1'] });
      wave.settle({ slot: 2, block: ['a2'] });

      const orphans = wave.begin({ level: 3, total: 2 });

      // .note = read NOW, never inside the `then` — `[t1]` settles at collection time
      const statusAtBegin = wave.status();

      then('the new level gets a correct wave, never the prior one', () => {
        expect(statusAtBegin).toEqual({
          inflight: 0,
          done: 0,
          left: 2,
          beganMs: null,
        });
      });

      then(
        'the cut-short wave hands its buffered blocks back, in order',
        () => {
          expect(orphans).toEqual([['a1'], ['a2']]);
        },
      );

      when('[t1] the new level then settles its own slots', () => {
        const first = wave.settle({ slot: 0, block: ['b0'] });
        const second = wave.settle({ slot: 1, block: ['b1'] });

        then('each releases — the prior gap absorbs none of them', () => {
          expect(first).toEqual([['b0']]);
          expect(second).toEqual([['b1']]);
        });
      });
    });
  });

  given(
    '[case7] ONE slot settles TWICE — a retry, or a double-emitted finish',
    () => {
      // .why = `done` is a counter and `left` is derived from it, so a second
      //        count for one slot reports one more lane finished than exists.
      //        the launch/settle contract implies once per slot, and a contract
      //        the caller upholds alone is one a retry breaks silently
      when('[t0] the repeat arrives after the first released', () => {
        const wave = genReviewWaveBuffer();
        wave.begin({ level: 1, total: 2 });
        wave.launch({ slot: 0, beganMs: 1000 });
        const first = wave.settle({ slot: 0, block: ['b0'] });
        const repeat = wave.settle({ slot: 0, block: ['b0-again'] });

        then('the first released, and the repeat releases naught', () => {
          expect(first).toEqual([['b0']]);
          expect(repeat).toEqual([]);
        });

        then('the counters CONVERGE — done is 1, never 2', () => {
          expect(wave.status().done).toEqual(1);
        });

        then('`left` stays non-negative, so the peak reads true', () => {
          // .why = left = total - done. a double count drives it to -1, and a
          //        negative remainder renders as a lane that never existed
          expect(wave.status().left).toEqual(1);
        });

        then('the repeat does not overwrite the released block', () => {
          // the second slot then settles and closes the wave cleanly
          const after = wave.settle({ slot: 1, block: ['b1'] });
          expect(after).toEqual([['b1']]);
          expect(wave.status().done).toEqual(2);
          expect(wave.status().left).toEqual(0);
        });
      });

      when(
        '[t1] the repeat arrives while an earlier gap still holds it',
        () => {
          const wave = genReviewWaveBuffer();
          wave.begin({ level: 1, total: 2 });
          wave.launch({ slot: 1, beganMs: 1000 });
          wave.settle({ slot: 1, block: ['b1'] });
          const repeat = wave.settle({ slot: 1, block: ['b1-again'] });

          then('the repeat is a no-op, and the gap still holds', () => {
            expect(repeat).toEqual([]);
            expect(wave.status().done).toEqual(1);
          });

          then('slot 0 then releases BOTH, with the FIRST block kept', () => {
            // .why = a repeat must not overwrite what the buffer already holds —
            //        the release order is declared order, and the payload is the
            //        one that won the race
            expect(wave.settle({ slot: 0, block: ['b0'] })).toEqual([
              ['b0'],
              ['b1'],
            ]);
          });
        },
      );
    },
  );

  given('[case8] a settle for a slot OUTSIDE the declared roster', () => {
    // .why = `total` is the level's own size, so a slot at or past it belongs to
    //        no member of this wave. absorbed, it would drive `done` past
    //        `total` and `left` negative — a caller defect, never an event
    when('[t0] the slot is at the roster size', () => {
      then('the buffer REFUSES, and names the slot and the total', () => {
        const wave = genReviewWaveBuffer();
        wave.begin({ level: 1, total: 2 });
        expect(() => wave.settle({ slot: 2, block: ['x'] })).toThrow(
          /outside its level roster/,
        );
      });
    });

    when('[t1] the slot is negative', () => {
      then('the buffer REFUSES', () => {
        const wave = genReviewWaveBuffer();
        wave.begin({ level: 1, total: 2 });
        expect(() => wave.settle({ slot: -1, block: ['x'] })).toThrow(
          /outside its level roster/,
        );
      });
    });

    when('[t2] the slot is the LAST of the roster', () => {
      then('it settles — the bound is exclusive, and that is the edge', () => {
        // .why = a clamp that only ever goes red proves the refusal and not the
        //        pass. `total: 2` means slots 0 and 1 are both legitimate
        const wave = genReviewWaveBuffer();
        wave.begin({ level: 1, total: 2 });
        wave.settle({ slot: 0, block: ['b0'] });
        expect(wave.settle({ slot: 1, block: ['b1'] })).toEqual([['b1']]);
      });
    });
  });

  given('[case9] a CACHED member settles with no launch', () => {
    // .why = `genContextCliEmit` calls `launch` only on an inflight event with
    //        no `endedAt`. a cached review carries no inflight at all, so it
    //        settles directly ⇒ a guard that demanded `inflight.has(slot)`
    //        would refuse the cached path outright
    when('[t0] the slot settles without a prior launch', () => {
      then('it settles and releases, exactly as a launched slot does', () => {
        const wave = genReviewWaveBuffer();
        wave.begin({ level: 1, total: 2 });
        expect(wave.settle({ slot: 0, block: ['cached'] })).toEqual([
          ['cached'],
        ]);
        expect(wave.status().done).toEqual(1);
      });
    });
  });
});
