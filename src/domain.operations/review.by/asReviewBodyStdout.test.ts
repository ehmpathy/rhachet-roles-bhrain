import { given, then, when } from 'test-fns';

import { asReviewBodyStdout } from './asReviewBodyStdout';

describe('asReviewBodyStdout', () => {
  given('[case1] a captured review stdout led by the rhx dispatch banner', () => {
    const stdout = [
      '🪨 run solid skill repo=bhrain/role=reviewer/skill=review',
      '',
      '🦉 let\'s review',
      '   └─ scope',
      '      └─ paths: src/clean.ts',
      '',
      '🦉 not even a vole',
      '   └─ summary',
      '      ├─ 0 blockers',
      '      └─ 0 nitpicks',
    ].join('\n');

    when('[t0] the banner is stripped', () => {
      const body = asReviewBodyStdout({ stdout });

      then('the body opens on the review header, not the banner', () => {
        expect(body.startsWith('🦉 let\'s review')).toBe(true);
      });

      then('no `🪨 run solid skill` line remains', () => {
        expect(body).not.toContain('🪨 run solid skill');
      });

      then('the review content is preserved verbatim', () => {
        expect(body).toContain('🦉 not even a vole');
        expect(body).toContain('0 blockers');
        expect(body).toContain('0 nitpicks');
      });
    });
  });

  given('[case2] two blank lines after the banner', () => {
    const stdout =
      '🪨 run solid skill repo=bhrain/role=reviewer/skill=review\n\n\n🦉 let\'s review\n';

    when('[t0] the banner is stripped', () => {
      then('every blank line after the banner is dropped', () => {
        expect(asReviewBodyStdout({ stdout })).toEqual('🦉 let\'s review\n');
      });
    });
  });

  given('[case2b] a blank line ahead of the banner (the captured-subprocess shape)', () => {
    // runOneReview captures the inner `rhx review` stdout, which opens with a blank line before the
    // harness banner — the exact shape that made an anchor-on-🪨 regex miss the banner in the guard seam
    const stdout =
      '\n🪨 run solid skill repo=bhrain/role=reviewer/skill=review\n\n🦉 let\'s review\n';

    when('[t0] the banner is stripped', () => {
      const body = asReviewBodyStdout({ stdout });

      then('the blank + banner are both gone', () => {
        expect(body).toEqual('🦉 let\'s review\n');
      });

      then('no `🪨 run solid skill` line remains', () => {
        expect(body).not.toContain('🪨 run solid skill');
      });
    });
  });

  given('[case3] a stdout with no banner (a node-import invocation)', () => {
    const stdout = '🦉 let\'s review\n   └─ summary\n';

    when('[t0] passed through', () => {
      then('it comes back unchanged', () => {
        expect(asReviewBodyStdout({ stdout })).toEqual(stdout);
      });
    });
  });

  given('[case4] an already-stripped body', () => {
    const stdout = '🦉 not even a vole\n';

    when('[t0] passed through', () => {
      then('it comes back unchanged (idempotent)', () => {
        const once = asReviewBodyStdout({ stdout });
        expect(asReviewBodyStdout({ stdout: once })).toEqual(stdout);
      });
    });
  });
});
