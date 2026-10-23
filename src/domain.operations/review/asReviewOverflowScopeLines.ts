import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import {
  ORDER_OF_SECTIONS,
  type PromptSectionChars,
} from '@src/domain.objects/Reviewer/PromptSectionChars';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asRateHuman } from '@src/domain.operations/review/asRateHuman';
import { asReviewOverflowLeverLines } from '@src/domain.operations/review/asReviewOverflowLeverLines';
import { asReviewScopeTargetLines } from '@src/domain.operations/review/asReviewScopeTargetLines';
import { asScopeFlagHuman } from '@src/domain.operations/review/asScopeFlagHuman';
import type { TargetInputName } from '@src/domain.operations/review/asTargetContentsByInput';
import { getAllScopeFlagValues } from '@src/domain.operations/review/getAllScopeFlagValues';
import type { ReviewGuardProvenance } from '@src/domain.operations/review/getOneReviewGuardProvenance';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import { asTargetLocusLinesByInput } from '@src/domain.operations/review/meter/asTargetLocusLinesByInput';
import { getOnePromptSectionCharsFromCompiled } from '@src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled';

/**
 * .what = the scope dump an overflow refusal prints beneath its frame — each flag,
 *         what it matched, which named input carries the mass, which directories
 *         carry it, and where to read more
 * .why = the refusal names WHICH flag widened the scope, and that tree is a pure
 *        render, so it lives apart from the stderr write
 *
 * .note = 🔴 the locus is the half a driver needs to act. a flag says how the scope
 *         was drawn; only the locus says which directories to cut. without it, the
 *         one moment a driver must prune is the one moment the tool withheld the
 *         address, and the driver hand-rolls a census of their own — off the
 *         polluter filter, so it ranks files the prompt never held
 *         (rule.require.report-both-cost-levers-with-trend-and-locus). it is the
 *         SAME render `review._.cost` draws, so a directory reads alike in both
 *         (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = 🔴 the locus is ONE table, a row per directory, and each row names the kinds
 *         it carries — bodies, added, edits. one total, so its rows sum to the
 *         `targets` figure on the prompt line above; the kind split rides per row, so no
 *         input is folded out of sight (rule.require.distinguish-every-review-input)
 */
export const asReviewOverflowScopeLines = (input: {
  rules: { flag: string | string[] | undefined; files: number; tokens: number };
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number; tokens: number };
  /** what the refused prompt was made of, one row per named input */
  composition: PromptComposition;
  /** per target input, one entry per target with the chars the prompt would have sent */
  locus: Record<TargetInputName, { path: string; chars: number }[]>;
  logDirRelative: string;
  /** the partition this run already was, or null for a whole run */
  partition: string | null;
  /** the route this run was driven from, whose spec is never a suggested cut */
  route: string | null;
  /** where the lane's guard was stamped from; null for a hand run or a route-local guard */
  provenance: ReviewGuardProvenance | null;
}): string[] => [
  '🔍 lets see why...',
  `   ├─ rules: ${asScopeFlagHuman({ of: input.rules.flag })}`,
  // an absent rules flag matched no files because none were asked for — that is
  // ABSENT, not a measured zero (the same mark the paths half renders). absence is
  // judged by the one test the flag render above uses, so an empty-but-defined
  // flag never reads `(none)` beside a measured `0`
  `   │  ├─ files: ${getAllScopeFlagValues({ of: input.rules.flag }).length ? asCountHuman({ of: input.rules.files }) : MARK_OF_ABSENT}`,
  `   │  └─ tokens: ${getAllScopeFlagValues({ of: input.rules.flag }).length ? asFigureHuman({ of: input.rules.tokens }) : MARK_OF_ABSENT}`,
  ...asReviewScopeTargetLines({
    diffs: input.diffs,
    paths: input.paths,
    joined: input.joined,
  }),
  ...asOverflowPromptLines({
    composition: input.composition,
    logDirRelative: input.logDirRelative,
  }),
  ...asTargetLocusLinesByInput({
    locus: input.locus,
    head: '   ├─ ',
    gutter: '   │  ',
  }),
  ...asReviewOverflowLeverLines({
    mass: {
      targetFiles: input.composition.inputs.targetFiles.chars,
      'targetDiffs.additions':
        input.composition.inputs['targetDiffs.additions'].chars,
      'targetDiffs.deletions':
        input.composition.inputs['targetDiffs.deletions'].chars,
      'targetDiffs.mutations':
        input.composition.inputs['targetDiffs.mutations'].chars,
    },
    locus: input.locus,
    partition: input.partition,
    route: input.route,
    provenance: input.provenance,
  }),
  `   └─ hint`,
  `      ├─ inspect ${input.logDirRelative}/input.scope.debug.json to see what was matched`,
  `      └─ inspect ${input.logDirRelative}/tokens.expected.md for token breakdown by file`,
  '',
];

/**
 * .what = the census rows that hold target mass — the four the directory table splits
 */
const NAMES_OF_TARGET_SECTION: (keyof PromptSectionChars)[] = [
  'targetFiles',
  'targetDiffs.additions',
  'targetDiffs.deletions',
  'targetDiffs.mutations',
];

/**
 * .what = the refused prompt on one line — its total, its target share, then each other
 *         input that sent chars, heaviest first
 * .why = an overflow is a question of SIZE, so the line states what fills the window and
 *        names no cache seam. the target rows fold into one figure, since the directory
 *        table beneath splits them by kind per directory; a zero input is left out, since
 *        it fills naught. the grade rides beside the figures only where it is not
 *        `attributed`, since only then must a reader doubt them
 *        (rule.require.errors-name-the-fix — the fix is in the rows beneath, not here)
 */
const asOverflowPromptLines = (input: {
  composition: PromptComposition;
  logDirRelative: string;
}): string[] => {
  const sections = getOnePromptSectionCharsFromCompiled({
    rows: input.composition.inputs,
    chars: input.composition.chars,
    dir: input.logDirRelative,
  });
  const targets = NAMES_OF_TARGET_SECTION.reduce(
    (sum, name) => sum + sections[name],
    0,
  );
  const others = ORDER_OF_SECTIONS.filter(
    (name) => !NAMES_OF_TARGET_SECTION.includes(name) && sections[name] > 0,
  ).sort((a, b) => sections[b] - sections[a]);
  const share = asRateHuman({
    of: targets / input.composition.chars,
    absent: MARK_OF_ABSENT,
  });
  const parts = [
    `${asFigureHuman({ of: input.composition.chars })} chars`,
    `${asFigureHuman({ of: targets })} targets (${share})`,
    ...others.map((name) => `${asFigureHuman({ of: sections[name] })} ${name}`),
    ...(input.composition.attribution === 'attributed'
      ? []
      : [`${input.composition.attribution} — figures not vouched for`]),
  ];
  return [`   ├─ prompt — ${parts.join(' · ')}`];
};
