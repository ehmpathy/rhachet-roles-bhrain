import type { TargetInputName } from '@src/domain.operations/review/asTargetContentsByInput';
import type { ReviewGuardProvenance } from '@src/domain.operations/review/getOneReviewGuardProvenance';
import { isPathOfRouteSpec } from '@src/domain.operations/review/isPathOfRouteSpec';
import { getOneLocusChars } from '@src/domain.operations/review/meter/getOneLocusChars';
import { CLAUSE_OF_PARTITION_UNDER_GUARD } from '@src/domain.operations/review/partition/CLAUSE_OF_PARTITION_UNDER_GUARD';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the most partitions a suggestion names — the heavy subtree, then the top dirs
 * .why = a suggestion is a start a driver edits, never a census; four is enough to show
 *        the shape of the flag and short enough to read on one line
 */
const LIMIT_OF_PARTITIONS_SUGGESTED = 4;

/**
 * .what = the share of the mass a group must hold before the suggestion descends into it
 * .why = a group that holds most of the mass is the one that overflows; its heaviest
 *        child is the subtree worth its own partition
 */
const SHARE_OF_DESCENT = 0.5;

type LocusEntry = { path: string; chars: number };

/**
 * .what = the dir at `depth` segments that holds a path, or the path itself when shallower
 * .why = the unit a suggestion names is a dir, so every path is read at one depth at a time
 */
const asPrefixAtDepth = (input: { path: string; depth: number }): string =>
  input.path.split('/').slice(0, input.depth).join('/');

type GroupsByPrefix = Record<string, { chars: number; deeper: boolean }>;

/**
 * .what = the groups by prefix, with one more entry folded into its group
 * .why = the fold step, named, so the group-by reads as "add each entry to its group"
 *        rather than a spread accumulator to simulate (rule.forbid.inline-decode-friction)
 */
const asGroupsWithEntry = (input: {
  groups: GroupsByPrefix;
  entry: LocusEntry;
  depth: number;
}): GroupsByPrefix => {
  const prefix = asPrefixAtDepth({
    path: input.entry.path,
    depth: input.depth,
  });
  const prior = input.groups[prefix] ?? { chars: 0, deeper: false };
  return {
    ...input.groups,
    [prefix]: {
      chars: prior.chars + input.entry.chars,
      // a group is a dir, never a lone file, once any entry sits beneath its prefix
      deeper: prior.deeper || input.entry.path !== prefix,
    },
  };
};

/**
 * .what = whether a group is a dir that holds most of the mass — worth a descent
 * .why = names the stop test of the descent, so it reads as a question rather than a
 *        compound guard to simulate (rule.forbid.inline-decode-friction)
 */
const isGroupWorthDescent = (input: {
  group: { prefix: string; chars: number; deeper: boolean } | undefined;
  total: number;
}): input is {
  group: { prefix: string; chars: number; deeper: boolean };
  total: number;
} =>
  input.group !== undefined &&
  input.group.deeper &&
  input.group.chars > input.total * SHARE_OF_DESCENT;

/**
 * .what = the entries that sit beneath a dir prefix
 */
const getAllEntriesBeneath = (input: {
  entries: LocusEntry[];
  prefix: string;
}): LocusEntry[] =>
  input.entries.filter((entry) => entry.path.startsWith(`${input.prefix}/`));

/**
 * .what = sums chars per prefix at one depth, heaviest first
 * .why = the heaviest group at a depth is the candidate the descent weighs next; `deeper`
 *        marks a group that is a dir rather than a lone file, since only a dir can be cut
 */
const getAllGroupsAtDepth = (input: {
  entries: LocusEntry[];
  depth: number;
}): { prefix: string; chars: number; deeper: boolean }[] => {
  const byPrefix = input.entries.reduce<GroupsByPrefix>(
    (groups, entry) => asGroupsWithEntry({ groups, entry, depth: input.depth }),
    {},
  );
  const groups = Object.entries(byPrefix).map(([prefix, group]) => ({
    prefix,
    ...group,
  }));

  // clone before the sort, so the order of no list but this copy can change
  return [...groups].sort((a, b) => asCharsOrder({ a, b }));
};

/**
 * .what = the order of groups by chars, heaviest first
 * .why = names the sort, so the descent states its order by name rather than by a
 *        closure to decode (rule.require.named-transformers)
 */
const asCharsOrder = (input: {
  a: { chars: number };
  b: { chars: number };
}): number => input.b.chars - input.a.chars;

/**
 * .what = the deepest dir that still holds most of the mass — the subtree that overflows
 * .why = "src is big" names no cut. descend while one dir holds most of what remains, and
 *        the dir where the descent stops is the one a partition or a narrower bind should name
 */
