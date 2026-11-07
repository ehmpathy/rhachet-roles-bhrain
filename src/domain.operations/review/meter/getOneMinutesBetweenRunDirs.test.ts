import { given, then, when } from 'test-fns';

import { getOneMinutesBetweenRunDirs } from './getOneMinutesBetweenRunDirs';

const TEST_CASES = [
  {
    description: 'two minted dirs an hour and a half apart read as 90 minutes',
    given: {
      since: '.log/bhrain/review/2026-11-01T10-00-00-000Z.pid1.abc',
      until: '.log/bhrain/review/2026-11-01T11-30-00-000Z.pid2.def',
    },
    expect: 90,
  },
  {
    description:
      'a dir with no readable stamp reads unknown, never a gap of decades',
    given: {
      since: '.log/bhrain/review/not-a-stamp',
      until: '.log/bhrain/review/2026-11-01T11-30-00-000Z.pid2.def',
    },
    expect: null,
  },
  {
    description:
      'a later dir with no readable stamp reads unknown too, never a negative gap',
    given: {
      since: '.log/bhrain/review/2026-11-01T10-00-00-000Z.pid1.abc',
      until: '.log/bhrain/review/not-a-stamp',
    },
    expect: null,
  },
  {
    description: 'an absolute path reads off its last segment alone',
    given: {
      since:
        '/home/x/tree/.log/bhrain/review/2026-11-01T10-00-00-000Z.pid1.abc',
      until:
        '/home/x/tree/.log/bhrain/review/2026-11-01T10-05-30-000Z.pid1.abc',
    },
    expect: 5.5,
  },
];

describe('getOneMinutesBetweenRunDirs', () => {
  given('[case1] a table of run dir pairs', () => {
    TEST_CASES.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected minutes', () => {
          expect(getOneMinutesBetweenRunDirs(thisCase.given)).toEqual(
            thisCase.expect,
          );
        });
      });
    });
  });
});
