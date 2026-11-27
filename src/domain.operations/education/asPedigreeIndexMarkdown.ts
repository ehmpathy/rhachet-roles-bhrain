import type { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';
import { compareStrings } from '@src/utils/compareStrings';

import { asPedigreeEntryName } from './asPedigreeEntryName';

/**
 * .what = the pedigree root brief: one row per graduated pursuit
 * .why = the root boots at `say`, so a role always knows what it was taught; each entry sits
 *        beside it at `ref`, read on demand
 * .note = rendered whole from every entry, so a re-stamp converges and never appends a twin
 */
export const asPedigreeIndexMarkdown = (input: {
  role: string;
  entries: PedigreeEntry[];
}): string => {
  const rows = [...input.entries]
    .sort((a, b) =>
      compareStrings(`${a.date}.${a.slug}`, `${b.date}.${b.slug}`),
    )
    .map(
      (entry) =>
        `| v${entry.date} | ${entry.slug} | ${entry.courses.map((c) => c.slug).join(' · ')} | \`${asPedigreeEntryName({ date: entry.date, slug: entry.slug })}\` |`,
    );
  return [
    `# pedigree: ${input.role}`,
    '',
    `every pursuit ${input.role} graduated, oldest first. each entry, beside this file, cites its courses, greats, and claims.`,
    '',
    '| date | pursuit | courses | entry |',
    '|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
};
