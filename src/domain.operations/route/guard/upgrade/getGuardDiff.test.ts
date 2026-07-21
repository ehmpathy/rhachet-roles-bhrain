import { given, then, when } from 'test-fns';

import { getGuardDiff } from './getGuardDiff';

describe('getGuardDiff', () => {
  given('[case1] current and next differ by one line', () => {
    const current = `line a
line b
line c
`;
    const next = `line a
line B-changed
line c
`;
    when('[t0] diffed', () => {
      then('emits a remove for the old line and an add for the new', () => {
        const hunks = getGuardDiff({ current, next });
        const removed = hunks.filter((h) => h.kind === 'remove');
        const added = hunks.filter((h) => h.kind === 'add');
        expect(removed.map((h) => h.text)).toContain('line b');
        expect(added.map((h) => h.text)).toContain('line B-changed');
      });

      then('keeps the unchanged lines as context', () => {
        const hunks = getGuardDiff({ current, next });
        const context = hunks.filter((h) => h.kind === 'context');
        expect(context.map((h) => h.text)).toContain('line a');
        expect(context.map((h) => h.text)).toContain('line c');
      });
    });
  });

  given('[case2] current and next are identical', () => {
    const same = `line a
line b
`;
    when('[t0] diffed', () => {
      then('emits no add and no remove hunks', () => {
        const hunks = getGuardDiff({ current: same, next: same });
        expect(hunks.filter((h) => h.kind === 'add')).toHaveLength(0);
        expect(hunks.filter((h) => h.kind === 'remove')).toHaveLength(0);
      });
    });
  });

  given('[case3] next adds a brand-new line', () => {
    const current = `line a
`;
    const next = `line a
line b
`;
    when('[t0] diffed', () => {
      then('emits an add for the new line', () => {
        const hunks = getGuardDiff({ current, next });
        expect(
          hunks.filter((h) => h.kind === 'add').map((h) => h.text),
        ).toContain('line b');
      });
    });
  });
});
