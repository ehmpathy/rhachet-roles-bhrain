import { given, then, when } from 'test-fns';

import {
  asGuardMalfunctionCauseKind,
  asGuardMalfunctionParts,
} from './asGuardMalfunctionParts';

const CAUSE_CASES = [
  { cause: 'review timed out after 20 minutes', kind: 'transient' },
  { cause: 'socket hang up', kind: 'transient' },
  { cause: 'the brain call failed — terminated', kind: 'transient' },
  { cause: 'openrouter returned 503', kind: 'transient' },
  { cause: 'glob matched no files: src/absent/**', kind: 'glob' },
  { cause: 'could not parse the review output', kind: 'unreadable' },
  { cause: 'api key absent for openrouter', kind: 'credential' },
  { cause: 'keyrack is locked', kind: 'credential' },
  { cause: 'exit code 1', kind: 'unknown' },
] as const;

describe('asGuardMalfunctionParts', () => {
  given('[case1] the cause classes', () => {
    CAUSE_CASES.map((thisCase) =>
      then(`"${thisCase.cause}" reads as ${thisCase.kind}`, () => {
        expect(asGuardMalfunctionCauseKind({ cause: thisCase.cause })).toEqual(
          thisCase.kind,
        );
      }),
    );
  });

  given(
    '[case2] a reason with a review lane, a judge, and a stray clause',
    () => {
      when('[t0] the parts are read', () => {
        const parts = asGuardMalfunctionParts({
          reason: [
            '1 of 3 reviewers malfunctioned; 1 judge malfunctioned',
            'r2 mechanic: review timed out after 20 minutes',
            'j1: exit code 1',
            'peer reviewer budget exhausted: architect',
          ].join('\n'),
        });

        then('each broken part is named, the stray clause skipped', () => {
          expect(parts).toEqual([
            {
              kind: 'review',
              label: 'lane mechanic (r2)',
              slug: 'mechanic',
              cause: 'review timed out after 20 minutes',
              causeKind: 'transient',
            },
            {
              kind: 'judge',
              label: 'judge j1',
              slug: null,
              cause: 'exit code 1',
              causeKind: 'unknown',
            },
          ]);
        });
      });
    },
  );

  given('[case3] no reason', () => {
    then('no parts', () => {
      expect(asGuardMalfunctionParts({ reason: null })).toEqual([]);
    });
  });
});
