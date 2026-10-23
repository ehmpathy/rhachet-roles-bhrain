import { formatTokenSpendErrorTree } from './formatTokenSpendErrorTree';

describe('formatTokenSpendErrorTree', () => {
  test('a constraint → the class header, one leaf per fact, lists as children, the fix last', () => {
    const stderr = formatTokenSpendErrorTree({
      header: '✋ ConstraintError',
      message: 'transcript not found',
      facts: {
        hint: 'pass the path of the transcript',
        uuid: '4444',
        roots: ['/a/projects', '/b/projects'],
      },
    });
    const lines = stderr.split('\n');
    expect(lines[0]).toEqual('🦉 the pond is still; naught to reflect');
    expect(stderr).toContain('└─ ✋ ConstraintError: transcript not found');
    expect(stderr).toContain('├─ roots (2)');
    expect(lines.filter((line) => line.trim() !== '').at(-1)).toContain(
      '└─ fix: pass the path of the transcript',
    );
    expect(stderr).toMatchSnapshot();
  });

  test('a halt with why, fix, and or → each last in order, each command beneath', () => {
    const stderr = formatTokenSpendErrorTree({
      header: '✋ ConstraintError',
      message: 'transcript holds no metered calls',
      facts: {
        path: '/p/a.jsonl',
        records: '1 (0 assistant records with message.usage)',
        why: 'a fixture has no usage to read',
        hint: 'point at another transcript',
        hintRun: 'rhx reflect.on.token.spend --from <path-to-another.jsonl>',
        or: 'read the whole dir as a corpus',
        orRun: "rhx reflect.on.token.spend --from '/p/*.jsonl'",
      },
    });
    const lines = stderr.split('\n').filter((line) => line.trim() !== '');
    expect(lines.slice(-5)).toEqual([
      '      ├─ why: a fixture has no usage to read',
      '      ├─ fix: point at another transcript',
      '      │  └─ rhx reflect.on.token.spend --from <path-to-another.jsonl>',
      '      └─ or: read the whole dir as a corpus',
      "         └─ rhx reflect.on.token.spend --from '/p/*.jsonl'",
    ]);
    expect(stderr).not.toContain('hintRun');
    expect(stderr).toMatchSnapshot();
  });

  test('a malfunction with no facts → the header alone', () => {
    const stderr = formatTokenSpendErrorTree({
      header: '💥 MalfunctionError',
      message: 'no transcript could be read',
      facts: null,
    });
    expect(stderr).toContain(
      '└─ 💥 MalfunctionError: no transcript could be read',
    );
    expect(stderr).toMatchSnapshot();
  });
});
