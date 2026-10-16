import { BadRequestError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';

import type {
  PromptComposition,
  PromptInputWeight,
} from '@src/domain.objects/Reviewer/PromptComposition';

import { emitReviewOverflowRefusal } from './emitReviewOverflowRefusal';

/**
 * .what = one named input's weight, for a hand-built composition
 */
const asWeight = (chars: number, cacheable: boolean): PromptInputWeight => ({
  chars,
  count: chars === 0 ? 0 : 1,
  cacheable,
});

/**
 * .what = a refused prompt's composition — bodies dominate, diffs second
 * .why = the rows sum to `chars`, as a real composition's do by algebra, so the
 *        fold the refusal renders through accepts it
 */
const COMPOSITION: PromptComposition = {
  chars: 1_000_000,
  attribution: 'attributed',
  cacheable: { head: 750_000, tail: 250_000 },
  inputs: {
    instructions: asWeight(10_000, true),
    outputFormat: asWeight(5_000, true),
    rules: asWeight(30_000, true),
    refs: asWeight(0, true),
    conversation: asWeight(0, false),
    'targetDiffs.additions': asWeight(150_000, true),
    'targetDiffs.deletions': asWeight(0, true),
    'targetDiffs.mutations': asWeight(100_000, false),
    targetFiles: asWeight(700_000, true),
    targetPaths: asWeight(0, true),
    markup: asWeight(5_000, true),
  },
};

/**
 * .what = a composition with no targets at all — the head and the rubric alone
 */
const COMPOSITION_OF_NO_TARGETS: PromptComposition = {
  chars: 45_000,
  attribution: 'attributed',
  cacheable: { head: 45_000, tail: 0 },
  inputs: {
    instructions: asWeight(10_000, true),
    outputFormat: asWeight(5_000, true),
    rules: asWeight(30_000, true),
    refs: asWeight(0, true),
    conversation: asWeight(0, false),
    'targetDiffs.additions': asWeight(0, true),
    'targetDiffs.deletions': asWeight(0, true),
    'targetDiffs.mutations': asWeight(0, false),
    targetFiles: asWeight(0, true),
    targetPaths: asWeight(0, true),
    markup: asWeight(0, true),
  },
};

/**
 * .what = runs the refusal and captures what it wrote to stderr
 * .why = the refusal emits its scope dump and then throws, so both halves are read
 *        from one run — the stderr lines and the error it raised
 */
const getOneRefusalRun = async (
  input: Parameters<typeof emitReviewOverflowRefusal>[0],
): Promise<{ error: Error; stderr: string }> => {
  // a hand fake captures stderr; restored in `finally`, so no other case inherits it
  const calls: unknown[][] = [];
  const errorOriginal = console.error;
  console.error = (...args: unknown[]) => void calls.push(args);
  try {
    const error = await getError(async () => emitReviewOverflowRefusal(input));
    const stderr = calls.map((call) => call.join(' ')).join('\n');
    return { error, stderr };
  } finally {
    console.error = errorOriginal;
  }
};

describe('emitReviewOverflowRefusal', () => {
  given(
    '[case1] a prompt at 82% of its window, scoped by diffs and paths',
    () => {
      when('[t0] the refusal runs', () => {
        const run = useThen('it completes its dump and throws', async () =>
          getOneRefusalRun({
            figures: { percentOfWindow: 82.4, windowTokens: 200000 },
            rules: { flag: 'rules/*.md', files: 7, tokens: 12345 },
            diffs: { flag: 'since-main', files: 41 },
            paths: { with: ['src/**/*.ts'], wout: ['**/*.test.ts'], files: 88 },
            joined: { mode: 'union', files: 96, tokens: 151234 },
            composition: COMPOSITION,
            // the locus sums to the composition's target rows — 700k + 150k + 100k
            locus: {
              targetFiles: [
                { path: 'src/domain.operations/invoice/a.ts', chars: 500_000 },
                { path: 'src/domain.operations/invoice/b.ts', chars: 120_000 },
                { path: 'blackbox/invoice.acceptance.test.ts', chars: 70_000 },
                { path: 'src/contract/cli/invoice.ts', chars: 10_000 },
              ],
              'targetDiffs.additions': [
                { path: 'src/domain.operations/warmer/c.ts', chars: 150_000 },
              ],
              'targetDiffs.deletions': [
                { path: 'src/domain.operations/invoice/old.ts', chars: 0 },
              ],
              'targetDiffs.mutations': [
                { path: 'src/domain.operations/invoice/b.ts', chars: 75_000 },
                { path: 'src/contract/cli/invoice.ts', chars: 25_000 },
              ],
            },
            logDirRelative: '.log/bhrain/review/2026-09-28',
            partition: null,
            route: null,
            provenance: {
              slug: 'repo-rules',
              guard: '.behavior/v2026_09_28.feat/5.3.verification.guard',
              uri: 'node_modules/rhachet-roles-bhuild/dist/templates/5.3.verification.guard',
              repo: 'ehmpathy/rhachet-roles-bhuild',
            },
          }),
        );

        then(
          '🔴 the frame points to a lever, never to a bare "reduce scope"',
          () => {
            expect(run.stderr).not.toContain('reduce scope');
            expect(run.stderr).toContain(
              'the lever that makes it fit is named below',
            );
          },
        );

        then(
          '🔴 both levers are named beneath the question that picks one',
          () => {
            // a partition spreads mass the rubric grades; a cut hides mass it does not
            expect(run.stderr).toContain(
              'lever — partition what the rubric grades, cut what it does not',
            );
            expect(run.stderr).toContain(
              "--partition 'invoice=src/domain.operations/invoice/**'",
            );
            expect(run.stderr).toContain(
              "or cut a subtree the rubric does not grade — --paths-wout '<subtree>/**'",
            );
          },
        );

        then(
          '🔴 the cut never names the heaviest subtree — the likeliest subject of the rubric',
          () => {
            expect(run.stderr).not.toContain(
              "--paths-wout 'src/domain.operations/invoice/**'",
            );
          },
        );

        then(
          '🔴 a lane stamped from a template names the upstream dispatch',
          () => {
            expect(run.stderr).toContain(
              'rhx radio.task.push --via gh.issues --into ehmpathy/rhachet-roles-bhuild',
            );
          },
        );

        then(
          '🔴 it throws a BadRequestError, which the cli renders qualified',
          () => {
            expect(run.error).toBeInstanceOf(BadRequestError);
          },
        );

        then(
          'the headline names the class and the percent of the window',
          () => {
            expect(run.stderr).toContain(
              '✋ ConstraintError: prompt exceeds 75% of context window',
            );
            expect(run.stderr).toContain('82.4% of 200,000 tokens');
          },
        );

        then('the dump names each flag and where to look next', () => {
          expect(run.stderr).toContain('rules: rules/*.md');
          expect(run.stderr).toContain('diffs: since-main');
          expect(run.stderr).toContain('joined via union');
          expect(run.stderr).toContain(
            '.log/bhrain/review/2026-09-28/input.scope.debug.json',
          );
        });

        then(
          '🔴 the dump names which directories carry the target mass, heaviest first',
          () => {
            // the address a driver prunes by; without it they hand-roll a census
            expect(run.stderr).toContain(
              'target mass by directory — 950.0k chars over 4 directories',
            );
            const lines = run.stderr.split('\n');
            const rowOfInvoice = lines.findIndex((line) =>
              line.includes('src/domain.operations/invoice'),
            );
            const rowOfBlackbox = lines.findIndex((line) =>
              line.includes(' blackbox '),
            );
            expect(rowOfInvoice).toBeGreaterThan(-1);
            expect(rowOfBlackbox).toBeGreaterThan(rowOfInvoice);
            expect(lines[rowOfInvoice]).toContain('73.2%');
          },
        );

        then(
          '🔴 the directory table is ONE block, never one per kind — a reader need not sum across blocks',
          () => {
            const heads = run.stderr
              .split('\n')
              .filter((line) => line.includes('target mass by directory'));
            expect(heads).toHaveLength(1);
            expect(run.stderr).not.toContain('locus:');
          },
        );

        then(
          '🔴 each directory row names what its mass IS — bodies, added, edits — in plain words',
          () => {
            const lines = run.stderr.split('\n');
            const rowOf = (dir: string) =>
              lines.find(
                (line) => line.includes(dir) && line.includes('chars  '),
              );
            expect(rowOf('src/domain.operations/invoice')).toContain(
              '620.0k bodies · 75.0k edits',
            );
            expect(rowOf('src/domain.operations/warmer')).toContain(
              '150.0k added',
            );
            expect(run.stderr).not.toContain('— targetFiles');
          },
        );

        then(
          '🔴 the prompt is ONE line — its total, the target figure the table sums to, then each other input that sent chars, heaviest first',
          () => {
            expect(run.stderr).toContain(
              '├─ prompt — 1.0M chars · 950.0k targets (95.0%) · 30.0k rules · 10.0k instructions · 5.0k outputFormat · 5.0k scaffold',
            );
            // a zero input fills naught, and an overflow is a size question, never a cache one
            expect(run.stderr).not.toContain('0 chars');
            expect(run.stderr).not.toContain('cacheable');
            expect(run.stderr).not.toContain('composition:');
          },
        );

        then(
          '🔴 the lever restates no share — the directory rows above carry the kinds',
          () => {
            expect(run.stderr).toContain(
              '├─ lever — partition what the rubric grades, cut what it does not',
            );
            expect(run.stderr).not.toContain('edited files carry');
          },
        );

        then('the stderr matches the snapshot', () => {
          expect(run.stderr).toContain('target mass by directory');
          expect(run.stderr).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a prompt with no diffs flag and no path filters', () => {
    when('[t0] the refusal runs', () => {
      const run = useThen('it completes its dump and throws', async () =>
        getOneRefusalRun({
          figures: { percentOfWindow: 90, windowTokens: 128000 },
          rules: { flag: undefined, files: 0, tokens: 0 },
          diffs: { flag: undefined, files: 0 },
          paths: { with: [], wout: [], files: 0 },
          joined: { mode: 'union', files: 0, tokens: 0 },
          composition: COMPOSITION_OF_NO_TARGETS,
          locus: {
            targetFiles: [],
            'targetDiffs.additions': [],
            'targetDiffs.deletions': [],
            'targetDiffs.mutations': [],
          },
          logDirRelative: '.log/bhrain/review/2026-09-28',
          partition: null,
          route: null,
          provenance: null,
        }),
      );

      then(
        '🔴 the absent flags still render, and it throws the BadRequestError',
        () => {
          expect(run.error).toBeInstanceOf(BadRequestError);
          expect(run.stderr).toContain('files: —');
        },
      );

      then('an empty target set reads as such, not as a zero locus', () => {
        expect(run.stderr).toContain('target mass by directory — none sent');
        expect(run.stderr).not.toContain('chars over');
      });

      then('the stderr matches the snapshot', () => {
        expect(run.stderr).toContain(
          'lever — the targets carry no mass; the rubric, refs, or conversation fill the window',
        );
        // no target mass, so the prompt line states a zero target figure, never omits it
        expect(run.stderr).toContain('0 targets (0.0%)');
        expect(run.stderr).not.toContain('upstream');
        expect(run.stderr).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a rules flag given empty — an unset shell var, or `[]` from an sdk caller',
    () => {
      when('[t0] the refusal runs', () => {
        const run = useThen('it completes its dump and throws', async () =>
          getOneRefusalRun({
            figures: { percentOfWindow: 90, windowTokens: 128000 },
            rules: { flag: '', files: 0, tokens: 0 },
            diffs: { flag: undefined, files: 0 },
            paths: { with: [], wout: [], files: 0 },
            joined: { mode: 'union', files: 0, tokens: 0 },
            composition: COMPOSITION_OF_NO_TARGETS,
            locus: {
              targetFiles: [],
              'targetDiffs.additions': [],
              'targetDiffs.deletions': [],
              'targetDiffs.mutations': [],
            },
            logDirRelative: '.log/bhrain/review/2026-09-28',
            partition: null,
            route: null,
            provenance: null,
          }),
        );

        then(
          '🔴 the rules counts render absent, as the flag above them does — never a measured zero',
          () => {
            const lines = run.stderr.split('\n');
            const rowOfRules = lines.findIndex((line) =>
              line.includes('─ rules: (none)'),
            );
            expect(rowOfRules).toBeGreaterThan(-1);
            expect(lines[rowOfRules + 1]).toContain('files: —');
            expect(lines[rowOfRules + 2]).toContain('tokens: —');
          },
        );

        then('the stderr matches the snapshot', () => {
          expect(run.stderr).toContain('rules: (none)');
          expect(run.stderr).toMatchSnapshot();
        });
      });
    },
  );
});
