import { given, then, when } from 'test-fns';

import { getUnknownGuardVars } from './getUnknownGuardVars';

describe('getUnknownGuardVars', () => {
  given('[case1] content with only runtime allowlist vars', () => {
    const content = `judges:
  - $rhachet judge --stone $stone --route $route --hash $hash --output $output
  - $rhx review
`;
    when('[t0] scanned', () => {
      then('returns [] (no offenders)', () => {
        expect(getUnknownGuardVars({ content })).toEqual([]);
      });
    });
  });

  given('[case2] content with a stray $FOO outside the allowlist', () => {
    const content = `judges:
  - $rhachet judge --stone $stone --extra $FOO
`;
    when('[t0] scanned', () => {
      then('returns ["$FOO"]', () => {
        expect(getUnknownGuardVars({ content })).toEqual(['$FOO']);
      });
    });
  });

  given('[case3] content with shell CONTROL syntax in a run line', () => {
    // shell control tokens must NOT be flagged as template vars
    const content = `reviews:
  peer:
    - slug: r
      run: echo "$(id)" && echo "\${1:-default}" && echo "$@ $1 $# $?"
`;
    when('[t0] scanned', () => {
      then('flags NONE of the shell control tokens', () => {
        expect(getUnknownGuardVars({ content })).toEqual([]);
      });
    });
  });

  given(
    '[case4] content with a genuine stray var AMONG shell control syntax',
    () => {
      const content = `reviews:
  peer:
    - slug: r
      run: echo "$(id)" && echo "\${1:-x}" && echo "$BADVAR"
`;
      when('[t0] scanned', () => {
        then('flags only the genuine stray ($BADVAR)', () => {
          expect(getUnknownGuardVars({ content })).toEqual(['$BADVAR']);
        });
      });
    },
  );

  given('[case5] the same stray var appears multiple times', () => {
    const content = `x: $FOO
y: $FOO
`;
    when('[t0] scanned', () => {
      then('dedupes to a single entry', () => {
        expect(getUnknownGuardVars({ content })).toEqual(['$FOO']);
      });
    });
  });

  given(
    '[case6] $BEHAVIOR_DIR_REL is treated as allowed (already replayed)',
    () => {
      const content = `artifacts:
  - $BEHAVIOR_DIR_REL/x.md
`;
      when('[t0] scanned', () => {
        then('does not flag $BEHAVIOR_DIR_REL', () => {
          expect(getUnknownGuardVars({ content })).toEqual([]);
        });
      });
    },
  );

  given(
    '[case7] a peer-review run line carries the $conversation runtime var',
    () => {
      // mirrors the real bhuild review template: a reviewer opts into the peer-review
      // conversation via `--conversation $conversation`. $conversation is a REVIEW-run
      // var (substituted in runStoneGuardReviews), so the upgrade scan must NOT flag it.
      const content = `reviews:
  peer:
    - slug: r
      run: $rhx review --diffs since-main --conversation $conversation --output "$output"
`;
      when('[t0] scanned', () => {
        then('does not flag $conversation', () => {
          expect(getUnknownGuardVars({ content })).toEqual([]);
        });
      });
    },
  );
});
