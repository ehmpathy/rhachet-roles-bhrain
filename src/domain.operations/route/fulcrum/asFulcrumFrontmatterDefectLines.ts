import * as path from 'path';

import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';
import {
  FULCRUM_FRONTMATTER_FIELDS_REQUIRED,
  type FulcrumFrontmatterParse,
} from './asFulcrumFrontmatter';

/**
 * .what = the fields a failed parse lacks and holds malformed
 * .why = an absent block lacks every field; an invalid one names its own. one home, so the lint,
 *        the dispute refusal, and the verdict lever never disagree on what a file lacks
 */
const asFulcrumParseDefects = (input: {
  parse: Exclude<FulcrumFrontmatterParse, { kind: 'valid' }>;
}): { absent: string[]; malformed: string[] } =>
  input.parse.kind === 'absent'
    ? { absent: [...FULCRUM_FRONTMATTER_FIELDS_REQUIRED], malformed: [] }
    : { absent: input.parse.absent, malformed: input.parse.malformed };

/**
 * .what = the `case` value the paste block teaches: the file's own case id, or a placeholder
 * .why = a misnamed file declares no case; its whole name pasted as `case:` would break the file
 *        a second way, so the block points at the rename the `malformed` line already names
 */
const asFulcrumCaseOfPasteBlock = (input: { path: string }): string =>
  asFulcrumCaseFromFileName({ name: path.basename(input.path) })?.slug ??
  '<id, as the renamed file declares it, e.g. F44>';

/**
 * .what = the `owed` and `holds` lines the paste block teaches
 * .why = a plain entry no dispute cites owes none and holds naught; an entry a dispute is about to
 *        cite must owe a human (the template's ground and confidence derive it) and hold the
 *        disputed concern, or the dispute path refuses the very block it printed
 */
const asFulcrumDisputeLinesOfPasteBlock = (input: {
  dispute: { reviewer: string; about: string } | null;
}): string[] =>
  input.dispute
    ? [
        `         │  owed: human              # derived: reflect iff ground wrong and confidence ≥ 0.90, else human`,
        `         │  holds: [${input.dispute.reviewer}/<iteration>/${input.dispute.about}]`,
      ]
    : [
        `         │  owed: none               # none, until a dispute cites it: then human | reflect`,
        `         │  holds: []                # each concern a dispute cites, e.g. rules/i003/blocker.2`,
      ];

/**
 * .what = renders why one fulcrum's frontmatter fails, and the block to paste
 * .why = invariant 5: the dispute-time refusal and the onStop linter teach the SAME fix, from this
 *        one formatter, so a driver never meets two field lists for one rule
 *
 * .note = `dispute` names the concern a dispute is about to cite the entry for, or null where none is
 */
export const asFulcrumFrontmatterDefectLines = (input: {
  path: string;
  parse: Exclude<FulcrumFrontmatterParse, { kind: 'valid' }>;
  dispute: { reviewer: string; about: string } | null;
}): string[] => {
  const { absent, malformed } = asFulcrumParseDefects({ parse: input.parse });
  const branches = [
    `   ├─ file: ${input.path}`,
    ...(absent.length
      ? [
          `   ├─ absent`,
          ...absent.map(
            (field, index) =>
              `   │  ${asTreeBranchMarkers({ isLast: index === absent.length - 1 }).elbow} ${field}`,
          ),
        ]
      : []),
    ...(malformed.length
      ? [
          `   ├─ malformed`,
          ...malformed.map(
            (field, index) =>
              `   │  ${asTreeBranchMarkers({ isLast: index === malformed.length - 1 }).elbow} ${field}`,
          ),
        ]
      : []),
  ];
  return [
    ...branches,
    `   └─ fix: the frontmatter opens the file, with every field of`,
    `      ├─ ${FULCRUM_FRONTMATTER_FIELDS_REQUIRED.join(' · ')}`,
    `      └─ paste, at the head of the file`,
    `         ├─`,
    `         │  ---`,
    `         │  case: ${asFulcrumCaseOfPasteBlock({ path: input.path })}`,
    `         │  rework: clean            # clean | dirty`,
    `         │  ground: wrong            # wrong | dirty`,
    `         │  confidence: 0.65         # the weakest call it holds, 0 to 1`,
    `         │  status: open             # open | held | ruled | superseded`,
    ...asFulcrumDisputeLinesOfPasteBlock({ dispute: input.dispute }),
    `         │  lean: <one line — the call you made>`,
    `         │  verdict: null            # only rhx route.fulcrum.rule writes this`,
    `         │  ---`,
    `         └─`,
  ];
};
