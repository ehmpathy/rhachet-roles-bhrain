import { asIsoPrice } from 'iso-price';
import { given, then, when } from 'test-fns';

import { asWarmerValueLines } from '@src/domain.operations/review/asWarmerValueLines';
import type { WarmerValue } from '@src/domain.operations/review/getOneWarmerValue';

/**
 * .what = a value row, with every field a case may override
 */
const genValue = (input: Partial<WarmerValue>): WarmerValue => ({
  key: 'total',
  lane: null,
  cost: asIsoPrice('USD 0.03'),
  costAwaited: asIsoPrice('USD 0'),
  costIsFloor: false,
  faults: 0,
  runsUnterminated: 0,
  pokes: 3,
  hits: 2,
  saved: asIsoPrice('USD 0.00'),
  reviewsCovered: 1,
  runsUncovered: 0,
  runsUnpriced: 0,
  runsLapsed: 0,
  net: asIsoPrice({ amount: -3n, currency: 'USD' }),
  verdict: 'loss',
  ...input,
});

describe('asWarmerValueLines', () => {
  given('[case1] no warmer ran', () => {
    when('[t0] the lines are asked for', () => {
      then('there is naught to state', () => {
        const lines = asWarmerValueLines({
          value: { lanes: [], total: null },
          indent: '',
          lanes: true,
          absent: '—',
        });
        expect(lines).toEqual([]);
      });
    });
  });

  given('[case2] a loss', () => {
    const total = genValue({});
    const lines = asWarmerValueLines({
      value: { lanes: [genValue({ key: 'r 5.1 · lane-a' })], total },
      indent: '  ',
      lanes: true,
      absent: '—',
    });

    when('[t0] the verdict row is read', () => {
      then('it states the answer in words', () => {
        expect(lines[0]).toContain('⛔ did NOT pay for itself');
      });
    });

    when('[t1] the net row is read', () => {
      then('the sign leads the currency glyph', () => {
        const net = lines.find((line) => line.includes('net:'));
        expect(net).toContain('-$0.03');
        expect(net).not.toContain('$-0.03');
      });
    });

    when('[t2] the lane rows are read', () => {
      then('each lane carries its glyph and its label', () => {
        const lane = lines.find((line) => line.includes('lane-a'));
        expect(lane).toContain('⛔');
        expect(lane).toContain('└─');
      });
    });

    when('[t3] the whole block is read', () => {
      then('it renders as the human sees it', () => {
        const text = lines.join('\n');
        expect(text).toContain(
          'net:       -$0.030000, over the settled cost of $0.030000',
        );
        expect(text).toContain('└─ by lane\n');
        expect(text).toContain('r 5.1 · lane-a');
        expect(text).toMatchSnapshot();
      });

      then(
        '🔴 every money figure reads at one precision — a summary row and a lane row never disagree on form',
        () => {
          // a sub-micro cost would render at nine digits through the stored form
          const block = asWarmerValueLines({
            value: {
              lanes: [genValue({ key: 'lane-a' })],
              total: genValue({ cost: asIsoPrice('USD 0.001420008') }),
            },
            indent: '',
            lanes: true,
            absent: '—',
          }).join('\n');
          const figures = block.match(/\$[0-9][0-9.]*/g) ?? [];
          expect(figures.length).toBeGreaterThan(0);
          const forms = figures.map((one) =>
            one === '$0' ? 'nil' : (one.split('.')[1]?.length ?? 0),
          );
          expect(new Set(forms.filter((one) => one !== 'nil'))).toEqual(
            new Set([6]),
          );
        },
      );
    });
  });

  given('[case3] no review has followed a warmed run', () => {
    const lines = asWarmerValueLines({
      value: {
        lanes: [],
        total: genValue({
          verdict: 'unproven',
          reviewsCovered: 0,
          runsUncovered: 2,
          runsUnpriced: 0,
          runsLapsed: 0,
        }),
      },
      indent: '',
      lanes: true,
      absent: '—',
    });

    when('[t0] the net row is read', () => {
      then('it renders absent, never as a loss', () => {
        // with no follower the net is merely -spent, which reads as a loss beside
        // a verdict that says unproven. two rows that disagree teach distrust
        const net = lines.find((line) => line.includes('net:'));
        expect(net).toContain('—');
        expect(net).not.toContain('-$');
      });
    });

    when('[t1] the unweighed row is read', () => {
      then('it counts the unweighed warmed runs', () => {
        expect(lines.join('\n')).toContain(
          'over 2 warmed runs — beside the net, never inside it',
        );
        expect(lines.join('\n')).not.toContain('until one does');
      });

      then(
        'every unweighed run here is awaited, so it promises a settle',
        () => {
          expect(lines.join('\n')).toContain(
            'awaited:   2 warmed runs whose 66-minute cache reach is still open',
          );
          expect(lines.join('\n')).not.toContain('unpriced:');
        },
      );
    });

    when('[t1d] every unweighed run was followed by an UNPRICED review', () => {
      const linesUnpriced = asWarmerValueLines({
        value: {
          lanes: [],
          total: genValue({
            verdict: 'unproven',
            reviewsCovered: 0,
            runsUncovered: 2,
            runsUnpriced: 2,
            runsLapsed: 0,
          }),
        },
        indent: '',
        lanes: true,
        absent: '—',
      });

      then('🔴 it says no settle follows, and promises no wait', () => {
        // an unpriced follower DID read the warmth; its amount saved is gone for
        // good. a row that told the reader to wait would promise a settle that
        // never comes
        const text = linesUnpriced.join('\n');
        expect(text).toContain(
          'unpriced:  2 warmed runs a review DID read, whose amount saved went unrecorded — no settle follows',
        );
        expect(text).not.toContain('awaited:');
        expect(text).not.toContain('settled yet');
      });

      then('the block matches the snapshot', () => {
        const text = linesUnpriced.join('\n');
        expect(text).toContain(
          'unweighed: $0 over 2 warmed runs — beside the net, never inside it',
        );
        expect(text).not.toContain('awaited:');
        expect(text).toMatchSnapshot();
      });

      then('every label row starts its value at one column', () => {
        // the widest label is `unweighed: `, so each value starts at its width
        const starts = linesUnpriced
          .map((line) =>
            /^[^:]*?(verdict|cost|saved|net|lapsed|unweighed|awaited|unpriced): +/.exec(
              line,
            ),
          )
          .filter((found): found is RegExpExecArray => found !== null)
          .map((found) => found[0].length);
        expect(starts.length).toBeGreaterThan(3);
        expect(new Set(starts).size).toEqual(1);
      });
    });

    when(
      '[t1e] exactly one unweighed run was followed by an UNPRICED review',
      () => {
        const linesUnpricedOne = asWarmerValueLines({
          value: {
            lanes: [],
            total: genValue({
              verdict: 'unproven',
              reviewsCovered: 0,
              runsUncovered: 1,
              runsUnpriced: 1,
              runsLapsed: 0,
            }),
          },
          indent: '',
          lanes: true,
          absent: '—',
        });

        then('the singular row reads with no pronoun to agree', () => {
          expect(linesUnpricedOne.join('\n')).toContain(
            'unpriced:  1 warmed run a review DID read, whose amount saved went unrecorded — no settle follows',
          );
        });

        then('the block matches the snapshot', () => {
          const text = linesUnpricedOne.join('\n');
          expect(text).toContain(
            'unweighed: $0 over 1 warmed run — beside the net, never inside it',
          );
          expect(text).not.toContain('1 warmed runs');
          expect(text).toMatchSnapshot();
        });
      },
    );

    when('[t1b] the saved row is read', () => {
      then(
        '🔴 it renders absent, never as $0 — no amount saved was measured',
        () => {
          const saved = lines.find((line) => line.includes('saved:'));
          expect(saved).toContain('—');
          expect(saved).not.toContain('$0');
        },
      );
    });

    when('[t1c] an unproven lane row is read', () => {
      then('🔴 its saved column renders absent, never as $0', () => {
        const linesWithLane = asWarmerValueLines({
          value: {
            lanes: [
              genValue({
                key: 'lane-unproven',
                verdict: 'unproven',
                reviewsCovered: 0,
                runsUncovered: 2,
                runsUnpriced: 0,
                costAwaited: asIsoPrice('USD 0.03'),
              }),
            ],
            total: genValue({ verdict: 'unproven', reviewsCovered: 0 }),
          },
          indent: '',
          lanes: true,
          absent: '—',
        });
        const lane = linesWithLane.find((line) =>
          line.includes('lane-unproven'),
        );
        expect(lane).toMatch(/saved ≤ +—/);
        expect(lane).not.toMatch(/saved ≤ +\$/);
        expect(linesWithLane.join('\n')).toMatchSnapshot();
      });
    });

    when('[t2] the whole block is read', () => {
      then('it renders as the human sees it', () => {
        const text = lines.join('\n');
        expect(text).toContain('verdict:   🌙 unproven');
        expect(text).toContain('net:       —');
        expect(text).not.toContain('⛔');
        expect(text).toMatchSnapshot();
      });
    });

    when('[t3] the lane head is read with no lane rows beneath it', () => {
      then('it names why it is empty, never a bare head', () => {
        // hand `rhx review` runs carry no lane identity, so a tree can hold warmed
        // runs and no lane row. a bare `└─ by lane` promises a child that never renders
        const last = lines[lines.length - 1];
        expect(last).toEqual(
          '└─ by lane: (none — the warmed runs carry no lane identity)',
        );
      });
    });
  });

  given('[case4] a ledger faulted', () => {
    when('[t0] the spent row is read', () => {
      then('it names the figure a floor, and the fault as its cause', () => {
        const lines = asWarmerValueLines({
          value: {
            lanes: [],
            total: genValue({ costIsFloor: true, faults: 1 }),
          },
          indent: '',
          lanes: true,
          absent: '—',
        });
        expect(lines.join('\n')).toContain('a FLOOR');
        expect(lines.join('\n')).toContain('1 poke faulted');
        expect(lines.join('\n')).not.toContain('NO terminator');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });

    when('[t1] a ledger has no terminator', () => {
      then(
        'it says the warmer is still AWAKE or was STOPPED, as the run breadth does',
        () => {
          const text = asWarmerValueLines({
            value: {
              lanes: [],
              total: genValue({ costIsFloor: true, runsUnterminated: 2 }),
            },
            indent: '',
            lanes: true,
            absent: '—',
          }).join('\n');
          expect(text).toContain(
            'NO terminator on 2 warmer logs — still AWAKE or was STOPPED',
          );
          expect(text).not.toContain('faulted');
          expect(text).toMatchSnapshot();
        },
      );
    });
  });

  given('[case5] one poke and one review', () => {
    when('[t0] the counts are read', () => {
      then('each noun is singular', () => {
        const text = asWarmerValueLines({
          value: {
            lanes: [],
            total: genValue({ pokes: 1, hits: 1, reviewsCovered: 1 }),
          },
          indent: '',
          lanes: true,
          absent: '—',
        }).join('\n');
        expect(text).toContain('over 1 poke,');
        expect(text).toContain('across 1 review that');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case7] a micro-precision poke cost beside a nil saved', () => {
    const lines = asWarmerValueLines({
      value: {
        lanes: [
          genValue({
            key: 'lane-metered',
            cost: asIsoPrice('USD 0.000429'),
            saved: asIsoPrice('USD 0.00'),
            net: asIsoPrice('USD -0.000429'),
          }),
          genValue({
            key: 'lane-costly',
            cost: asIsoPrice('USD 12.5'),
            saved: asIsoPrice('USD 13.75'),
            net: asIsoPrice('USD 1.25'),
            verdict: 'maybe',
          }),
        ],
        total: genValue({}),
      },
      indent: '',
      lanes: true,
      absent: '—',
    });
    const laneRows = lines.filter((line) => line.includes(' lane-'));

    when('[t0] the lane rows are read', () => {
      then('every figure in a column shares one precision', () => {
        expect(laneRows[0]).toContain('settled    $0.000429');
        expect(laneRows[0]).toContain('saved ≤           $0');
        expect(laneRows[0]).toContain('-$0.000429');
        expect(laneRows[1]).toContain('$12.500000');
        expect(laneRows[1]).toContain('$13.750000');
        expect(laneRows[1]).toContain('$1.250000');
      });

      then('the lane keys start at one column', () => {
        // measured from ` net `, since the verdict glyphs before it differ in code
        // units (⛔ is one, 🟡 and 🌙 are two) while they render at one width
        const starts = laneRows.map(
          (line) => line.indexOf(' lane-') - line.indexOf(' net '),
        );
        expect(new Set(starts).size).toEqual(1);
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case6] the grove breadth, which owns no lane rows', () => {
    when('[t0] the lines are read with lanes off', () => {
      then('it points at the breadth that holds the lanes', () => {
        const lines = asWarmerValueLines({
          value: {
            lanes: [genValue({ key: 'r 5.1 · lane-a' })],
            total: genValue({}),
          },
          indent: '',
          lanes: false,
          absent: '—',
        });
        expect(lines.join('\n')).toContain('see `--of tree`');
        expect(lines.join('\n')).not.toContain('lane-a');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });
  given(
    '[case8] a settled loss, beside a warmed run still within reach',
    () => {
      // the last warmed round has no follower yet, and its cache reach has not passed.
      // its poke cost rides in the unweighed row, never in the net, so the settled
      // loss stays final
      const value = {
        lanes: [
          genValue({
            key: 'lane-finished',
            lane: {
              root: '/tree/a/.log/bhrain/review',
              slug: 'lane-finished',
              head: 'aaaabbbbccccdddd',
              brain: null,
            },
            cost: asIsoPrice('USD 0.10'),
            costAwaited: asIsoPrice('USD 0.05'),
            saved: asIsoPrice('USD 0.02'),
            net: asIsoPrice('USD -0.03'),
            reviewsCovered: 1,
            runsUncovered: 1,
            runsUnpriced: 0,
            runsLapsed: 0,
            verdict: 'loss',
          }),
        ],
        total: genValue({
          cost: asIsoPrice('USD 0.10'),
          costAwaited: asIsoPrice('USD 0.05'),
          saved: asIsoPrice('USD 0.02'),
          net: asIsoPrice('USD -0.03'),
          reviewsCovered: 1,
          runsUncovered: 1,
          runsUnpriced: 0,
          runsLapsed: 0,
          verdict: 'loss',
        }),
      };
      const lines = asWarmerValueLines({
        value,
        indent: '',
        lanes: true,
        absent: '—',
      });

      when('[t0] the verdict row is read', () => {
        then('it states the settled loss', () => {
          expect(lines[0]).toContain('⛔ did NOT pay for itself');
        });
      });

      when('[t1] the unweighed row is read', () => {
        then('it names the unweighed spend, kept out of the net', () => {
          const awaited = lines.find((line) => line.includes('unweighed:'));
          expect(awaited).toContain(
            '$0.050000 over 1 warmed run — beside the net, never inside it',
          );
        });

        then('the run still within reach is named awaited', () => {
          expect(lines.join('\n')).toContain('awaited:   1 warmed run whose');
        });
      });

      when('[t2] the lane row is read', () => {
        then('it carries the short head beside the slug', () => {
          const laneRow = lines.find((line) => line.includes('lane-finished'));
          expect(laneRow).toContain('lane-finished @aaaabbb');
          expect(laneRow).toContain('⛔ net');
        });
      });

      when('[t3] the whole block is read', () => {
        then('it renders as the human sees it', () => {
          const text = lines.join('\n');
          expect(text).toContain(
            'net:       -$0.030000, over the settled cost of $0.050000',
          );
          expect(text).toContain(
            'saved ≤    $0.020000  lane-finished @aaaabbb',
          );
          expect(text).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case9] 🔴 a finished lane: the last warmed run lapsed past the cache reach',
    () => {
      // the last warmed round has no follower, and its reach passed. it settles at
      // naught saved, so its cost sits INSIDE the net and no row is unweighed
      const value = {
        lanes: [],
        total: genValue({
          cost: asIsoPrice('USD 0.10'),
          costAwaited: asIsoPrice('USD 0'),
          saved: asIsoPrice('USD 0.02'),
          net: asIsoPrice('USD -0.08'),
          reviewsCovered: 1,
          runsUncovered: 0,
          runsUnpriced: 0,
          runsLapsed: 1,
          verdict: 'loss',
        }),
      };
      const lines = asWarmerValueLines({
        value,
        indent: '',
        lanes: false,
        absent: '—',
      });

      when('[t0] the lapsed row is read', () => {
        then('it counts the lapsed run and settles it at $0 saved', () => {
          const lapsed = lines.find((line) => line.includes('lapsed:'));
          expect(lapsed).toContain('1 warmed run no review read');
          expect(lapsed).toContain('settled at $0 saved');
        });
      });

      when('[t1] the net row is read', () => {
        then(
          'the lapsed cost is inside the net, and no row is unweighed',
          () => {
            const net = lines.find((line) => line.includes('net:'));
            expect(net).toContain('-$0.08');
            expect(lines.some((line) => line.includes('unweighed:'))).toBe(
              false,
            );
          },
        );
      });

      when('[t2] the whole block is read', () => {
        then('it renders as the human sees it', () => {
          const text = lines.join('\n');
          expect(text).toContain(
            'net:       -$0.080000, over the settled cost of $0.100000',
          );
          expect(text).not.toContain('unweighed:');
          expect(text).toContain(
            '└─ by lane: see `--of tree` in each worktree',
          );
          expect(text).toMatchSnapshot();
        });
      });
    },
  );
});
