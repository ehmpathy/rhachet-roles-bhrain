import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import { FULCRUM_FRONTMATTER_FIELDS_REQUIRED } from './asFulcrumFrontmatter';

/**
 * .what = renders why one fulcrum's frontmatter fails, and the block to paste
 * .why = invariant 5: the dispute-time refusal and the onStop linter teach the SAME fix, from this
 *        one formatter, so a driver never meets two field lists for one rule
 */
export const asFulcrumFrontmatterDefectLines = (input: {
  path: string;
  slug: string;
  absent: string[];
  malformed: string[];
}): string[] => {
  const branches = [
    `   ├─ file: ${input.path}`,
    ...(input.absent.length
      ? [
          `   ├─ absent`,
          ...input.absent.map(
            (field, index) =>
              `   │  ${asTreeBranchMarkers({ isLast: index === input.absent.length - 1 }).elbow} ${field}`,
          ),
        ]
      : []),
    ...(input.malformed.length
      ? [
          `   ├─ malformed`,
          ...input.malformed.map(
            (field, index) =>
              `   │  ${asTreeBranchMarkers({ isLast: index === input.malformed.length - 1 }).elbow} ${field}`,
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
    `         │  case: ${input.slug}`,
    `         │  rework: clean            # clean | dirty`,
    `         │  ground: wrong            # wrong | dirty`,
    `         │  confidence: 0.65         # the weakest call it holds, 0 to 1`,
    `         │  status: open             # open | held | ruled | superseded`,
    `         │  owed: human              # human | reflect | none`,
    `         │  holds: []                # <lane>/<round>/<ordinal>, e.g. rules/i003/blocker.2`,
    `         │  lean: <one line — the call you made>`,
    `         │  verdict: null            # only rhx route.fulcrum.rule writes this`,
    `         │  ---`,
    `         └─`,
  ];
};
