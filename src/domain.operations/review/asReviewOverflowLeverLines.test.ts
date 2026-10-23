import { given, then, when } from 'test-fns';

import { asReviewOverflowLeverLines } from './asReviewOverflowLeverLines';

const ROUTE = '.behavior/v2026_10_04.feat';

/**
 * .what = an empty mass + locus, so each case names only the inputs it is about
 */
const asEmpty = () => ({
  mass: {
    targetFiles: 0,
    'targetDiffs.additions': 0,
    'targetDiffs.deletions': 0,
    'targetDiffs.mutations': 0,
  },
  locus: {
    targetFiles: [] as { path: string; chars: number }[],
    'targetDiffs.additions': [] as { path: string; chars: number }[],
    'targetDiffs.deletions': [] as { path: string; chars: number }[],
    'targetDiffs.mutations': [] as { path: string; chars: number }[],
  },
});

describe('asReviewOverflowLeverLines', () => {
  given('[case1] an overflow led by added files', () => {
    const empty = asEmpty();
    const lines = asReviewOverflowLeverLines({
      mass: { ...empty.mass, 'targetDiffs.additions': 900, targetFiles: 100 },
      locus: {
        ...empty.locus,
        'targetDiffs.additions': [
          { path: 'src/domain.operations/review/a.ts', chars: 500 },
          { path: 'src/domain.operations/review/b.ts', chars: 300 },
          { path: 'blackbox/c.ts', chars: 100 },
          { path: `${ROUTE}/1.vision.md`, chars: 5000 },
        ],
        targetFiles: [{ path: 'src/contract/cli/d.ts', chars: 100 }],
      },
      partition: null,
      route: ROUTE,
      provenance: null,
    });

    when('[t0] the lever is chosen', () => {
      then(
        'it heads the lever with the question both levers answer, on one line',
        () => {
          expect(lines[0]).toEqual(
            '   ├─ lever — partition what the rubric grades, cut what it does not',
          );
          // 🔴 the added-vs-edited share is not restated — the directory rows above carry it
          expect(lines.join('\n')).not.toContain('target chars');
        },
      );
      then(
        'the heavy subtree stands as one partition, beside the disjoint dirs at its depth',
        () => {
          const text = lines.join('\n');
          expect(text).toContain(
            `--partition 'review=src/domain.operations/review/**,${ROUTE}/**'`,
          );
          expect(text).toContain(
            `--partition 'cli=src/contract/cli/**,${ROUTE}/**'`,
          );
          // 🔴 a printed glob list is a comma list, never a brace set
          expect(text).not.toMatch(/[{}]/);
        },
      );
      then(
        '🔴 a lone file is never named as a partition of its own — it stays in the remainder',
        () => {
          const text = lines.join('\n');
          expect(text).not.toContain(`--partition 'c.ts=`);
          expect(text).toContain(
            '(+ 1 more group — every target must sit in a partition)',
          );
        },
      );
      then(
        '🔴 the route spec rides every partition as common context, never as a partition of its own',
        () => {
          const text = lines.join('\n');
          expect(text.match(/--partition '/g)).toHaveLength(2);
          expect(text).not.toContain(`'v2026_10_04.feat=`);
        },
      );
      then('it guides to shared context and a plan preview', () => {
        const text = lines.join('\n');
        expect(text).toContain(
          'list the shared context in every partition that reads it too — route yields, briefs, shared types',
        );
        expect(text).toContain('--mode plan');
        expect(text).toContain('rhx route.guard.partition --for review');
      });
      then(
        '🔴 it says the overlap is expected and cheap — graded once, read from cache',
        () => {
          const text = lines.join('\n');
          expect(text).toContain('the overlap is graded once');
          expect(text).toContain('every partition reads it from cache');
        },
      );
      then('no upstream line is drawn for a lane with no provenance', () => {
        expect(lines.join('\n')).not.toContain('radio.task.push');
      });
      then(
        '🔴 it names BOTH levers, partition first, each framed by whether the rubric grades the mass',
        () => {
          const text = lines.join('\n');
          expect(text).toContain('--partition');
          expect(text).toContain('--paths-wout');
          expect(text.indexOf('--partition')).toBeLessThan(
            text.indexOf('--paths-wout'),
          );
          expect(text).toContain('partition what the rubric grades');
          expect(text).toContain('cut a subtree the rubric does not grade');
        },
      );
      then(
        '🔴 it never claims a bind cannot reach an added body — --paths-wout drops an added file',
        () => {
          expect(lines.join('\n')).not.toContain('cannot reach an added body');
        },
      );
      then('the lines match the snapshot', () => {
        expect(lines).toHaveLength(9);
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] an overflow led by edited files', () => {
    const empty = asEmpty();
    const lines = asReviewOverflowLeverLines({
      mass: { ...empty.mass, targetFiles: 700, 'targetDiffs.mutations': 100 },
      locus: {
        ...empty.locus,
        targetFiles: [
          { path: 'src/logic/x.test.ts', chars: 600 },
          { path: 'src/logic/y.ts', chars: 100 },
        ],
        'targetDiffs.mutations': [{ path: 'src/logic/y.ts', chars: 100 }],
      },
      partition: null,
      route: null,
      provenance: null,
    });

    when('[t0] the lever is chosen', () => {
      then(
        '🔴 it names BOTH levers, partition first, each framed by whether the rubric grades the mass',
        () => {
          const text = lines.join('\n');
          expect(text).toContain('--partition');
          expect(text).toContain('--paths-wout');
          expect(text.indexOf('--partition')).toBeLessThan(
            text.indexOf('--paths-wout'),
          );
          expect(text).toContain('partition what the rubric grades');
          expect(text).toContain('cut a subtree the rubric does not grade');
        },
      );
      then(
        '🔴 the --paths-wout example never names the heavy edited subtree — the code that most needs review',
        () => {
          expect(lines.join('\n')).not.toContain("--paths-wout 'src/logic/**'");
        },
      );
      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).not.toContain('edited files carry');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case6] an added overflow spread over more dirs than a suggestion names',
    () => {
      /**
       * .what = an added overflow over `count` disjoint top dirs, none heavy
       */
      const asLinesOfDirs = (input: { count: number }) => {
        const empty = asEmpty();
        return asReviewOverflowLeverLines({
          mass: { ...empty.mass, 'targetDiffs.additions': 100 * input.count },
          locus: {
            ...empty.locus,
            'targetDiffs.additions': Array.from(
              { length: input.count },
              (_, index) => ({ path: `dir${index + 1}/a.ts`, chars: 100 }),
            ),
          },
          partition: null,
          route: null,
          provenance: null,
        });
      };

      when('[t0] six dirs hold the mass, two past the limit', () => {
        const lines = asLinesOfDirs({ count: 6 });
        then('four dirs are named, and the tail counts the two left', () => {
          const text = lines.join('\n');
          expect(text.match(/--partition '/g)).toHaveLength(4);
          expect(text).toContain(
            '(+ 2 more groups — every target must sit in a partition)',
          );
        });
        then('the lines match the snapshot', () => {
          expect(lines.join('\n')).toContain("--partition 'dir4=dir4/**'");
          expect(lines.join('\n')).not.toContain("--partition 'dir5=");
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });

      when('[t1] five dirs hold the mass, one past the limit', () => {
        const lines = asLinesOfDirs({ count: 5 });
        then('the tail counts the one left in the singular', () => {
          expect(lines.join('\n')).toContain(
            '(+ 1 more group — every target must sit in a partition)',
          );
        });
        then('the lines match the snapshot', () => {
          expect(lines.join('\n').match(/--partition '/g)).toHaveLength(4);
          expect(lines.join('\n')).not.toContain('more groups');
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  given('[case4] an overflow whose targets carry no mass at all', () => {
    const empty = asEmpty();
    const lines = asReviewOverflowLeverLines({
      ...empty,
      partition: null,
      route: null,
      provenance: null,
    });

    when('[t0] the lever is chosen', () => {
      then(
        'it names the supplies, since no target lever can reach them',
        () => {
          expect(lines.join('\n')).toContain(
            'narrow --rules, --refs, or --conversation',
          );
          expect(lines.join('\n')).not.toContain('--partition');
        },
      );
      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toContain(
          'lever — the targets carry no mass; the rubric, refs, or conversation fill the window',
        );
        expect(lines).toHaveLength(2);
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a partition run that still overflows, from a stamped lane',
    () => {
      const empty = asEmpty();
      const lines = asReviewOverflowLeverLines({
        mass: { ...empty.mass, 'targetDiffs.additions': 800 },
        locus: {
          ...empty.locus,
          'targetDiffs.additions': [
            { path: 'src/a/one.ts', chars: 600 },
            { path: 'src/b/two.ts', chars: 200 },
          ],
        },
        partition: 'src',
        route: ROUTE,
        provenance: {
          slug: 'repo-rules',
          guard: `${ROUTE}/5.3.verification.guard`,
          uri: 'node_modules/rhachet-roles-bhuild/dist/templates/5.3.verification.guard',
          repo: 'ehmpathy/rhachet-roles-bhuild',
        },
      });

      when('[t0] the lever is chosen', () => {
        then(
          'it asks to replace the partition that overflowed with narrower ones',
          () => {
            expect(lines.join('\n')).toContain(
              'partition `src` still overflows',
            );
            expect(lines.join('\n')).toContain(
              `--partition 'a=src/a/**,${ROUTE}/**'`,
            );
            expect(lines.join('\n')).toContain(
              `--partition 'b=src/b/**,${ROUTE}/**'`,
            );
          },
        );
        then(
          '🔴 it names BOTH levers, partition first, each framed by whether the rubric grades the mass',
          () => {
            const text = lines.join('\n');
            expect(text).toContain('--partition');
            expect(text).toContain('--paths-wout');
            expect(text.indexOf('--partition')).toBeLessThan(
              text.indexOf('--paths-wout'),
            );
            expect(text).toContain('cut a subtree the rubric does not grade');
          },
        );
        then('it names the dispatch to the repo that owns the template', () => {
          expect(lines.join('\n')).toContain(
            'rhx radio.task.push --via gh.issues --into ehmpathy/rhachet-roles-bhuild',
          );
          expect(lines.join('\n')).toContain(
            'review lane repo-rules overflows',
          );
        });
        then('the lines match the snapshot', () => {
          expect(lines.join('\n')).toContain(
            'upstream — stamped from node_modules/rhachet-roles-bhuild/dist/templates/5.3.verification.guard; dispatch the cut so every route it stamps inherits it',
          );
          expect(lines.join('\n')).not.toContain(
            'partition what the rubric grades',
          );
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case5] a partition run that overflows with no child dir over half its mass',
    () => {
      const empty = asEmpty();
      const lines = asReviewOverflowLeverLines({
        mass: { ...empty.mass, 'targetDiffs.additions': 1000 },
        locus: {
          ...empty.locus,
          'targetDiffs.additions': [
            { path: 'src/review/warmer/a.ts', chars: 300 },
            { path: 'src/review/meter/b.ts', chars: 250 },
            { path: 'src/review/grove/c.ts', chars: 50 },
            { path: 'src/review/d.ts', chars: 400 },
          ],
        },
        partition: 'src/review',
        route: ROUTE,
        provenance: null,
      });

      when('[t0] the lever is chosen', () => {
        then(
          'it never names the partition that overflowed as its own cure',
          () => {
            expect(lines.join('\n')).not.toContain('src/review/**');
          },
        );
        then(
          'it splits one level deeper, into the disjoint child dirs, the flat file left in the remainder',
          () => {
            const text = lines.join('\n');
            expect(text).toContain(
              `--partition 'warmer=src/review/warmer/**,${ROUTE}/**'`,
            );
            expect(text).toContain(
              `--partition 'meter=src/review/meter/**,${ROUTE}/**'`,
            );
            expect(text).not.toContain(`--partition 'd.ts=`);
            expect(text).toContain(
              '(+ 1 more group — every target must sit in a partition)',
            );
          },
        );
        then('the lines match the snapshot', () => {
          expect(lines.join('\n')).toContain(
            'partition `src/review` still overflows alone',
          );
          expect(lines.join('\n').match(/--partition '/g)).toHaveLength(3);
          expect(lines.join('\n')).toMatchSnapshot();
        });
      });
    },
  );
});
