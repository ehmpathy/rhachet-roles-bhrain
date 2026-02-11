import { given, then, when } from 'test-fns';

import { computeOutputTree } from './computeOutputTree';

describe('computeOutputTree', () => {
  given('[case1] files were created', () => {
    when('[t0] multiple files created', () => {
      then('renders tree with + symbols', () => {
        const result = computeOutputTree({
          created: ['0.wish.md', '1.probes.aim.stone'],
          kept: [],
          updated: [],
        });

        expect(result).toContain('🦉 hooda thunk?');
        expect(result).toContain('├─ + 0.wish.md');
        expect(result).toContain('└─ + 1.probes.aim.stone');
      });
    });

    when('[t1] single file created', () => {
      then('renders tree with └─ branch', () => {
        const result = computeOutputTree({
          created: ['0.wish.md'],
          kept: [],
          updated: [],
        });

        expect(result).toContain('└─ + 0.wish.md');
        expect(result).not.toContain('├─');
      });
    });
  });

  given('[case2] files were kept', () => {
    when('[t0] files already existed', () => {
      then('renders tree with ✓ symbols', () => {
        const result = computeOutputTree({
          created: [],
          kept: ['0.wish.md', '1.probes.aim.stone'],
          updated: [],
        });

        expect(result).toContain('├─ ✓ 0.wish.md');
        expect(result).toContain('└─ ✓ 1.probes.aim.stone');
      });
    });
  });

  given('[case3] files were updated', () => {
    when('[t0] files were refreshed', () => {
      then('renders tree with ↻ symbols', () => {
        const result = computeOutputTree({
          created: [],
          kept: [],
          updated: ['0.wish.md'],
        });

        expect(result).toContain('└─ ↻ 0.wish.md');
      });
    });
  });

  given('[case4] mixed actions', () => {
    when('[t0] some created, some kept', () => {
      then('renders tree sorted alphabetically', () => {
        const result = computeOutputTree({
          created: ['2.probes.emit.stone'],
          kept: ['0.wish.md', '1.probes.aim.stone'],
          updated: [],
        });

        const lines = result.split('\n');
        expect(lines[1]).toContain('0.wish.md');
        expect(lines[2]).toContain('1.probes.aim.stone');
        expect(lines[3]).toContain('2.probes.emit.stone');
      });
    });
  });

  given('[case5] no files', () => {
    when('[t0] all arrays empty', () => {
      then('returns only header', () => {
        const result = computeOutputTree({
          created: [],
          kept: [],
          updated: [],
        });

        expect(result).toEqual('🦉 hooda thunk?');
      });
    });
  });
});
