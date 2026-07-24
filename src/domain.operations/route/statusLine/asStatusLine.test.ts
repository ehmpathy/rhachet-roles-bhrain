import { given, then, when } from 'test-fns';

import { asStatusLine } from './asStatusLine';

describe('asStatusLine', () => {
  given('[case1] a stone in the yield phase, push', () => {
    when('[t0] the line is rendered', () => {
      then('returns the moai prefix + name + yield + calm grain', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '1.vision',
          phase: { of: 'yield' },
          disposition: { of: 'push' },
        });
        expect(result).toEqual('🗿 1.vision, yield 🌾');
      });
    });
  });

  given('[case2] a dotted multi-level stone name', () => {
    when('[t0] the line is rendered', () => {
      then('returns the name verbatim after the moai', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.1.execution.from_vision',
          phase: { of: 'yield' },
          disposition: { of: 'push' },
        });
        expect(result).toEqual('🗿 5.1.execution.from_vision, yield 🌾');
      });
    });
  });

  given('[case3] a stone in the review.self phase, push', () => {
    when('[t0] the line is rendered', () => {
      then('shows the r{done}/{total} counter + magnifier', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '1.vision',
          phase: { of: 'review.self', done: 7, total: 10 },
          disposition: { of: 'push' },
        });
        expect(result).toEqual('🗿 1.vision, review.self, r7/r10 🔍');
      });
    });
  });

  given('[case4] a stone in the review.peer phase, push', () => {
    when('[t0] the line is rendered', () => {
      then(
        'shows l{level}@i{rounds} (rounds zero-padded to 3) + magnifier',
        () => {
          const result = asStatusLine({
            kind: 'stone',
            stone: '5.1.execution.from_vision',
            phase: { of: 'review.peer', level: 3, rounds: 2 },
            disposition: { of: 'push' },
          });
          expect(result).toEqual(
            '🗿 5.1.execution.from_vision, review.peer, l3@i002 🔍',
          );
        },
      );
    });
  });

  given('[case5] a judge phase, halt on approval', () => {
    when('[t0] the line is rendered', () => {
      then('waves for a human with approved? + 👋', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.3.verification',
          phase: { of: 'judge' },
          disposition: { of: 'halt', why: 'approval' },
        });
        expect(result).toEqual('🗿 5.3.verification, judge, approved? 👋');
      });
    });
  });

  given(
    '[case6] a judge phase, push (non-approval judge, agent can fix)',
    () => {
      when('[t0] the line is rendered', () => {
        then('shows judge + magnifier (machine turn, not a human wave)', () => {
          const result = asStatusLine({
            kind: 'stone',
            stone: '5.3.verification',
            phase: { of: 'judge' },
            disposition: { of: 'push' },
          });
          expect(result).toEqual('🗿 5.3.verification, judge 🔍');
        });
      });
    },
  );

  given('[case7] a peer-review phase, halt on a driver wall (blocked)', () => {
    when('[t0] the line is rendered', () => {
      then('keeps the phase text, appends blocked + the stop-hand', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.1.execution.from_vision',
          phase: { of: 'review.peer', level: 3, rounds: 2 },
          disposition: { of: 'halt', why: 'blocked' },
        });
        expect(result).toEqual(
          '🗿 5.1.execution.from_vision, review.peer, l3@i002, blocked ✋',
        );
      });
    });
  });

  given('[case8] a peer-review phase, halt on exhausted budget', () => {
    when('[t0] the line is rendered', () => {
      then('keeps the phase text, appends exhausted + the wave', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.1.execution.from_vision',
          phase: { of: 'review.peer', level: 3, rounds: 2 },
          disposition: { of: 'halt', why: 'exhausted' },
        });
        expect(result).toEqual(
          '🗿 5.1.execution.from_vision, review.peer, l3@i002, exhausted 👋',
        );
      });
    });
  });

  given('[case9] a peer-review phase, halt on a malfunction', () => {
    when('[t0] the line is rendered', () => {
      then('keeps the phase text, appends malfunction + the collision', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.1.execution.from_vision',
          phase: { of: 'review.peer', level: 3, rounds: 2 },
          disposition: { of: 'halt', why: 'malfunction' },
        });
        expect(result).toEqual(
          '🗿 5.1.execution.from_vision, review.peer, l3@i002, malfunction 💥',
        );
      });
    });
  });

  given('[case10] a yield phase, halt on a driver wall (pre-review)', () => {
    when('[t0] the line is rendered', () => {
      then('appends blocked + the stop-hand to the yield text', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '1.vision',
          phase: { of: 'yield' },
          disposition: { of: 'halt', why: 'blocked' },
        });
        expect(result).toEqual('🗿 1.vision, yield, blocked ✋');
      });
    });
  });

  given('[case11] a stone whose phase could not be derived (null)', () => {
    when('[t0] the line is rendered', () => {
      then('degrades to the plain stone line (no suffix)', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '1.vision',
          phase: null,
          disposition: { of: 'push' },
        });
        expect(result).toEqual('🗿 1.vision');
      });
    });
  });

  given('[case12] a blank state (unbound, or a route with no stones)', () => {
    when('[t0] the line is rendered', () => {
      then('returns an empty string so the harness blanks the line', () => {
        const result = asStatusLine({ kind: 'blank' });
        expect(result).toEqual('');
      });
    });
  });

  given('[case13] a complete state (all stones passed)', () => {
    when('[t0] the line is rendered', () => {
      then('returns the moai + route-complete palmtree + shaka', () => {
        const result = asStatusLine({ kind: 'complete' });
        expect(result).toEqual('🗿 route complete 🌴🤙');
      });
    });
  });
});