const asHeavySubtree = (input: {
  entries: LocusEntry[];
  /** the depth to weigh next; 1 at the top */
  depth: number;
  /** the heaviest dir found so far; null before the descent starts */
  heavy: string | null;
}): string | null => {
  // stop where no single dir holds most of what remains
  const total = getOneLocusChars({ rows: input.entries });
  const [heaviest] = getAllGroupsAtDepth({
    entries: input.entries,
    depth: input.depth,
  });
  const weighed = { group: heaviest, total };
  if (!isGroupWorthDescent(weighed)) return input.heavy;

  // descend into the dir that does
  return asHeavySubtree({
    entries: getAllEntriesBeneath({
      entries: input.entries,
      prefix: weighed.group.prefix,
    }),
    depth: input.depth + 1,
    heavy: weighed.group.prefix,
  });
};

/**
 * .what = a partition slug cast from a dir prefix — its last segment, in the slug's shape
 * .why = a slug is a plain lowercase token (`getOneReviewPartitionsFault`), so a dir name
 *        with capitals or odd chars is cast to one the parser accepts
 */
const asSlugOfPrefix = (input: { prefix: string }): string => {
  const last = input.prefix.split('/').pop() ?? input.prefix;
  const slug = last
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '');
  return slug.length > 0 ? slug : 'part';
};

/**
 * .what = `--partition` declarations to start from: the disjoint dirs at the depth where no
 *         one dir holds most of the mass, each with the bound route beside it
 * .why = 🔴 a file two partitions list is COMMON, and is read as context in each (seed S44) —
 *        so a suggestion that nests one partition inside another would shrink neither. the
 *        dirs at one depth are disjoint, so each named partition sheds the mass of the rest.
 *        the route rides every partition, since it is the spec each one grades against
 *
 * .note = a suggestion is a start a driver edits, never a census: it names the heaviest few,
 *         and says how many groups (dirs or lone files) it left for the driver to place. a lone
 *         file is never named as a partition of its own. a dir holds an operation and
 *         its collocated tests, so a dir cut keeps a test beside its subject (seed S47); a
 *         driver still moves each boundary to where the operations separate
 */
const asPartitionSuggestionLines = (input: {
  entries: LocusEntry[];
  route: string | null;
}): string[] => {
  // the depth to split at: the heavy subtree's own, so it stands as one partition; one
  // deeper where that depth holds a single group, since one group is no split at all
  const heavy = asHeavySubtree({
    entries: input.entries,
    depth: 1,
    heavy: null,
  });
  const depthOfHeavy = Math.max(1, heavy ? heavy.split('/').length : 1);
  const groupsAtHeavy = getAllGroupsAtDepth({
    entries: input.entries,
    depth: depthOfHeavy,
  });
  const groups =
    groupsAtHeavy.length > 1
      ? groupsAtHeavy
      : getAllGroupsAtDepth({
          entries: input.entries,
          depth: depthOfHeavy + 1,
        });
  // 🔴 name dirs only: a lone file named as its own partition is a per-file cut, which is the
  //    horizontal shape the next line forbids. lone files stay in the remainder, for the
  //    driver to place beside the domain they belong to
  const named = groups
    .filter((group) => group.deeper)
    .slice(0, LIMIT_OF_PARTITIONS_SUGGESTED);
  if (named.length === 0)
    return [
      `--partition '<slug>=<globs>' (one per set a reviewer can judge alone)`,
    ];

  // one declaration per group, the route beside each
  const slugs = named.map((group, index, all) => {
    const slug = asSlugOfPrefix({ prefix: group.prefix });
    const isTaken = all
      .slice(0, index)
      .some((prior) => asSlugOfPrefix({ prefix: prior.prefix }) === slug);
    return isTaken ? `${slug}-${index + 1}` : slug;
  });
  const declarations = named.map((group, index) => {
    const globs = [
      `${group.prefix}/**`,
      ...(input.route ? [`${input.route}/**`] : []),
    ];
    return `--partition '${slugs[index]}=${globs.join(',')}'`;
  });
  const left = groups.length - named.length;
  return left > 0
    ? [
        ...declarations,
        `(+ ${asCountedNoun({ count: left, one: 'more group', many: 'more groups' })} — every target must sit in a partition)`,
      ]
    : declarations;
};

/**
 * .what = the lines that render both levers beneath a head: the partition suggestion, the
 *         moves every partition owes (one domain, the shared context it reads, and a preview
 *         before the spend), then the cut for mass the rubric does not grade
 * .why = 🔴 a driver who is told to cut by domain will drop the shared context each domain
 *        needs, unless told the overlap is expected and cheap. it is both: a file two
 *        partitions list is graded once (`getAllTargetsByPartition`), its bytes lead every
 *        partition's prompt, and the pour is primed so each partition reads them from cache
 *        (`stepReviewByPartitions`)
 * .why = the two levers answer one question — does the rubric grade this mass? — so the
 *        head asks it once and both levers follow. a partition SPREADS mass the rubric must
 *        grade; `--paths-wout` HIDES mass it does not
 *
 * .note = the `--paths-wout` example names no subtree. the heaviest subtree is the likeliest
 *         subject of the rubric, so to name it there would point a driver at a cut of the code
 *         that most needs review
 */
