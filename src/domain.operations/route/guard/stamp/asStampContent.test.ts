import { given, then, when } from 'test-fns';

import { asStampContent } from './asStampContent';

describe('asStampContent', () => {
  given('[case1] an emit with stdout only (no stderr)', () => {
    const emit = {
      stdout:
        '🗿 route.stone.set\n   ├─ stone = 1.vision\n   └─ passage = allowed',
    };

    when('[t0] the stamp content is composed', () => {
      const content = asStampContent({ emit });

      then('it equals the stdout verbatim', () => {
        expect(content).toEqual(emit.stdout);
      });

      then('it locks the stdout-only shape', () => {
        expect(content).toMatchInlineSnapshot(`
          "🗿 route.stone.set
             ├─ stone = 1.vision
             └─ passage = allowed"
        `);
      });
    });
  });

  given('[case2] an emit with stdout and stderr', () => {
    const emit = {
      stdout:
        '🗿 route.stone.set\n   ├─ stone = 5.1.execution\n   └─ passage = blocked',
      stderr: '🪶 judge 1\n   └─ reason: blockers found',
    };

    when('[t0] the stamp content is composed', () => {
      const content = asStampContent({ emit });

      then('it appends stderr under a box-draw divider', () => {
        expect(content).toContain('─'.repeat(64));
        expect(content).toContain(emit.stdout);
        expect(content).toContain(emit.stderr);
      });

      then('it locks the stdout + stderr-divider shape', () => {
        expect(content).toMatchInlineSnapshot(`
"🗿 route.stone.set
   ├─ stone = 5.1.execution
   └─ passage = blocked

────────────────────────────────────────────────────────────────

🪶 judge 1
   └─ reason: blockers found"
`);
      });
    });
  });

  given('[case3] an emit with an empty-string stderr', () => {
    const emit = {
      stdout: '🗿 route.stone.set\n   └─ passage = allowed',
      stderr: '',
    };

    when('[t0] the stamp content is composed', () => {
      const content = asStampContent({ emit });

      then('the empty stderr is treated as absent (no divider)', () => {
        expect(content).toEqual(emit.stdout);
        expect(content).not.toContain('─'.repeat(64));
      });
    });
  });

  given('[case4] an emit whose streams carry ansi escape codes', () => {
    const emit = {
      stdout: '\u001b[32m🗿 route.stone.set\u001b[0m\n   └─ passage = blocked',
      stderr:
        '\u001b[0m\u001b[31m🪶 judge 1\u001b[0m\n\u001b[31m   └─ blocked\u001b[0m',
    };

    when('[t0] the stamp content is composed', () => {
      const content = asStampContent({ emit });

      then('the persisted stamp is free of ansi escape codes', () => {
        // .why = the stamp is a human-read artifact on disk; ansi codes are noise
        // biome-ignore lint/suspicious/noControlCharactersInRegex: assert absence of escapes
        expect(content).not.toMatch(/\u001b\[/);
      });

      then('the visible text survives the strip', () => {
        expect(content).toContain('🗿 route.stone.set');
        expect(content).toContain('passage = blocked');
        expect(content).toContain('🪶 judge 1');
        expect(content).toContain('└─ blocked');
      });
    });
  });
});
