import type { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { COLUMNS_OF_PEDIGREE_COURSES } from './COLUMNS_OF_PEDIGREE_COURSES';
import type { CourseProof } from './getOneCourseProof';

/**
 * .what = one markdown table row of the given cells
 * .note = a pipe inside a cell is escaped (`\|`), so free text such as a transfer task never
 *         shifts the cells after it; `asMarkdownTables` reads it back as `|`
 */
const asRow = (cells: Array<string | number>): string =>
  `| ${cells.map((cell) => String(cell).replace(/\|/g, '\\|')).join(' | ')} |`;

/**
 * .what = one pedigree entry, as the brief the role boots
 * .why = a summary table a reader scans, then each course's claims and yields in full, so a
 *        refuted claim stays on record for the next reader
 */
export const asPedigreeEntryMarkdown = (input: {
  entry: PedigreeEntry;
  proofs: CourseProof[];
}): string => {
  const { entry } = input;

  const summary = [
    asRow(COLUMNS_OF_PEDIGREE_COURSES),
    asRow(COLUMNS_OF_PEDIGREE_COURSES.map(() => '---')),
    ...entry.courses.map((c) =>
      asRow([
        c.ordinal,
        c.slug,
        c.buildsOn.join(' · ') || '—',
        c.baseline,
        c.after,
        c.transfer,
        c.greats.join(' · '),
        c.claimsHeld,
        c.claimsRefuted,
        c.claimsUntested,
        c.briefs,
        c.skills,
      ]),
    ),
  ];

  const details = input.proofs.flatMap((proof) => [
    '',
    `## .course=${proof.ordinal}.${proof.slug}`,
    '',
    `route: \`${proof.route}\``,
    '',
    asRow(['claim', 'verdict']),
    asRow(['---', '---']),
    ...proof.claims.map((c) => asRow([c.claim, c.verdict])),
    '',
    asRow(['path', 'kind']),
    asRow(['---', '---']),
    ...proof.yields.map((y) => asRow([y.path, y.kind])),
  ]);

  return [
    `# pedigree: ${entry.role} · v${entry.date} ${entry.slug}`,
    '',
    `the courses ${entry.role} took in this pursuit, in the order pursued. route: \`${entry.route}\``,
    '',
    '## .courses',
    '',
    ...summary,
    ...details,
    '',
  ].join('\n');
};
