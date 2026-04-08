import * as fs from 'fs/promises';
import * as path from 'path';

import { Coverage } from '@src/domain.objects/Achiever/Coverage';

/**
 * .what = appends coverage entries to asks.coverage.jsonl
 * .why = tracks which asks are covered by which goals
 * .note = ensures no ask is left behind
 */
export const setCoverage = async (input: {
  hashes: string[];
  goalSlug: string;
  scopeDir: string;
}): Promise<{ coverage: Coverage[] }> => {
  const coveredAt = new Date().toISOString().split('T')[0] ?? '';

  // construct Coverage entries
  const coverage = input.hashes.map(
    (hash) =>
      new Coverage({
        hash,
        goalSlug: input.goalSlug,
        coveredAt,
      }),
  );

  // ensure goals directory found or created
  await fs.mkdir(input.scopeDir, { recursive: true });

  // append coverage entries as JSON lines
  const coveragePath = path.join(input.scopeDir, 'asks.coverage.jsonl');
  const lines = coverage.map((c) => JSON.stringify(c)).join('\n') + '\n';
  await fs.appendFile(coveragePath, lines);

  return { coverage };
};
