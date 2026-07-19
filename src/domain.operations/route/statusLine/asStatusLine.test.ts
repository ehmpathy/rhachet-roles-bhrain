import { given, then, when } from 'test-fns';

import { asStatusLine } from './asStatusLine';

describe('asStatusLine', () => {
  given('[case1] a stone state', () => {
    when('[t0] the line is rendered', () => {
      then('returns the moai prefix + name', () => {
        const result = asStatusLine({ kind: 'stone', stone: '1.vision' });
        expect(result).toEqual('🗿 1.vision');
      });
    });
  });

  given('[case2] a dotted multi-level stone name', () => {
    when('[t0] the line is rendered', () => {
      then('returns the name verbatim after the moai', () => {
        const result = asStatusLine({
          kind: 'stone',
          stone: '5.1.execution.from_vision',
        });
        expect(result).toEqual('🗿 5.1.execution.from_vision');
      });
    });
  });

  given('[case3] a blank state (unbound, or a route with no stones)', () => {
    when('[t0] the line is rendered', () => {
      then('returns an empty string so the harness blanks the line', () => {
        const result = asStatusLine({ kind: 'blank' });
        expect(result).toEqual('');
      });
    });
  });

  given('[case4] a complete state (all stones passed)', () => {
    when('[t0] the line is rendered', () => {
      then('returns the moai + route-complete celebration', () => {
        const result = asStatusLine({ kind: 'complete' });
        expect(result).toEqual('🗿 route complete 🎉');
      });
    });
  });
});
