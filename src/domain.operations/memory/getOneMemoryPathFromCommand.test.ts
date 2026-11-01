import { getOneMemoryPathFromCommand } from './getOneMemoryPathFromCommand';
import { isNativeMemoryPath } from './isNativeMemoryPath';

/**
 * .what = data-driven cases for the memory-path lift from a command
 * .why = the path named in the nudge is the path this lifts
 */
const TEST_CASES: Array<{
  description: string;
  command: string;
  expect: string | null;
}> = [
  {
    description: 'a copy into memory',
    command: 'cp note.md /home/a/.claude/projects/p/memory/note.md',
    expect: '/home/a/.claude/projects/p/memory/note.md',
  },
  {
    description: 'a copy out of memory',
    command: 'cp /home/a/.claude/projects/p/memory/note.md /tmp/note.md',
    expect: '/home/a/.claude/projects/p/memory/note.md',
  },
  {
    description: 'a quoted path, quotes dropped',
    command: 'echo x | tee "/home/a/.claude/projects/p/MEMORY.md"',
    expect: '/home/a/.claude/projects/p/MEMORY.md',
  },
  {
    description: 'a tilde path',
    command: 'echo x | tee ~/.claude/projects/p/memory/x.md',
    expect: '~/.claude/projects/p/memory/x.md',
  },
  {
    description: 'an assignment, its name dropped',
    command: 'D=/home/a/.claude/projects/p/memory',
    expect: '/home/a/.claude/projects/p/memory',
  },
  {
    description: 'no memory path',
    command: 'cp a.md /home/a/.claude/settings.json',
    expect: null,
  },
];

/**
 * .what = every shape of native-memory path the guard knows
 * .why = a copy verb must block at each place a write blocks; the lift and the
 *        path test must agree, so a new memory shape cannot pass a copy unseen
 */
const NATIVE_MEMORY_PATHS = [
  '/home/a/.claude/projects/p/memory/note.md',
  '/home/a/.claude/projects/p/MEMORY.md',
  '/home/x/.claude/sub/dir/memory/a.md',
  '~/.claude/projects/p/memory/x.md',
  '/home/a/.claude/projects/p/memory',
];

describe('getOneMemoryPathFromCommand', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getOneMemoryPathFromCommand({ command: thisCase.command }),
      ).toEqual(thisCase.expect);
    }),
  );

  NATIVE_MEMORY_PATHS.map((path) =>
    test(`agrees with isNativeMemoryPath, in and out: ${path}`, () => {
      expect(isNativeMemoryPath({ path })).toEqual(true);
      expect(
        getOneMemoryPathFromCommand({ command: `cp a.md ${path}` }),
      ).toEqual(path);
      expect(
        getOneMemoryPathFromCommand({ command: `cp ${path} a.md` }),
      ).toEqual(path);
    }),
  );
});
