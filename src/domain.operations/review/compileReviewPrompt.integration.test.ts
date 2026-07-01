import { execSync } from 'child_process';
import * as fs from 'fs';
import { asIsoPrice } from 'iso-price';
import * as os from 'os';
import * as path from 'path';
import type { BrainSpec } from 'rhachet/brains';
import { given, then, usePrep, when } from 'test-fns';

import { compileReviewPrompt } from './compileReviewPrompt';
import {
  type FileDiff,
  getAllFileDiffsFromRange,
} from './getAllFileDiffsFromRange';

/**
 * .what = git identity env for commits
 * .why = avoids the need for global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = fixture cost spec for brain cost calculation
 * .why = enables cost calculation in the compiled prompt exemplar
 */
const costSpecFixture: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('$0.0000001'),
  output: asIsoPrice('$0.0000003'),
  cache: {
    set: asIsoPrice('$0.00000025'),
    get: asIsoPrice('$0.000000025'),
  },
};

/**
 * .what = writes a file, and makes its parent dirs first if absent
 * .why = keeps the exemplar setup terse when it seeds nested paths
 */
const writeFileDeep = (input: {
  repoPath: string;
  file: string;
  content: string;
}): void => {
  const full = path.join(input.repoPath, input.file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, input.content);
};

/**
 * .what = builds a real git repo whose feature branch adds 3, edits 3, drops 3
 * .why = yields a realistic exemplar: actual new content, actual old→new diffs,
 *        and actual deletions — the exact shapes the review prompt must render
 * .note = core.abbrev=40 pins full-length blob SHAs so the diff index lines are
 *         byte-deterministic across git versions (snapshot stability)
 */
