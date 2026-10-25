import { ConstraintError } from 'helpful-errors';
import { getError } from 'test-fns';

import { asLibrarianCliArgs } from './asLibrarianCliArgs';

/**
 * .what = data-driven cases for the librarian arg parse that succeed
 * .why = the glob set repeats, a boolean never takes a value, and the mode defaults to plan
 */
const TEST_CASES_OK: {
  description: string;
  command: Parameters<typeof asLibrarianCliArgs>[0]['command'];
  args: string[];
  expected: ReturnType<typeof asLibrarianCliArgs>;
}[] = [
  {
    description: 'one glob, no other flag',
    command: 'census.cues',
    args: ['--glob', 'briefs/*.md'],
    expected: {
      wantHelp: false,
      globs: ['briefs/*.md'],
      wantFiles: false,
      wantEmit: false,
      mode: 'plan',
    },
  },
  {
    description: 'a repeated glob is unioned, in the order typed',
    command: 'census.minpeer',
    args: ['--glob', 'a/*.md.min', '--glob', 'b/*.md.min'],
    expected: {
      wantHelp: false,
      globs: ['a/*.md.min', 'b/*.md.min'],
      wantFiles: false,
      wantEmit: false,
      mode: 'plan',
    },
  },
  {
    description: 'a boolean never takes the token after it',
    command: 'census.minpeer',
    args: ['--files', '--glob', 'a/*.md.min', '--emit'],
    expected: {
      wantHelp: false,
      globs: ['a/*.md.min'],
      wantFiles: true,
      wantEmit: true,
      mode: 'plan',
    },
  },
  {
    description: 'moveout reads --mode apply',
    command: 'brief.min.moveout',
    args: ['--glob', 'a/*.md.min', '--mode', 'apply'],
    expected: {
      wantHelp: false,
      globs: ['a/*.md.min'],
      wantFiles: false,
      wantEmit: false,
      mode: 'apply',
    },
  },
  {
    description: '--help short-circuits before any other flag is read',
    command: 'census.cues',
    args: ['--help', '--bogus'],
    expected: {
      wantHelp: true,
      globs: [],
      wantFiles: false,
      wantEmit: false,
      mode: 'plan',
    },
  },
  {
    description: '-h is a help request',
    command: 'brief.min.moveout',
    args: ['-h'],
    expected: {
      wantHelp: true,
      globs: [],
      wantFiles: false,
      wantEmit: false,
      mode: 'plan',
    },
  },
];

/**
 * .what = data-driven cases for the librarian arg parse that refuse
 * .why = a caller slip fails loud with the surface the command reads, never a report on the wrong input
 */
const TEST_CASES_REFUSED: {
  description: string;
  command: Parameters<typeof asLibrarianCliArgs>[0]['command'];
  args: string[];
  messageHas: string;
}[] = [
  {
    description: 'no args: the glob is absent',
    command: 'census.cues',
    args: [],
    messageHas: 'no --glob given',
  },
  {
    description: 'a typo flag is unknown',
    command: 'census.minpeer',
    args: ['--glob', 'a', '--emti'],
    messageHas: 'unknown flag(s): --emti',
  },
  {
    description: '--mode is unknown to a census',
    command: 'census.cues',
    args: ['--glob', 'a', '--mode', 'apply'],
    messageHas: 'unknown flag(s): --mode',
  },
  {
    description: '--files is unknown to the moveout',
    command: 'brief.min.moveout',
    args: ['--glob', 'a', '--files'],
    messageHas: 'unknown flag(s): --files',
  },
  {
    description: 'a bare --glob has no value',
    command: 'census.cues',
    args: ['--glob'],
    messageHas: 'typed with no value: --glob',
  },
  {
    description: 'an unknown --mode value',
    command: 'brief.min.moveout',
    args: ['--glob', 'a', '--mode', 'yolo'],
    messageHas: 'unknown --mode: yolo',
  },
];

describe('asLibrarianCliArgs', () => {
  TEST_CASES_OK.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(
        asLibrarianCliArgs({ args: thisCase.args, command: thisCase.command }),
      ).toEqual(thisCase.expected);
    });
  });

  TEST_CASES_REFUSED.forEach((thisCase) => {
    test(`refuses: ${thisCase.description}`, () => {
      const error = getError(() =>
        asLibrarianCliArgs({ args: thisCase.args, command: thisCase.command }),
      );
      expect(error).toBeInstanceOf(ConstraintError);
      expect(error.message).toContain(thisCase.messageHas);
    });
  });
});
