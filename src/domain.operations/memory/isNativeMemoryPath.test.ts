import { isNativeMemoryPath } from './isNativeMemoryPath';

/**
 * .what = data-driven cases for the native-memory path test
 * .why = the guard blocks on this one test; each boundary is pinned here
 */
const TEST_CASES: Array<{
  description: string;
  path: string;
  expect: boolean;
}> = [
  {
    description: 'a file in a project memory dir',
    path: '/home/agent/.claude/projects/p/memory/note.md',
    expect: true,
  },
  {
    description: 'the MEMORY.md index outside a memory dir',
    path: '/home/agent/.claude/projects/p/MEMORY.md',
    expect: true,
  },
  {
    description: 'a nested memory dir',
    path: '/home/x/.claude/sub/dir/memory/a.md',
    expect: true,
  },
  {
    description: 'the memory dir itself, with no slash after it',
    path: '/home/agent/.claude/projects/p/memory',
    expect: true,
  },
  {
    description: 'a dir whose name only starts with memory is not memory',
    path: '/home/agent/.claude/projects/p/memoryish/a.md',
    expect: false,
  },
  {
    description: 'claude config is not memory',
    path: '/home/agent/.claude/settings.json',
    expect: false,
  },
  {
    description: 'a user CLAUDE.md is already durable',
    path: '/home/agent/.claude/CLAUDE.md',
    expect: false,
  },
  {
    description: 'a memory dir outside ~/.claude is not native memory',
    path: '/home/agent/repo/memory/note.md',
    expect: false,
  },
  {
    description: 'the durable brief target',
    path: '.agent/repo=.this/role=any/briefs/lesson.md',
    expect: false,
  },
];

describe('isNativeMemoryPath', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isNativeMemoryPath({ path: thisCase.path })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
