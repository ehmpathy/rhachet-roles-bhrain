import * as fs from 'fs/promises';
import * as path from 'path';

import { Ask } from '@src/domain.objects/Achiever/Ask';
import { Coverage } from '@src/domain.objects/Achiever/Coverage';
import type { Goal } from '@src/domain.objects/Achiever/Goal';

import { getGoals } from './getGoals';

/**
 * .what = retrieves triage state: uncovered asks, extant goals, coverage
 * .why = enables brain to know what needs triage
 */
export const getTriageState = async (input: {
  scopeDir: string;
}): Promise<{
  asks: Ask[];
  asksUncovered: Ask[];
  goals: Goal[];
  goalsComplete: Goal[];
  goalsIncomplete: Goal[];
  coverage: Coverage[];
}> => {
  // read asks inventory
  const asks: Ask[] = [];
  const inventoryPath = path.join(input.scopeDir, 'asks.inventory.jsonl');
  try {
    const inventoryContent = await fs.readFile(inventoryPath, 'utf-8');
    const lines = inventoryContent.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line);
      asks.push(new Ask(parsed));
    }
  } catch {
    // file does not exist, no asks
  }

  // read coverage
  const coverage: Coverage[] = [];
  const coveragePath = path.join(input.scopeDir, 'asks.coverage.jsonl');
  try {
    const coverageContent = await fs.readFile(coveragePath, 'utf-8');
    const lines = coverageContent.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line);
      coverage.push(new Coverage(parsed));
    }
  } catch {
    // file does not exist, no coverage
  }

  // compute covered hashes
  const coveredHashes = new Set(coverage.map((c) => c.hash));

  // compute uncovered asks
  const asksUncovered = asks.filter((a) => !coveredHashes.has(a.hash));

  // get extant goals
  const { goals } = await getGoals({ scopeDir: input.scopeDir });

  // partition goals by completeness
  const goalsComplete = goals.filter((g) => g.meta?.complete === true);
  const goalsIncomplete = goals.filter((g) => g.meta?.complete !== true);

  return {
    asks,
    asksUncovered,
    goals,
    goalsComplete,
    goalsIncomplete,
    coverage,
  };
};
