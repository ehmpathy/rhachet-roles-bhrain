import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from '../__test_assets__/genContextReviewBrainSupplyDemo';
import { setStoneAsPassed } from './setStoneAsPassed';

const noopContext = genContextReviewBrainSupplyDemo();

describe('setStoneAsPassed.exhausted', () => {
  given('[case1] peer reviewer exhaustion writes to passage.jsonl', () => {
    let tempDir: string;

    beforeAll(async () => {
      // create temp route directory
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-budgetlimit-passage-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });

      // create stone file
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

      // create guard with budget: 2 reviewer that always finds blockers
      // .why = budget:2 means first attempt runs (rejected), second attempt runs (rejected),
      //        third attempt is SKIPPED (exhausted) because budget already spent
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
          '      budget: 2',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );

      // create artifact
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] first attempt consumes budget', () => {
      const result = useThen('first attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('first attempt is blocked by review (not exhausted)', () => {
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('blocked');
        expect(result.emit?.stdout).toContain('rejected');
        // first attempt should NOT say exhausted
        expect(result.emit?.stdout).not.toContain('exhausted');
      });
    });

    when('[t1] second attempt depletes budget (but review still runs)', () => {
      then('modify artifact to change hash and force new review', async () => {
        // modify artifact to change the hash - simulates driver who made changes
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\nmodified for second attempt',
        );
      });

      const result = useThen('second attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('verdict is rejected (not exhausted) because review RAN', () => {
        // round 2/2 runs, finds blockers → rejected
        // invariant: review that RAN cannot be exhausted
        expect(result.emit?.stdout).toContain('rejected');
        expect(result.emit?.stdout).not.toContain('exhausted');
      });

      then(
        'stdout shows actual blocker/nitpick counts from review (not zeros)',
        () => {
          expect(result.emit?.stdout).toContain('1 blocker');
          expect(result.emit?.stdout).not.toMatch(/0 blockers/i);
        },
      );
    });

    when('[t2] third attempt hits exhaustion (review is SKIPPED)', () => {
      then('modify artifact to change hash for third attempt', async () => {
        // modify artifact to change the hash again
        await fs.writeFile(
          path.join(tempDir, '1.test.md'),
          '# Test artifact\n\nmodified for third attempt',
        );
      });

      const result = useThen('third attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('stdout contains exhausted', () => {
        // round 3/2 attempt → SKIPPED because budget already at 2/2 → exhausted
        expect(result.emit?.stdout).toContain('exhausted');
      });

      then(
        'stdout shows actual blocker/nitpick counts from prior review (not zeros)',
        () => {
          // even when exhausted, we show counts from the latest review that ran
          expect(result.emit?.stdout).toContain('1 blocker');
          expect(result.emit?.stdout).not.toMatch(/0 blockers/i);
        },
      );

      then(
        'passage.jsonl has an exhausted status entry (its own status, no blocker)',
        async () => {
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const content = await fs.readFile(passagePath, 'utf-8');
          const lines = content.trim().split('\n');
          const exhaustedEntry = lines
            .map((line) => JSON.parse(line))
            .find((entry) => entry.status === 'exhausted');

          expect(exhaustedEntry).toBeDefined();
          expect(exhaustedEntry.blocker).toBeUndefined();
          expect(exhaustedEntry.reason).toContain('limited');
        },
      );
    });
  });
});
