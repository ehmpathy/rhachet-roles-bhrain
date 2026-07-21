import { given, then, when } from 'test-fns';

import { getGuardUpgradeDecision } from './getGuardUpgradeDecision';

describe('getGuardUpgradeDecision', () => {
  given('[case1] no provenance', () => {
    when('[t0] decided', () => {
      then('returns skipped', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: null,
            source: { found: false },
            unknownVars: [],
            current: 'x',
          }),
        ).toEqual({ decision: 'skipped' });
      });
    });
  });

  given('[case2] provenance but source absent', () => {
    when('[t0] decided', () => {
      then('returns absent-source', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: false },
            unknownVars: [],
            current: 'x',
          }),
        ).toEqual({ decision: 'absent-source' });
      });
    });
  });

  given('[case3] source found but invalid (fails to parse)', () => {
    when('[t0] decided', () => {
      then('returns invalid-source', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'garbage', valid: false },
            unknownVars: [],
            current: 'x',
          }),
        ).toEqual({ decision: 'invalid-source' });
      });
    });
  });

  given('[case4] source valid but carries an unknown var', () => {
    when('[t0] decided', () => {
      then('returns unknown-var with the offenders', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'has $FOO', valid: true },
            unknownVars: ['$FOO'],
            current: 'x',
          }),
        ).toEqual({ decision: 'unknown-var', vars: ['$FOO'] });
      });
    });
  });

  given('[case5] source valid, no unknown vars, identical to current', () => {
    when('[t0] decided', () => {
      then('returns kept', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'same', valid: true },
            unknownVars: [],
            current: 'same',
          }),
        ).toEqual({ decision: 'kept' });
      });
    });
  });

  given('[case6] source valid, no unknown vars, differs from current', () => {
    when('[t0] decided', () => {
      then('returns upgrade', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'new', valid: true },
            unknownVars: [],
            current: 'old',
          }),
        ).toEqual({ decision: 'upgrade' });
      });
    });
  });

  given('[case7] precedence: invalid-source beats unknown-var', () => {
    when('[t0] an invalid source ALSO has unknown vars', () => {
      then('invalid-source wins (it is checked first)', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'bad $FOO', valid: false },
            unknownVars: ['$FOO'],
            current: 'x',
          }),
        ).toEqual({ decision: 'invalid-source' });
      });
    });
  });

  given('[case8] the only delta is an EOF newline (A6)', () => {
    when('[t0] current lacks the newline the source has', () => {
      then('returns kept — an EOF-newline-only delta is not an upgrade', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'body\n', valid: true },
            unknownVars: [],
            current: 'body',
          }),
        ).toEqual({ decision: 'kept' });
      });
    });

    when('[t1] the delta is real content, not just a newline', () => {
      then('still returns upgrade', () => {
        expect(
          getGuardUpgradeDecision({
            provenance: { uri: 'templates/x.guard' },
            source: { found: true, next: 'body two\n', valid: true },
            unknownVars: [],
            current: 'body one',
          }),
        ).toEqual({ decision: 'upgrade' });
      });
    });
  });
});
