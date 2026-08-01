import type { ReviewByResult, ReviewRubricResult } from './ReviewByResult';

/**
 * .what = a node in the stdout tree
 * .why = a tiny tree lets one renderer place the box-draw connectors, so rubric rows, count
 *        rows, and the summary all share the same indent logic instead of hand-drawn prefixes.
 */
interface TreeNode {
  label: string;
  children: TreeNode[];
}

const EMOJI_BLOCKER = '🔴';
const EMOJI_NITPICK = '🟠';
const EMOJI_MALFUNCTION = '💥';
const MARK_PASS = '✓';
const MARK_FAIL = '✗';

/**
 * .what = pluralizes a count word
 * .why = "1 blocker" reads right; "1 blockers" does not.
 */
const asCountWord = (input: { count: number; singular: string }): string =>
  input.count === 1 ? input.singular : `${input.singular}s`;

/**
 * .what = builds a "N blockers 🔴" count label; drops the emoji when the count is 0
 * .why = a severity emoji next to a zero count reads as a problem where there is none — a red
 *        dot on "0 blockers" makes a clean (or malfunctioned) summary look worse than it is. the
 *        companion genReviewOutputStdout drops the emoji at 0 for the same reason; this mirrors
 *        it so both review contracts read the same. see rule.forbid.snapshot-visual-blemishes.
 */
const asCountLabel = (input: {
  count: number;
  singular: string;
  emoji: string;
}): string => {
  const word = asCountWord({ count: input.count, singular: input.singular });
  const emojiSuffix = input.count > 0 ? ` ${input.emoji}` : '';
  return `${input.count} ${word}${emojiSuffix}`;
};

/**
 * .what = tells whether a rubric result carries any issue
 * .why = a rubric with a blocker, a nitpick, or a malfunction shows ✗ + detail; else ✓.
 */
const hasIssue = (input: { result: ReviewRubricResult }): boolean =>
  input.result.verdict.blockers > 0 ||
  input.result.verdict.nitpicks > 0 ||
  input.result.verdict.outcome === 'malfunctioned';

/**
 * .what = builds the count/malfunction child rows under one rubric
 * .why = a malfunction shows a single 💥 row (no trustworthy tally); otherwise the nonzero
 *        blocker + nitpick rows appear, so a clean dimension is never printed as "0".
 */
const genRubricChildRows = (input: {
  result: ReviewRubricResult;
}): TreeNode[] => {
  const { result } = input;

  // a malfunction shows the 💥 row plus its captured reason, so a broken rubric explains itself
  // instead of a cryptic bare "malfunctioned". the reason was decoded in asReviewVerdict.
  if (result.verdict.outcome === 'malfunctioned')
    return [
      {
        label: `malfunctioned ${EMOJI_MALFUNCTION}`,
        children: result.verdict.reason
          ? [{ label: result.verdict.reason, children: [] }]
          : [],
      },
    ];

  // each nonzero dimension contributes a row; conditional spreads avoid array mutation
  return [
    ...(result.verdict.blockers > 0
      ? [
          {
            label: asCountLabel({
              count: result.verdict.blockers,
              singular: 'blocker',
              emoji: EMOJI_BLOCKER,
            }),
            children: [],
          },
        ]
      : []),
    ...(result.verdict.nitpicks > 0
      ? [
          {
            label: asCountLabel({
              count: result.verdict.nitpicks,
              singular: 'nitpick',
              emoji: EMOJI_NITPICK,
            }),
            children: [],
          },
        ]
      : []),
  ];
};

/**
 * .what = builds one rubric's row node (mark + slug), with its detail rows as children
 * .why = the row index is 1-based (r1, r2, …) to match the guard tree convention. a rubric WITH
 *        findings closes with a `review:` row naming the file its full findings landed in — the
 *        same `review:` line the base review's own stdout carries (genReviewOutputStdout). without
 *        it, the aggregate tree shows the ✗ mark + counts but not WHERE to read them, so a human
 *        must know the `.reviews/by=$role/rubric=$slug.md` convention by heart (a discoverability
 *        gap, rule.require.discoverability). a clean (✓) rubric has no findings to open, so it
 *        stays a bare row — the review path appears exactly where there are findings to read.
 */