const setupExemplarRepo = (): { repoPath: string; cleanup: () => void } => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-exemplar-'));
  const repoPath = path.join(tmpDir, 'repo');
  fs.mkdirSync(repoPath, { recursive: true });

  // --- baseline on main: the files that will later be edited + deleted ---

  // 3 files that will be EDITED on the feature branch
  writeFileDeep({
    repoPath,
    file: 'src/cart/price.ts',
    content: `export const applyDiscount = (price: number, percent: number): number => {
  return price - price * percent;
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/cart/freight.ts',
    content: `export const freightFee = (weightKg: number): number => {
  return weightKg * 5;
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/cart/tax.ts',
    content: `export const applyTax = (price: number, rate: number): number => {
  return price + price * rate;
};
`,
  });

  // 3 files that will be DELETED on the feature branch
  writeFileDeep({
    repoPath,
    file: 'src/legacy/formatLegacy.ts',
    content: `// deprecated: use iso-price format utils instead
export const formatLegacy = (cents: number): string => {
  return '$' + (cents / 100).toFixed(2);
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/legacy/parseLegacy.ts',
    content: `// deprecated: use iso-price parse utils instead
export const parseLegacy = (raw: string): number => {
  return Math.round(parseFloat(raw.replace('$', '')) * 100);
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/legacy/roundLegacy.ts',
    content: `// deprecated: round now done by iso-price
export const roundLegacy = (n: number): number => Math.round(n);
`,
  });

  execSync('git init', { cwd: repoPath });
  execSync('git config core.abbrev 40', { cwd: repoPath });
  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "baseline"', { cwd: repoPath, env: GIT_ENV });
  execSync('git branch -M main', { cwd: repoPath });

  // --- feature branch: add 3 new, edit 3, delete 3 ---
  execSync('git checkout -b feature', { cwd: repoPath });

  // EDIT the 3 baseline files (real old → new deltas)
  writeFileDeep({
    repoPath,
    file: 'src/cart/price.ts',
    content: `export const applyDiscount = (price: number, percent: number): number => {
  // clamp percent to [0, 1] so a bad input can never yield a negative price
  const safePercent = Math.min(Math.max(percent, 0), 1);
  return price - price * safePercent;
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/cart/freight.ts',
    content: `export const freightFee = (weightKg: number): number => {
  // free freight over 10kg, flat rate below
  if (weightKg > 10) return 0;
  return weightKg * 5;
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/cart/tax.ts',
    content: `export const applyTax = (price: number, rate: number): number => {
  const safeRate = Math.max(rate, 0);
  return price + price * safeRate;
};
`,
  });

  // ADD 3 new files (real new content)
  writeFileDeep({
    repoPath,
    file: 'src/checkout/currency.ts',
    content: `export const toMinorUnits = (amount: number): number => {
  return Math.round(amount * 100);
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/checkout/discount.ts',
    content: `export const stackDiscounts = (percents: number[]): number => {
  return percents.reduce((rest, p) => rest * (1 - p), 1);
};
`,
  });
  writeFileDeep({
    repoPath,
    file: 'src/checkout/receipt.ts',
    content: `export const renderReceiptLine = (label: string, cents: number): string => {
  return label + ': ' + (cents / 100).toFixed(2);
};
`,
  });

  // DELETE the 3 legacy files
  execSync('git rm src/legacy/formatLegacy.ts', {
    cwd: repoPath,
    env: GIT_ENV,
  });
  execSync('git rm src/legacy/parseLegacy.ts', { cwd: repoPath, env: GIT_ENV });
  execSync('git rm src/legacy/roundLegacy.ts', { cwd: repoPath, env: GIT_ENV });

  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "feature: add checkout, harden cart, drop legacy"', {
    cwd: repoPath,
    env: GIT_ENV,
  });

  return {
    repoPath,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
};

/**
 * .what = reads target contents the way stepReview does before prompt compile
 * .why = deleted files carry no content (file is gone); others carry full text
 */
const readTargetsFromDiffs = (input: {
  diffs: FileDiff[];
  repoPath: string;
}): Array<{
  path: string;
  content: string | null;
  diff: string | null;
  changeKind: FileDiff['changeKind'];
}> =>
  input.diffs.map((d) => ({
    path: d.path,
    content:
      d.changeKind === 'deleted'
        ? null
        : fs.readFileSync(path.join(input.repoPath, d.path), 'utf-8'),
    diff: d.diff,
    changeKind: d.changeKind,
  }));

describe('compileReviewPrompt (realistic end-to-end exemplar)', () => {
  given(
    '[case1] a feature branch that adds 3 files, edits 3, and deletes 3',
    () => {
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupExemplarRepo();
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: repoPath,
        });
        const targets = readTargetsFromDiffs({ diffs, repoPath });
        const result = compileReviewPrompt({
          refs: [],
          rules: [
            {
              path: 'rules/rule.no-magic-numbers.md',
              content:
                '# rule: no-magic-numbers\nforbid unexplained numeric literals; name them as constants',
            },
          ],
          targets,
          focus: 'push',
          goal: 'exhaustive',
          contextWindowSize: 200000,
          costSpec: costSpecFixture,
          diffRange: 'since-main',
        });
        return { diffs, result, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] the prompt is compiled from the real diffs', () => {
        then('captures the full compiled prompt as a snapshot', () => {
          expect(scene.result.prompt).toMatchSnapshot();
        });

        then(
          'renders a diff + full content tag for each of the 3 new files',
          () => {
            for (const file of [
              'src/checkout/currency.ts',
              'src/checkout/discount.ts',
              'src/checkout/receipt.ts',
            ]) {
              expect(scene.result.prompt).toContain(
                `<target.diff path="${file}">`,
              );
              expect(scene.result.prompt).toContain(
                `<target.file path="${file}">`,
              );
            }
            // new files show git's new-file marker inside the diff
            expect(scene.result.prompt).toContain('new file mode 100644');
          },
        );

        then(
          'renders a diff + full content tag for each of the 3 edited files',
          () => {
            for (const file of [
              'src/cart/freight.ts',
              'src/cart/price.ts',
              'src/cart/tax.ts',
            ]) {
              expect(scene.result.prompt).toContain(
                `<target.diff path="${file}">`,
              );
              expect(scene.result.prompt).toContain(
                `<target.file path="${file}">`,
              );
            }
            // an edited hunk carries both a removed (-) and an added (+) line
            expect(scene.result.prompt).toContain(
              '-  return price - price * percent;',
            );
            expect(scene.result.prompt).toContain('  const safePercent');
          },
        );

        then(
          'renders a lone deleted marker (no diff, no content) for each of the 3 dropped files',
          () => {
            for (const file of [
              'src/legacy/formatLegacy.ts',
              'src/legacy/parseLegacy.ts',
              'src/legacy/roundLegacy.ts',
            ]) {
              expect(scene.result.prompt).toContain(
                `<target.file path="${file}" change="deleted" />`,
              );
              // deleted files carry neither a diff tag nor an open content tag
              expect(scene.result.prompt).not.toContain(
                `<target.diff path="${file}">`,
              );
              expect(scene.result.prompt).not.toContain(
                `<target.file path="${file}">`,
              );
            }
          },
        );
      });
    },
  );
});