const asPartitionLeverLines = (input: {
  head: string;
  suggestion: string[];
}): string[] => [
  `   ├─ lever — ${input.head}`,
  ...input.suggestion.map((line) => `   │  ├─ ${line}`),
  `   │  ├─ one domain per partition, with its own tests (rule.forbid.horizontal-partitions)`,
  `   │  ├─ list the shared context in every partition that reads it too — route yields, briefs, shared types`,
  `   │  │  └─ the overlap is graded once, and it leads each prompt, so every partition reads it from cache`,
  `   │  ├─ preview first with --mode plan ${CLAUSE_OF_PARTITION_UNDER_GUARD}`,
  `   │  └─ or cut a subtree the rubric does not grade — --paths-wout '<subtree>/**'`,
];

/**
 * .what = the locus entries of the named target inputs, with the route's spec excluded
 * .why = the spec is what the reviewer grades against, so no lever may name it as a cut
 *        (seed S31); one name for "what this lever can reach"
 */
const getAllLocusEntriesOfLever = (input: {
  locus: Record<TargetInputName, LocusEntry[]>;
  names: TargetInputName[];
  route: string | null;
}): LocusEntry[] =>
  input.names
    .flatMap((name) => input.locus[name])
    .filter(
      (entry) => !isPathOfRouteSpec({ path: entry.path, route: input.route }),
    );

/**
 * .what = the lines of the levers a refusal names
 * .why = three cases, in order of evidence: no target mass (a non-target input fills the
 *        window), a partition that still overflows, or a whole run. the last two name both
 *        levers and differ only in the head. which KIND of mass leads is not restated here —
 *        the directory rows above name the kinds each directory carries
 */
const asOverflowLeverPrimaryLines = (input: {
  subjectChars: number;
  partition: string | null;
  route: string | null;
  allEntries: LocusEntry[];
}): string[] => {
  // the targets carry no mass: neither a bind nor a partition reaches it
  if (input.subjectChars === 0)
    return [
      `   ├─ lever — the targets carry no mass; the rubric, refs, or conversation fill the window`,
      `   │  └─ narrow --rules, --refs, or --conversation`,
    ];

  // the suggestion both other heads share
  const suggestion = asPartitionSuggestionLines({
    entries: input.allEntries,
    route: input.route,
  });

  // a partition that still overflows wants narrower partitions
  if (input.partition !== null)
    return asPartitionLeverLines({
      head: `partition \`${input.partition}\` still overflows alone; replace it with narrower ones`,
      suggestion,
    });

  // a whole run: partition what the rubric grades, cut what it does not
  return asPartitionLeverLines({
    head: 'partition what the rubric grades, cut what it does not',
    suggestion,
  });
};

/**
 * .what = the levers an overflow refusal names, plus the upstream dispatch when the lane
 *         was stamped from a template
 * .why = "reduce scope" names no lever. two levers reach target mass, and the question that
 *        picks between them is whether the rubric grades it: a declared partition SPREADS
 *        mass the rubric must grade; `--paths-wout` HIDES mass it does not. both reach an
 *        added body and an edited one alike, so both are always named; the added-vs-edited
 *        split (seed S32) rides on each directory row above, never restated here. a lane stamped
 *        from a template owes the cut upstream as a task, since every route stamped from
 *        that template inherits the same overflow
 *
 * .note = the route's own spec is excluded from every suggestion. it is what the reviewer
 *         grades against, never a lever to make a prompt fit (seed S31)
 */
export const asReviewOverflowLeverLines = (input: {
  /** the chars each target input would have sent */
  mass: Record<TargetInputName, number>;
  /** per target input, the chars each target would have sent */
  locus: Record<TargetInputName, LocusEntry[]>;
  /** the partition this run already was, or null for a whole run */
  partition: string | null;
  /** the route this run was driven from, whose spec is never a cut */
  route: string | null;
  /** where the lane's guard was stamped from; null for a hand run or a route-local guard */
  provenance: ReviewGuardProvenance | null;
}): string[] => {
  // the mass any lever can reach — the target inputs that send a body or a hunk
  const subjectChars =
    input.mass['targetDiffs.additions'] +
    input.mass.targetFiles +
    input.mass['targetDiffs.mutations'];

  // the entries each lever can cut, the spec excluded
  const allEntries = getAllLocusEntriesOfLever({
    locus: input.locus,
    names: ['targetFiles', 'targetDiffs.additions', 'targetDiffs.mutations'],
    route: input.route,
  });

  // the levers
  const primary = asOverflowLeverPrimaryLines({
    subjectChars,
    partition: input.partition,
    route: input.route,
    allEntries,
  });

  // the upstream dispatch, where a template stamped this lane
  const upstream = input.provenance
    ? [
        `   ├─ upstream — stamped from ${input.provenance.uri}; dispatch the cut so every route it stamps inherits it`,
        `   │  └─ rhx radio.task.push --via gh.issues --into ${input.provenance.repo ?? '<owner/repo>'} --title 'review lane ${input.provenance.slug} overflows on large branches' --description @stdin`,
      ]
    : [];

  return [...primary, ...upstream];
};
