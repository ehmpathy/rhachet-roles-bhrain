import { ConstraintError } from 'helpful-errors';

import { PedigreeCourse } from '@src/domain.objects/Learner/PedigreeCourse';
import { PedigreeEntry } from '@src/domain.objects/Learner/PedigreeEntry';

import { asMarkdownTables } from './asMarkdownTables';
import { COLUMNS_OF_PEDIGREE_COURSES } from './COLUMNS_OF_PEDIGREE_COURSES';

/**
 * .what = a list cell (`a · b`), split; `—` reads as empty
 */
const asList = (input: { cell: string }): string[] =>
  input.cell
    .split('·')
    .map((s) => s.trim())
    .filter((s) => s && s !== '—');

/**
 * .what = the cell of one row under a named courses column; empty when absent
 */
const asCellOfColumn = (input: { cells: string[]; name: string }): string =>
  input.cells[COLUMNS_OF_PEDIGREE_COURSES.indexOf(input.name)] ?? '';

/**
 * .what = the count under a named courses column; refuses a cell that is no whole number
 * .why = `Number('')` reads 0 and `Number('n/a')` reads NaN; either, written back by `set`,
 *        would land a false record in the index, so a damaged cell fails loud instead
 */
const asCountOfColumn = (input: { cells: string[]; name: string }): number => {
  const cell = asCellOfColumn(input);
  if (!/^\d+$/.test(cell))
    throw new ConstraintError('a pedigree courses cell is no whole number', {
      column: input.name,
      cell,
      hint: 'repair the row in the pedigree entry brief, then re-run',
    });
  return Number(cell);
};

/**
 * .what = one row of the courses table, read back into its course
 */
const asPedigreeCourseOfRow = (input: { cells: string[] }): PedigreeCourse => {
  const { cells } = input;
  return new PedigreeCourse({
    ordinal: asCountOfColumn({ cells, name: 'k' }),
    slug: asCellOfColumn({ cells, name: 'course' }),
    buildsOn: asList({ cell: asCellOfColumn({ cells, name: 'builds on' }) }),
    baseline: asCellOfColumn({ cells, name: 'baseline' }),
    after: asCellOfColumn({ cells, name: 'after' }),
    transfer: asCellOfColumn({ cells, name: 'transfer' }),
    greats: asList({ cell: asCellOfColumn({ cells, name: 'greats' }) }),
    claimsHeld: asCountOfColumn({ cells, name: 'held' }),
    claimsRefuted: asCountOfColumn({ cells, name: 'refuted' }),
    claimsUntested: asCountOfColumn({ cells, name: 'untested' }),
    briefs: asCountOfColumn({ cells, name: 'briefs' }),
    skills: asCountOfColumn({ cells, name: 'skills' }),
  });
};

/**
 * .what = read a pedigree entry brief back into its shape
 * .why = `education.pedigree get` renders every entry a role holds
 * .note = null when the text is no pedigree entry (its title or courses table is absent)
 */
export const asPedigreeEntryParsed = (input: {
  markdown: string;
}): PedigreeEntry | null => {
  // the title names role, date, and slug
  const title = /^# pedigree: (\S+) · v(\d{4}_\d{2}_\d{2}) (\S+)$/m.exec(
    input.markdown,
  );
  if (!title) return null;
  const route = /^the courses .* route: `([^`]+)`$/m.exec(input.markdown)?.[1];
  if (!route)
    throw new ConstraintError('a pedigree entry names no route', {
      title: title[0],
      hint: 'repair the entry brief: its intro names the pursuit route in backticks',
    });

  // the courses table, by its fixed header
  const table = asMarkdownTables({ markdown: input.markdown }).find(
    (t) => t.header.join('|') === COLUMNS_OF_PEDIGREE_COURSES.join('|'),
  );
  if (!table) return null;

  return new PedigreeEntry({
    role: title[1]!,
    date: title[2]!,
    slug: title[3]!,
    route,
    courses: table.rows.map((cells) => asPedigreeCourseOfRow({ cells })),
  });
};
