import { given, then, when } from 'test-fns';

import { asReviewRubricsConfig } from './asReviewRubricsConfig';

describe('asReviewRubricsConfig', () => {
  given('[case1] a valid multi-rubric yml with no vibe', () => {
    const raw = `
rubrics:
  - slug: mech-failhides
    purpose: detect hidden errors
    rules:
      - .agent/**/rule.forbid.failhide.md
      - .agent/**/rule.require.failfast.md
  - slug: mech-decode-friction
    rules:
      - .agent/**/rule.forbid.inline-decode-friction.md
`;

    when('[t0] parsed', () => {
      then('it returns both rubrics', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.rubrics).toHaveLength(2);
        expect(config.rubrics[0]?.slug).toEqual('mech-failhides');
        expect(config.rubrics[1]?.slug).toEqual('mech-decode-friction');
      });

      then('it reads the rules list', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.rubrics[0]?.rules).toEqual([
          '.agent/**/rule.forbid.failhide.md',
          '.agent/**/rule.require.failfast.md',
        ]);
      });

      then('it reads the optional purpose', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.rubrics[0]?.purpose).toEqual('detect hidden errors');
        expect(config.rubrics[1]?.purpose).toBeUndefined();
      });

      then('it defaults the vibe to the owl', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.vibe).toEqual({ mascot: '🦉', artifact: '🔍' });
      });
    });
  });

  given('[case2] a yml with a vibe override', () => {
    const raw = `
vibe:
  mascot: 🐢
  artifact: 🐚
rubrics:
  - slug: only
    rules:
      - .agent/**/rule.md
`;

    when('[t0] parsed', () => {
      then('it uses the declared mascot + artifact', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.vibe).toEqual({ mascot: '🐢', artifact: '🐚' });
      });
    });
  });

  given('[case3] a single-rubric yml', () => {
    const raw = `
rubrics:
  - slug: solo
    rules:
      - .agent/**/rule.md
`;

    when('[t0] parsed', () => {
      then('it returns exactly one rubric', () => {
        const config = asReviewRubricsConfig({ raw });
        expect(config.rubrics).toHaveLength(1);
        expect(config.rubrics[0]?.slug).toEqual('solo');
      });
    });
  });

  given('[case4] a yml with duplicate slugs', () => {
    const raw = `
rubrics:
  - slug: dup
    rules: [.agent/a.md]
  - slug: dup
    rules: [.agent/b.md]
`;

    when('[t0] parsed', () => {
      then('it throws, cites the duplicate slug', () => {
        expect(() => asReviewRubricsConfig({ raw })).toThrow(
          'duplicate rubric slug: dup',
        );
      });
    });
  });

  given('[case5] a yml with an empty rubrics list', () => {
    const raw = `rubrics: []`;

    when('[t0] parsed', () => {
      then('it throws no-rubrics', () => {
        expect(() => asReviewRubricsConfig({ raw })).toThrow(
          'no rubrics found in rubrics.yml',
        );
      });
    });
  });

  given('[case6] a yml with no rubrics key', () => {
    const raw = `vibe: { mascot: 🐢, artifact: 🐚 }`;

    when('[t0] parsed', () => {
      then('it throws no-rubrics', () => {
        expect(() => asReviewRubricsConfig({ raw })).toThrow(
          'no rubrics found in rubrics.yml',
        );
      });
    });
  });

  given('[case7] a malformed yaml string', () => {
    const raw = `rubrics:\n  - slug: bad\n   rules: [oops indentation`;

    when('[t0] parsed', () => {
      then('it throws a parse failure', () => {
        expect(() => asReviewRubricsConfig({ raw })).toThrow(
          'failed to parse rubrics.yml',
        );
      });
    });
  });

  given('[case8] a rubric with no rules', () => {
    const raw = `
rubrics:
  - slug: norules
`;

    when('[t0] parsed', () => {
      then('it throws, cites the rubric', () => {
        expect(() => asReviewRubricsConfig({ raw })).toThrow(
          'rubric "norules" lacks a non-empty rules list',
        );
      });
    });
  });
});
