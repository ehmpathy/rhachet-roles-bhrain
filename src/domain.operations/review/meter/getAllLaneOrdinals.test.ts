import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import type { ReviewRunMeet } from '@src/domain.objects/Reviewer/ReviewRunMeet';
import type {
  ReviewRunFigures,
  ReviewRunGrade,
  ReviewRunMeter,
} from '@src/domain.objects/Reviewer/ReviewRunMeter';

import { getAllLaneOrdinals } from './getAllLaneOrdinals';

const ROOT = '/tree/a/.log/bhrain/review';

/**
 * .what = the graded figures of a run — measured where metered, absent elsewhere
 * .why = the row type keys its figures on the grade, so a fixture states both together
 */
const asRunFigures = (input: { grade: ReviewRunGrade }): ReviewRunFigures =>
  input.grade === 'metered'
    ? {
        grade: 'metered',
        tokens: { input: 1_000, cacheSet: 0, cacheGet: 0, output: 10 },
        cost: { total: asIsoPrice('USD 0.01'), cacheSaved: null },
      }
    : { grade: input.grade, tokens: null, cost: null };

/**
 * .what = one guard run of one lane, minted at a chosen minute of one day
 * .why = the ordinal turns on the lane, the mint, and whether the run reached the brain
 */
const asRun = (input: {
  minute: number;
  grade?: ReviewRunGrade;
  stamp?: string;
  meet?: ReviewRunMeet | null;
  minutesOfCall?: number | null;
}): ReviewRunMeter => {
  const at = new Date(Date.UTC(2026, 8, 26, 0, input.minute));
  const stamp = input.stamp ?? at.toISOString().replace(/[:.]/g, '-');
  return {
    dir: `${ROOT}/${stamp}.pid1.m${input.minute}`,
    head: 'aaaa',
    brain: 'openrouter/deepseek/flash',
    provider: null,
    meet: input.meet ?? null,
    minutesOfCall: input.minutesOfCall ?? null,
    identity: {
      route: '.behavior/v2026_09_20.review-cost-meter',
      stone: '5.1',
      iteration: input.minute,
      hash: 'a1b2c3d',
      index: 1,
      slug: 'repo-rules',
    },
    defect: null,
    scope: null,
    // a metered row carries measured figures; the ordinal ignores their values
    ...asRunFigures({ grade: input.grade ?? 'metered' }),
    prompt: null,
  };
};

