import { given, then, when } from 'test-fns';

import {
  asReviewWindows,
  computeMaxInFlight,
  type ReviewWindow,
  selectWindowsForLevel,
} from './readReviewWindows';

/**
 * .what = builds a window without the ceremony, so each case reads as its shape
 * .why = every case below is about WHEN, so the slug is noise in most of them
 */
const window = (
  slug: string,
  beganAt: number,
  endedAt: number,
): ReviewWindow => ({ slug, beganAt, endedAt });

/**
 * .what = the clamps on the ORACLE every concurrency acceptance test reads through
 *
 * 🔴 .why = `driver.route.peer-concurrency.acceptance` renders every one of its
 *           verdicts — `l1Peak === 4`, `l3Peak === 1`, `l1Count === 2` — out of
 *           these three functions. so a defect HERE does not fail a clamp; it
 *           changes what every clamp MEANS, silently, in the direction the
 *           defect happens to lean.
 *
 *           ⇒ an acceptance suite whose instrument is untested reports a number
 *             rather than a fact. `rule.require.test-coverage-by-grain` puts a
 *             pure transformer at the unit tier, and these are the transformers
 *             that carry the whole feature's proof.
 *
 * .note = no case here touches the disk. `readReviewWindows` is the fs boundary
 *         and stays out, per `rule.forbid.unit.remote-boundaries` — which is the
 *         reason `asReviewWindows` was split out of it at all.
 */
