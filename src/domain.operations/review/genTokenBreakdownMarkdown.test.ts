import { given, then, when } from 'test-fns';

import { NAMES_OF_TARGET_INPUT } from './asTargetContentsByInput';
import { genTokenBreakdownMarkdown } from './genTokenBreakdownMarkdown';
import type { TokenBreakdownEntry } from './genTokenBreakdownReport';

const asEntry = (input: {
  path: string;
  tokens: number;
}): TokenBreakdownEntry => ({
  path: input.path,
  type: 'FILE',
  tokens: input.tokens,
  tokensHuman: `${input.tokens}`,
  tokensScale: '',
});

const asBreakdown = (input: {
  entries: TokenBreakdownEntry[];
}): { entries: TokenBreakdownEntry[]; total: number } => ({
  entries: input.entries,
  total: input.entries.reduce((sum, entry) => sum + entry.tokens, 0),
});

describe('genTokenBreakdownMarkdown', () => {
  given('[case1] rules and targets across nested dirs', () => {
    const rules = asBreakdown({
      entries: [asEntry({ path: 'briefs/rule.forbid.x.md', tokens: 1_200 })],
    });
    const targets = asBreakdown({
      entries: [
        asEntry({ path: 'src/a/one.ts', tokens: 300 }),
        asEntry({ path: 'src/a/two.ts', tokens: 2_500 }),
        asEntry({ path: 'src/b.ts', tokens: 40 }),
      ],
    });
    const all = asBreakdown({
      entries: [...rules.entries, ...targets.entries],
    });
    const byInput = Object.fromEntries(
      NAMES_OF_TARGET_INPUT.map((name, index) => [
        name,
        index === 0 ? targets : asBreakdown({ entries: [] }),
      ]),
    ) as Record<(typeof NAMES_OF_TARGET_INPUT)[number], typeof targets>; // fromEntries widens keys to string; the map covers every name

    when('[t0] the markdown is generated', () => {
      const markdown = genTokenBreakdownMarkdown({
        all,
        rules,
        targets,
        ...byInput,
      });

      then('each section renders its tree, largest child first', () => {
        expect(markdown).toContain('total: 4.0k tokens');
        expect(markdown.indexOf('two.ts')).toBeLessThan(
          markdown.indexOf('one.ts'),
        );
        expect(markdown).toContain('└─ b.ts (40, 1.0%)');
      });

      then('the whole render matches the snapshot', () => {
        expect(markdown).toContain('## targetFiles\n\ntotal: 2.8k tokens');
        expect(markdown).toContain(
          '## targetDiffs.additions\n\ntotal: 0 tokens',
        );
        expect(markdown).toMatchSnapshot();
      });
    });
  });
});