describe('getAllLaneOrdinals', () => {
  given('[case1] three brain runs of one lane, minutes apart', () => {
    const runs = [
      asRun({ minute: 0 }),
      asRun({ minute: 10 }),
      asRun({ minute: 20 }),
    ];

    when('[t0] the ordinals are folded', () => {
      then('each run counts the ones before it', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(runs.map((run) => ordinals.get(run.dir)?.ordinal)).toEqual([
          1, 2, 3,
        ]);
      });

      then('no run names a lapse, since each held its prefix in reach', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(runs.map((run) => ordinals.get(run.dir)?.lapsedMinutes)).toEqual(
          [null, null, null],
        );
      });
    });
  });

  given('[case2] 🔴 a refused run, then a metered run', () => {
    // the refusal died at validation and sent no brain request, so the round after it
    // is the first request that ever sent this prefix
    const runs = [asRun({ minute: 0, grade: 'refused' }), asRun({ minute: 5 })];

    when('[t0] the ordinals are folded', () => {
      then('the metered run is its lane first, never a warm repeat', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(1);
      });

      then(
        '🔴 and it is a first round, never a lapse — no prefix was ever sent',
        () => {
          const ordinals = getAllLaneOrdinals({ runs });
          expect(ordinals.get(runs[1]!.dir)?.lapsedMinutes).toBeNull();
        },
      );
    });
  });

  given('[case3] 🔴 a second run past the cache reach', () => {
    // the prefix the first run left is gone once the reach has passed
    const runs = [asRun({ minute: 0 }), asRun({ minute: 120 })];

    when('[t0] the ordinals are folded', () => {
      then('the later run is a first run again', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(1);
      });

      then(
        '🔴 and it names the lapse — the lane HAD a prefix and lost it, 120m on',
        () => {
          const ordinals = getAllLaneOrdinals({ runs });
          expect(ordinals.get(runs[1]!.dir)?.lapsedMinutes).toEqual(120);
        },
      );

      then('the lane first run names no lapse', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[0]!.dir)?.lapsedMinutes).toBeNull();
      });
    });
  });

  given('[case4] a second run just inside the cache reach', () => {
    const runs = [asRun({ minute: 0 }), asRun({ minute: 60 })];

    when('[t0] the ordinals are folded', () => {
      then('the later run is a repeat', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(2);
      });
    });
  });

  given('[case5] a run whose mint does not parse', () => {
    // an unknown gap is never read as a long one, so the conservative grade holds
    const runs = [
      asRun({ minute: 0, stamp: '0000-unparsed' }),
      asRun({ minute: 120 }),
    ];

    when('[t0] the ordinals are folded', () => {
      then('no lapse is assumed, and the later run is a repeat', () => {
        const ordinals = getAllLaneOrdinals({ runs });
        expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(2);
      });
    });
  });

  given(
    '[case6] 🔴 a chain of runs, each inside the reach of the one before',
    () => {
      // the reach is measured from the LAST run, so a lane that never paused past the
      // reach stays warm however long the chain runs in total
      const runs = [
        asRun({ minute: 0 }),
        asRun({ minute: 50 }),
        asRun({ minute: 100 }),
      ];

      when('[t0] the ordinals are folded', () => {
        then('every run is a repeat of the one before', () => {
          const ordinals = getAllLaneOrdinals({ runs });
          expect(runs.map((run) => ordinals.get(run.dir)?.ordinal)).toEqual([
            1, 2, 3,
          ]);
        });
      });
    },
  );

  given(
    '[case7] 🔴 a prior whose call ran long, then a run 70m past its mint',
    () => {
      // the prior was minted at 0 and its call ran 8m, so it last sent at 8. the round at
      // 70 sits 62m past that send — inside the reach — though 70m past the prior's mint
      const runs = [
        asRun({ minute: 0, minutesOfCall: 8 }),
        asRun({ minute: 70 }),
      ];

      when('[t0] the ordinals are folded', () => {
        then(
          'the later run is a repeat — the gap runs from the last send',
          () => {
            const ordinals = getAllLaneOrdinals({ runs });
            expect(ordinals.get(runs[1]!.dir)?.ordinal).toEqual(2);
            expect(ordinals.get(runs[1]!.dir)?.lapsedMinutes).toBeNull();
          },
        );
      });

      when('[t1] the prior call ran only 1m', () => {
        const runsShort = [
          asRun({ minute: 0, minutesOfCall: 1 }),
          asRun({ minute: 70 }),
        ];
        then('the later run lapsed, 69m past the last send', () => {
          const ordinals = getAllLaneOrdinals({ runs: runsShort });
          expect(ordinals.get(runsShort[1]!.dir)?.ordinal).toEqual(1);
          expect(ordinals.get(runsShort[1]!.dir)?.lapsedMinutes).toEqual(69);
        });
      });
    },
  );

  given(
    '[case8] 🔴 a run that met a warm peer, past its own lane reach',
    () => {
      // its own lane last sent 120m ago, but a peer primed the head this round
      const runs = [
        asRun({ minute: 0 }),
        asRun({ minute: 120, meet: 'awaited' }),
      ];

      when('[t0] the ordinals are folded', () => {
        then('the run is met warm, and names no lapse', () => {
          const ordinals = getAllLaneOrdinals({ runs });
          expect(ordinals.get(runs[1]!.dir)?.metWarm).toEqual(true);
          expect(ordinals.get(runs[1]!.dir)?.lapsedMinutes).toBeNull();
        });
      });

      when('[t1] the met-warm run is its lane first round', () => {
        const runsFirst = [asRun({ minute: 0, meet: 'primed' })];
        then('it is met warm, though its ordinal is 1', () => {
          const ordinals = getAllLaneOrdinals({ runs: runsFirst });
          expect(ordinals.get(runsFirst[0]!.dir)).toEqual({
            ordinal: 1,
            lapsedMinutes: null,
            metWarm: true,
          });
        });
      });

      when('[t2] the run met cold (solo)', () => {
        const runsSolo = [
          asRun({ minute: 0 }),
          asRun({ minute: 120, meet: 'solo' }),
        ];
        then('the lapse is named as before', () => {
          const ordinals = getAllLaneOrdinals({ runs: runsSolo });
          expect(ordinals.get(runsSolo[1]!.dir)?.metWarm).toEqual(false);
          expect(ordinals.get(runsSolo[1]!.dir)?.lapsedMinutes).toEqual(120);
        });
      });
    },
  );
});
