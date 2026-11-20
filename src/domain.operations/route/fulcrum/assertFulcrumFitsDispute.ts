import { readFile } from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import { basename } from 'path';

import type { FulcrumFrontmatter } from './asFulcrumFrontmatter';
import { asFulcrumFrontmatterDefectLines } from './asFulcrumFrontmatterDefectLines';
import { asFulcrumHoldOfConcern } from './asFulcrumHoldOfConcern';
import {
  asFulcrumOwed,
  FULCRUM_REFLECT_CONFIDENCE_FLOOR,
} from './asFulcrumOwed';
import { asFulcrumParseOfFile } from './asFulcrumParseOfFile';
import { isFulcrumHoldsOfConcern } from './isFulcrumHoldsOfConcern';

/**
 * .what = asserts the fulcrum a dispute cites can carry that dispute, and returns its frontmatter
 * .why = invariants 3 and 5, at the moment a dispute is declared:
 *        - the frontmatter is the one home of the dispute's attributes, so it must parse
 *        - `owed` is DERIVED from ground × confidence, so a hand-set value that disagrees is refused
 *        - a sure misread (owed reflect) must name its reflection via `--reflect`, matched to the file
 *        - dirty ground always goes to the human, so `--reflect` there is refused
 *
 * .note = it refuses, and never halts: a dispute that passes this check still only records
 */
export const assertFulcrumFitsDispute = async (input: {
  pathResolved: string;
  reflect: string | null;
  concern: { reviewer: string; iteration: number | null; about: string };
}): Promise<FulcrumFrontmatter> => {
  // read and parse the entry the dispute cites; its name must declare a case, and its
  // frontmatter's case must equal it
  const parse = asFulcrumParseOfFile({
    name: basename(input.pathResolved),
    content: await readFile(input.pathResolved, 'utf8'),
  });
  if (parse.kind !== 'valid')
    throw new ConstraintError(
      [
        `the fulcrum this dispute cites has ${parse.kind === 'absent' ? 'no' : 'an invalid'} frontmatter`,
        ...asFulcrumFrontmatterDefectLines({
          path: input.pathResolved,
          parse,
          dispute: input.concern,
        }),
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );
  const frontmatter = parse.frontmatter;

  // the fulcrum must name the concern it backs, so the halt shows the human what it holds
  const holdExample = asFulcrumHoldOfConcern(input.concern);
  if (
    !isFulcrumHoldsOfConcern({
      holds: frontmatter.holds,
      reviewer: input.concern.reviewer,
      about: input.concern.about,
    })
  )
    throw new ConstraintError(
      [
        `the fulcrum this dispute cites does not hold ${input.concern.reviewer} ${input.concern.about}`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ holds: ${frontmatter.holds.length ? frontmatter.holds.join(' · ') : '(none named)'}`,
        `   └─ fix: add the concern to its holds, e.g. ${holdExample}`,
      ].join('\n'),
      { path: input.pathResolved },
    );

  // a dispute's fulcrum must owe a human or a reflection; `none` marks a fulcrum that is no dispute
  if (frontmatter.owed === 'none')
    throw new ConstraintError(
      [
        `the fulcrum this dispute cites declares owed: none`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ owed: none marks a fulcrum that holds no dispute`,
        `   └─ fix: set owed to ${asFulcrumOwed(frontmatter)}, derived from ground ${frontmatter.ground} at ${frontmatter.confidence}`,
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );

  // owed is derived, never chosen — a value that disagrees with ground × confidence is refused
  const owedDerived = asFulcrumOwed(frontmatter);
  if (frontmatter.owed !== owedDerived)
    throw new ConstraintError(
      [
        `the fulcrum this dispute cites declares owed: ${frontmatter.owed}, but its ground and confidence derive owed: ${owedDerived}`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ rule: owed = reflect only when ground is wrong and confidence is ${FULCRUM_REFLECT_CONFIDENCE_FLOOR} or above; else human`,
        `   └─ fix: set owed: ${owedDerived}`,
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );

  // dirty ground always goes to the human — no reflection may route it away
  if (frontmatter.ground === 'dirty' && input.reflect)
    throw new ConstraintError(
      [
        `--reflect is refused for a dispute on dirty ground`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ dirty ground means the rework would be a teardown, so a human always rules it`,
        `   └─ fix: drop --reflect; the dispute waits for a human at the gate`,
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );

  // a sure misread owes its reflection, named on the command and in the file alike
  if (owedDerived === 'reflect' && input.reflect !== frontmatter.reflect)
    throw new ConstraintError(
      [
        input.reflect
          ? `--reflect ${input.reflect} does not match the fulcrum's reflect: ${frontmatter.reflect}`
          : `--reflect is required for a dispute at confidence ${FULCRUM_REFLECT_CONFIDENCE_FLOOR} or above`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ a sure misread is a defect in the rubric, owed upstream as a reflection`,
        ...asFulcrumReflectFixLines({ reflect: frontmatter.reflect }),
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );

  // a human-owed dispute carries no reflection on the command
  if (owedDerived === 'human' && input.reflect)
    throw new ConstraintError(
      [
        `--reflect is refused for a dispute that owes a human`,
        `   ├─ file: ${input.pathResolved}`,
        `   ├─ only a dispute on wrong ground at confidence ${FULCRUM_REFLECT_CONFIDENCE_FLOOR} or above owes a reflection`,
        `   └─ fix: drop --reflect; the dispute waits for a human at the gate`,
      ].join('\n'),
      { path: input.pathResolved, reflect: input.reflect },
    );

  return frontmatter;
};

/**
 * .what = the fix a reflect-owed dispute teaches: pass the ref the file names, or file one first
 * .why = a driver who raised confidence past the floor holds no ref yet; "pass --reflect" alone
 *        names no way to get one, so the fix names the dispatch, then both places the ref goes
 */
const asFulcrumReflectFixLines = (input: {
  reflect: string | null;
}): string[] =>
  input.reflect
    ? [`   └─ fix: pass --reflect ${input.reflect}`]
    : [
        `   └─ fix: file the reflection upstream, then name its ref in both places`,
        `      ├─ rhx radio.task.push --via gh.issues --into <owner/repo> --title '<the misread>' --description @stdin`,
        `      ├─ set reflect: <the ref> in the fulcrum's frontmatter`,
        `      └─ pass --reflect <the ref>`,
      ];