describe('readReviewWindows', () => {
  describe('asReviewWindows', () => {
    given('[case1] one lane that began and ended', () => {
      when('[t0] the log is parsed', () => {
        then('it yields one window with both instants', () => {
          const windows = asReviewWindows({
            raw: 'BEGAN l1-a 1000\nENDED l1-a 1600\n',
          });
          expect(windows).toEqual([
            { slug: 'l1-a', beganAt: 1000, endedAt: 1600 },
          ]);
        });
      });
    });

    given('[case2] two lanes whose lines INTERLEAVE', () => {
      when('[t0] the log is parsed', () => {
        then('each lane keeps its own instants', () => {
          // 🔴 .why = the mock's whole design rests on this. its `.note` says
          //           "the log is APPENDED, never rewritten, so two lanes that
          //           write together interleave lines and neither is lost" —
          //           and that claim is about the WRITER. this is the clamp on
          //           the READER, which is the half that can actually mis-pair
          const windows = asReviewWindows({
            raw: [
              'BEGAN l1-a 1000',
              'BEGAN l1-b 1010',
              'ENDED l1-a 1600',
              'ENDED l1-b 1620',
            ].join('\n'),
          });
          expect(windows).toEqual([
            { slug: 'l1-a', beganAt: 1000, endedAt: 1600 },
            { slug: 'l1-b', beganAt: 1010, endedAt: 1620 },
          ]);
        });
      });
    });

    given('[case3] one slug that ran TWICE in one log', () => {
      when('[t0] the log is parsed', () => {
        then('it yields two windows, never one merged span', () => {
          // .why = a merged span would report one lane as in flight across the
          //        gap between its two runs, which inflates every peak that
          //        overlaps that gap
          const windows = asReviewWindows({
            raw: [
              'BEGAN l3-a 1000',
              'ENDED l3-a 1600',
              'BEGAN l3-a 2000',
              'ENDED l3-a 2600',
            ].join('\n'),
          });
          expect(windows).toEqual([
            { slug: 'l3-a', beganAt: 1000, endedAt: 1600 },
            { slug: 'l3-a', beganAt: 2000, endedAt: 2600 },
          ]);
        });
      });
    });

    given('[case4] a lane that began and never ended', () => {
      when('[t0] the log is parsed', () => {
        then('it yields no window for that lane', () => {
          const windows = asReviewWindows({
            raw: 'BEGAN l1-a 1000\nBEGAN l1-b 1010\nENDED l1-b 1600\n',
          });
          expect(windows).toEqual([
            { slug: 'l1-b', beganAt: 1010, endedAt: 1600 },
          ]);
        });
      });
    });

    given('[case4b] a second BEGAN for a slug still awaiting its ENDED', () => {
      // 🔴 .why = the map holds one begin instant per slug, so a second BEGAN
      //           with no ENDED between them USED to overwrite the first — the
      //           first lane's window then never existed, and the parser yielded
      //           fewer windows than lanes that began, with no error. every peak
      //           clamp reads through here, so that under-count went GREEN on a
      //           log the oracle could not honestly pair (a lane killed then
      //           restarted within one pass).
      //
      // ✅ .teeth = under the old `beganBySlug.set` with no guard, this parses
      //             clean and yields ONE window (the second run), so the throw
      //             assertion goes red. the guard turns the silent overwrite into
      //             a loud refusal. raised i018/r7 blocker.1
      when('[t0] the log is parsed', () => {
        then('it THROWS rather than dropping the first window silently', () => {
          expect(() =>
            asReviewWindows({
              raw: 'BEGAN l1-a 1000\nBEGAN l1-a 1200\nENDED l1-a 1600\n',
            }),
          ).toThrow(/two BEGAN lines for "l1-a"/);
        });
      });
    });

    given('[case5] an ENDED with no BEGAN before it', () => {
      when('[t0] the log is parsed', () => {
        then('the orphan is dropped rather than paired with zero', () => {
          // .why = a `beganAt` of 0 would place the window at the epoch and make
          //        it overlap every other lane, so the peak would read as the
          //        full member count no matter what actually happened
          const windows = asReviewWindows({
            raw: 'ENDED l1-a 1600\nBEGAN l1-b 1000\nENDED l1-b 1600\n',
          });
          expect(windows).toEqual([
            { slug: 'l1-b', beganAt: 1000, endedAt: 1600 },
          ]);
        });
      });
    });

    given('[case6] an empty log, and a log of blank lines', () => {
      when('[t0] the log is parsed', () => {
        then('both yield no windows rather than throw', () => {
          // .why = `clearReviewWindows` writes an empty file before every pass,
          //        and `readReviewWindows` falls back to '' when the file is
          //        absent. both land here, so both must be total
          expect(asReviewWindows({ raw: '' })).toEqual([]);
          expect(asReviewWindows({ raw: '\n\n   \n' })).toEqual([]);
        });
      });
    });

    given('[case6b] a line this parser cannot read — a CORRUPT capture', () => {
      // 🔴 .why = the skip that used to swallow these was the same failhide shape
      //           as the read's old `.catch(() => '')`, one level up. a lane whose
      //           line was truncated mid-write vanished from the window set, and a
      //           peak clamp then read an UNDER-COUNT and went green on data the
      //           oracle could not parse.
      //
      //           ⇒ the direction is what makes it dangerous: an under-count makes
      //             `l3Peak === 1` PASS. so a corrupt capture would have confirmed
      //             acceptance 4 rather than failed it
      //
      // ✅ .proven = restored the bare `if (!marker || !slug || !stamp) continue;`.
      //             all four `[case6b]` cases went red and the other 14 stayed
      //             green — `[case5]` and `[case6]` among them, which is the pair
      //             that proves the refusal did not swallow the LEGITIMATE skips
      //
      // ⇒ raised by two lanes on i001, independently: `mech-failhides` nitpick.1
      //   and `arch-hazards-maintenance` nitpick.2
      when('[t0] a line has too few fields — truncated mid-write', () => {
        then('it THROWS rather than reading as no lane', () => {
          expect(() =>
            asReviewWindows({ raw: 'BEGAN l1-a 1000\nENDED l1-b\n' }),
          ).toThrow(/cannot parse window line/);
        });
      });

      when('[t1] a line has too many fields', () => {
        then('it THROWS', () => {
          expect(() =>
            asReviewWindows({ raw: 'BEGAN l1-a 1000 extra\n' }),
          ).toThrow(/cannot parse window line/);
        });
      });

      when('[t2] the marker is neither BEGAN nor ENDED', () => {
        then('it THROWS rather than a silent drop', () => {
          // .why = a silent skip here is the worst of the four: the line is
          //        well-formed, so naught looks wrong, and the lane simply is
          //        not counted
          expect(() => asReviewWindows({ raw: 'STARTED l1-a 1000\n' })).toThrow(
            /cannot parse window line/,
          );
        });
      });

      when('[t3] the stamp is not an epoch', () => {
        then('it THROWS rather than a window paired with NaN', () => {
          // .why = `parseInt('later')` is NaN, and a NaN instant sorts
          //        unpredictably in `computeMaxInFlight`'s sweep — so the peak
          //        becomes a function of the sort's implementation
          expect(() =>
            asReviewWindows({ raw: 'BEGAN l1-a later\nENDED l1-a 1600\n' }),
          ).toThrow(/cannot parse window line/);
        });
      });
    });

    given('[case6c] a window that does not span forward', () => {
      // 🔴 .why = `computeMaxInFlight` sorts an end before a begin at a tie, so a
      //           ZERO-width window cancels its own begin against its own end and
      //           reports peak 0 for a lane that ran; a BACKWARD window (a
      //           wall-clock NTP step between the two stamps) counts the lane
      //           in-flight across a negative span. both make a peak clamp
      //           under-count with no error. the fixture holds each lane >= 0.6s,
      //           so a non-forward span is a corrupt capture, never a real pour.
      //
      // ✅ .teeth = without the parse guard, the zero-width case yields one window
      //             and `computeMaxInFlight` reports 0 for it — no throw — so the
      //             assertion goes red. raised i018/r7 nitpicks 1 + 2
      when('[t0] endedAt equals beganAt — a zero-width window', () => {
        then('it THROWS rather than reading as peak 0 for a lane that ran', () => {
          expect(() =>
            asReviewWindows({ raw: 'BEGAN l1-a 1000\nENDED l1-a 1000\n' }),
          ).toThrow(/does not span forward/);
        });
      });

      when('[t1] endedAt precedes beganAt — a backward clock step', () => {
        then('it THROWS rather than counting a negative span', () => {
          expect(() =>
            asReviewWindows({ raw: 'BEGAN l1-a 1600\nENDED l1-a 1000\n' }),
          ).toThrow(/does not span forward/);
        });
      });
    });
  });

  describe('computeMaxInFlight', () => {
    given('[case7] four windows that all overlap', () => {
      when('[t0] the peak is computed', () => {
        then('it is four', () => {
          expect(
            computeMaxInFlight({
              windows: [
                window('a', 1000, 1600),
                window('b', 1010, 1610),
                window('c', 1020, 1620),
                window('d', 1030, 1630),
              ],
            }),
          ).toEqual(4);
        });
      });
    });

    given('[case8] three windows that never overlap', () => {
      when('[t0] the peak is computed', () => {
        then('it is one', () => {
          // 🔴 .why = the shape acceptance 4 rests on. `l3Peak === 1` is the
          //           whole proof that `concurrency: 1` genuinely serializes,
          //           so a peak function that over-reported here would fail a
          //           correct implementation, and one that under-reported would
          //           pass a broken one
          expect(
            computeMaxInFlight({
              windows: [
                window('a', 1000, 1600),
                window('b', 1700, 2300),
                window('c', 2400, 3000),
              ],
            }),
          ).toEqual(1);
        });
      });
    });

    given('[case9] two windows that TOUCH at one instant', () => {
      when('[t0] one ends exactly when the next begins', () => {
        then('the peak is one, never two', () => {
          // 🔴 .why = the clamp on the sort tie-break, which is the one subtle
          //           line in the function: `|| a.delta - b.delta` is what makes
          //           an end sort before a begin at an equal instant.
          //
          //           strike that clause and a strictly SERIAL l3 whose lanes
          //           touch at a millisecond reads as a peak of 2 — so the
          //           `concurrency: 1` clamp fails against a correct
          //           implementation, intermittently, on a fast host only
          //
          // ✅ .proven = reversed the tie-break to `b.delta - a.delta`. THIS
          //             line alone went red at `Expected: 1 / Received: 2`,
          //             while the other 13 stayed green. restored → 14/14.
          //
          //             ⇒ and the acceptance suite could NOT have caught it.
          //               its l3 lanes hold 0.6s apart, so two of them touch at
          //               an equal millisecond roughly never — the defect would
          //               have waited for a host fast enough to produce it, and
          //               then read as a flake in the feature rather than in
          //               the instrument that measures it
          expect(
            computeMaxInFlight({
              windows: [window('a', 1000, 1600), window('b', 1600, 2200)],
            }),
          ).toEqual(1);
        });
      });
    });

    given('[case10] a peak that sits in the MIDDLE of the span', () => {
      when('[t0] the peak is computed', () => {
        then('the sweep finds it rather than the first overlap', () => {
          // .why = the `.note` claims a sweep "reports the true peak rather than
          //        a lower bound". here no two windows share a start and the
          //        widest moment is at t=1300 — a scan that reported the first
          //        overlap it met would say 2
          expect(
            computeMaxInFlight({
              windows: [
                window('a', 1000, 1400),
                window('b', 1100, 1500),
                window('c', 1200, 1600),
                window('d', 1250, 1700),
                window('e', 1800, 1900),
              ],
            }),
          ).toEqual(4);
        });
      });
    });

    given('[case11] one window fully inside another', () => {
      when('[t0] the peak is computed', () => {
        then('it is two', () => {
          // .why = the nest is what a bounded group looks like when a long lane
          //        holds a slot across a short one's whole life
          expect(
            computeMaxInFlight({
              windows: [window('a', 1000, 2000), window('b', 1200, 1400)],
            }),
          ).toEqual(2);
        });
      });
    });

    given('[case12] no windows at all', () => {
      when('[t0] the peak is computed', () => {
        then('it is zero', () => {
          // .why = `[t0]` of the acceptance journey asserts `l3Count === 0`, and
          //        a peak read on that empty set must not throw or read as 1
          expect(computeMaxInFlight({ windows: [] })).toEqual(0);
        });
      });
    });
  });

  describe('selectWindowsForLevel', () => {
    given('[case13] windows from two levels in one log', () => {
      when('[t0] one level is selected', () => {
        then('only that prefix survives', () => {
          const windows = [
            window('l1-a', 1000, 1600),
            window('l3-a', 1700, 2300),
            window('l1-b', 1010, 1610),
          ];
          expect(
            selectWindowsForLevel({ windows, prefix: 'l1-' }).map((w) => w.slug),
          ).toEqual(['l1-a', 'l1-b']);
          expect(
            selectWindowsForLevel({ windows, prefix: 'l3-' }).map((w) => w.slug),
          ).toEqual(['l3-a']);
        });
      });
    });

    given('[case14] a prefix that would match mid-slug', () => {
      when('[t0] the level is selected', () => {
        then('the match is anchored at the head', () => {
          // .why = the fixture names lanes `l1-a`, and a `.includes` would pull
          //        `pre-l1-a` in too. an anchored match is what makes the two
          //        level assertions independent of each other
          expect(
            selectWindowsForLevel({
              windows: [window('l1-a', 1000, 1600), window('x-l1-a', 1, 2)],
              prefix: 'l1-',
            }).map((w) => w.slug),
          ).toEqual(['l1-a']);
        });
      });
    });
  });
});