const genRubricNode = (input: {
  result: ReviewRubricResult;
  index: number;
}): TreeNode => {
  const issue = hasIssue({ result: input.result });
  const mark = issue ? MARK_FAIL : MARK_PASS;
  return {
    label: `r${input.index} ${input.result.slug} ${mark}`,
    children: issue
      ? [
          ...genRubricChildRows({ result: input.result }),
          { label: `review: ${input.result.outputPath}`, children: [] },
        ]
      : [],
  };
};

/**
 * .what = renders a list of peer nodes with box-draw connectors, recursively
 * .why = one place owns the connector + indent logic. `prefix` is the string before each
 *        node's connector; a last child extends with spaces, a mid child with a pipe.
 */
const renderTree = (input: { nodes: TreeNode[]; prefix: string }): string[] =>
  input.nodes.flatMap((node, index) => {
    const isLast = index === input.nodes.length - 1;
    const connector = isLast ? '└─' : '├─';
    const childPrefix = `${input.prefix}${isLast ? '   ' : '│  '}`;
    // this node's own row, then its subtree, flattened by flatMap (no mutation)
    return [
      `${input.prefix}${connector} ${node.label}`,
      ...renderTree({ nodes: node.children, prefix: childPrefix }),
    ];
  });

/**
 * .what = picks the owl-punned header phrase by severity tier
 * .why = this is the bhrain repo — headers must speak owl, never the ehmpathy turtle persona
 *        (define.bhrain-repo-mascot.md). the phrase mirrors the companion review contract
 *        genReviewOutputStdout's 3-tier owl-hunts-vole scheme so both reviews read one voice, and
 *        the tier lets a reviewer vibecheck severity by eye:
 *        - a blocker or a malfunction → the owl must strike ("needs your talons")
 *        - nitpicks alone → a soft note ("just a few hoots")
 *        - all clear → the quarry never even appeared ("not even a vole")
 */
const asHeaderPhrase = (input: {
  hasBlockersOrMalfunction: boolean;
  hasNitpicks: boolean;
}): string => {
  if (input.hasBlockersOrMalfunction) return 'needs your talons';
  if (input.hasNitpicks) return 'just a few hoots';
  return 'not even a vole';
};

/**
 * .what = formats a review.by result as the owl-vibed treestruct stdout
 * .why = the human-faced contract output. a clean run shows only the rubrics node; a run with
 *        issues adds a `summary` block whose "N blockers" / "N nitpicks" lines the route
 *        guard `reviewed?` mechanism parses. see rule.require.status-feedback.
 */
export const genReviewByStdout = (input: {
  result: ReviewByResult;
}): string => {
  const { vibe, role, results, blockersTotal, nitpicksTotal } = input.result;

  // any issue across the run adds the summary block; the header phrase reads severity by tier
  const anyIssue = results.some((result) => hasIssue({ result }));
  const hasMalfunction = results.some(
    (result) => result.verdict.outcome === 'malfunctioned',
  );
  const phrase = asHeaderPhrase({
    hasBlockersOrMalfunction: blockersTotal > 0 || hasMalfunction,
    hasNitpicks: nitpicksTotal > 0,
  });

  // the command echo — includes --for when a single rubric was targeted
  const forSuffix = input.result.for ? ` --for ${input.result.for}` : '';
  const commandLine = `${vibe.artifact} review.by --role ${role}${forSuffix}`;

  // the rubrics node holds one row per reviewed rubric
  const rubricsNode: TreeNode = {
    label: 'rubrics',
    children: results.map((result, index) =>
      genRubricNode({ result, index: index + 1 }),
    ),
  };

  // the summary node (only on issues) carries the guard-parseable totals
  const rootNodes: TreeNode[] = anyIssue
    ? [
        rubricsNode,
        {
          label: 'summary',
          children: [
            {
              label: asCountLabel({
                count: blockersTotal,
                singular: 'blocker',
                emoji: EMOJI_BLOCKER,
              }),
              children: [],
            },
            {
              label: asCountLabel({
                count: nitpicksTotal,
                singular: 'nitpick',
                emoji: EMOJI_NITPICK,
              }),
              children: [],
            },
          ],
        },
      ]
    : [rubricsNode];

  const lines = [
    `${vibe.mascot} ${phrase}`,
    '',
    commandLine,
    ...renderTree({ nodes: rootNodes, prefix: '   ' }),
  ];

  return lines.join('\n');
};
