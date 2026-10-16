import { asReviewPartitionDeclarationText } from './asReviewPartitionDeclarationText';
import {
  asReviewPartitionDomainOfPath,
  DIR_OF_SNAPSHOTS,
  SLUG_OF_CATCH_ALL,
} from './asReviewPartitionDomainOfPath';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import {
  asReviewPartitionTokensOfText,
  TOKENS_OF_LAYER,
} from './asReviewPartitionTokensOfText';

/**
 * .what = the directory a glob is rooted at — the text before its first glob token, cut
 *         back to the last `/`; null for a glob with no literal directory
 * .why = a glob's root is the subtree it was written to cover, so a file beneath that root
 *        belongs beside it far more often than beside any other partition
 */
const asRootOfGlob = (input: { glob: string }): string | null => {
  const firstToken = input.glob.search(/[*?[{]/);
  const literal =
    firstToken === -1 ? input.glob : input.glob.slice(0, firstToken);
  const cut = literal.lastIndexOf('/');
  return cut <= 0 ? null : literal.slice(0, cut);
};

/**
 * .what = the domain words of each declared partition — its slug and its globs, less the
 *         route spec and less every word all partitions share
 * .why = a word every partition carries cannot tell them apart, and the route spec rides in
 *        each by contract; what remains is what makes one partition its own domain
 */
const getAllTokensOfPartitions = (input: {
  partitions: Array<{ slug: string; globs: string[] }>;
  route: string | null;
}): Map<string, Set<string>> => {
  // each partition's words, from its slug and every glob but the route spec
  const tokensBySlug = new Map(
    input.partitions.map((partition) => [
      partition.slug,
      new Set(
        [
          partition.slug,
          ...partition.globs.filter(
            (glob) => input.route === null || !glob.startsWith(input.route),
          ),
        ].flatMap((text) => asReviewPartitionTokensOfText({ text })),
      ),
    ]),
  );

  // the words every partition shares, when there are two or more to compare
  const sets = [...tokensBySlug.values()];
  const shared =
    sets.length < 2
      ? new Set<string>()
      : new Set(
          [...sets[0]!].filter((token) => sets.every((set) => set.has(token))),
        );

  // each partition keeps only the words that set it apart
  return new Map(
    [...tokensBySlug].map(([slug, tokens]) => [
      slug,
      new Set([...tokens].filter((token) => !shared.has(token))),
    ]),
  );
};

/**
 * .what = the home of one unclaimed file: the declared slug that shares the most domain
 *         words with it, else the deepest glob root above it; null for none
 * .why = 🔴 a test belongs with the domain it tests (rule.require.vertical-partitions). the
 *        nearest root alone sent `blackbox/driver.route.*` to whichever partition first
 *        claimed any `blackbox/` file, though a `route` partition sat right beside it. a
 *        shared domain word names the home; depth only breaks a tie, and the first declared
 *        breaks the last tie, as every other tie in a split does
 */
const asHomeOfUnclaimed = (input: {
  path: string;
  partitions: Array<{ slug: string; globs: string[] }>;
  tokensBySlug: Map<string, Set<string>>;
}): { slug: string; matched: string[] } | null => {
  // the file's own domain words
  const tokensOfPath = asReviewPartitionTokensOfText({ text: input.path });

  // each partition's score: its slug named by the path, the domain words it shares, then its
  // deepest root above the path
  const scored = input.partitions.map((partition) => {
    const tokens = input.tokensBySlug.get(partition.slug) ?? new Set<string>();
    return {
      slug: partition.slug,
      named: getOneSlugNamedByPath({ slug: partition.slug, path: input.path }),
      matched: [...new Set(tokensOfPath.filter((token) => tokens.has(token)))],
      depth: getOneRootDepthAbove({ path: input.path, globs: partition.globs }),
    };
  });

  // a partition that shares no word and holds no root above the path is no candidate
  const domainOfPath = asReviewPartitionDomainOfPath({ path: input.path });
  const candidates = scored
    .filter(
      (item) =>
        item.named > 0 || item.matched.length > 0 || item.depth !== null,
    )
    .filter(
      (item) =>
        !isAcrossForeignDomainDir({
          item,
          wordsOfDir: domainOfPath.wordsOfDir,
          tokens: input.tokensBySlug.get(item.slug) ?? new Set<string>(),
        }),
    );

  // the most words wins, then the deepest root, then the first declared
  const best = getOneBestFirst({ scored: candidates });
  return best === null ? null : { slug: best.slug, matched: best.matched };
};

/**
 * .what = whether a candidate would claim a file across a domain dir it holds no part of: the
 *         path names its own domain dir, the candidate roots no glob above the path, shares no
 *         word of that dir, and its slug goes unnamed by the path
 * .why = 🔴 a glob word is often a subdir of the partition's own domain, so a lone match on it
 *        says naught about a file in another domain. dogfood 2026-10-10:
 *        `src/domain.operations/research/render/computeOutputTree.ts` matched `tree` in
 *        `route/guard/{…,tree,…}/**`, and the repair grew `route` with `research/render/**`.
 *        a slug the path names still crosses (`setOneWarmerPoke` → `warmer`), since a slug is
 *        the domain a partition declares itself to be; only glob words stop at the dir
 */
const isAcrossForeignDomainDir = (input: {
  item: { named: number; depth: number | null };
  wordsOfDir: string[] | null;
  tokens: Set<string>;
}): boolean => {
  // a path with no domain dir of its own crosses no dir
  if (input.wordsOfDir === null) return false;

  // a slug the path names, or a root above the path, is a claim on the dir itself
  if (input.item.named > 0 || input.item.depth !== null) return false;

  // a partition that carries the dir's own word holds part of that domain
  return !input.wordsOfDir.some((word) => input.tokens.has(word));
};

/**
 * .what = whether a glob rooted at `root` reaches the path: a recursive glob reaches every
 *         depth beneath its root, any other glob only the root's own files
 * .why = 🔴 a one-file glob such as `src/domain.operations/getOneGuardProvenance.*` is rooted
 *        at `src/domain.operations`, and read as a subtree it claimed every operation in the
 *        repo. dogfood 2026-10-10: it sent `research/render/computeOutputTree.ts` to `route`
 */
const isPathInReachOfGlob = (input: {
  path: string;
  glob: string;
  root: string;
}): boolean => {
  if (!input.path.startsWith(`${input.root}/`)) return false;
  if (input.glob.includes('**')) return true;
  return input.path.lastIndexOf('/') === input.root.length;
};

/**
 * .what = the length of the deepest glob root that reaches the path; null for none
 * .why = a root's length orders roots along one path, so the longest root that reaches
 *        the path is its narrowest claim
 */
const getOneRootDepthAbove = (input: {
  path: string;
  globs: string[];
}): number | null => {
  const depths = input.globs
    .map((glob) => ({ glob, root: asRootOfGlob({ glob }) }))
    .filter(
      (item): item is { glob: string; root: string } =>
        item.root !== null &&
        isPathInReachOfGlob({
          path: input.path,
          glob: item.glob,
          root: item.root,
        }),
    )
    .map((item) => item.root.length);
  return depths.length === 0 ? null : Math.max(...depths);
};

/**
 * .what = how many words a slug carries when the path names every one of them; 0 when the
 *         path lacks any
 * .why = 🔴 a slug is the domain a partition declares itself to be, while its glob words are
 *        often incidental — six partitions that each claim one file in `src/contract/cli/`
 *        all carry `cli` as a glob word, and only one of them IS `cli`. a path that names the
 *        whole slug names the home; a longer slug fully named (`route-cli`) is the narrower
 *        domain, so it outranks a shorter one (`cli`)
 * .note = both sides keep their LAYER words here: `cli` is a layer word to a glob, yet a
 *         partition that names itself `cli` has declared that layer its domain
 */
const getOneSlugNamedByPath = (input: {
  slug: string;
  path: string;
}): number => {
  const wordsOfSlug = asWordsOfText({ text: input.slug });
  const wordsOfPath = new Set(asWordsOfText({ text: input.path }));
  const named =
    wordsOfSlug.length > 0 &&
    wordsOfSlug.every((word) => wordsOfPath.has(word));
  return named ? wordsOfSlug.length : 0;
};

/**
 * .what = every lowercase word of a text, layer words kept
 */
const asWordsOfText = (input: { text: string }): string[] =>
  input.text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

/**
 * .what = whether one scored candidate outranks another: a slug the path names, then more
 *         shared words, then a deeper root
 * .why = one named comparison, so the fold reads "the best" rather than a compound boolean
 */
const isOutranked = (input: {
  best: { named: number; matched: string[]; depth: number | null };
  item: { named: number; matched: string[]; depth: number | null };
}): boolean => {
  // a slug the path names wins outright, the longer slug first
  if (input.item.named !== input.best.named)
    return input.item.named > input.best.named;

  // more shared domain words wins next
  if (input.item.matched.length !== input.best.matched.length)
    return input.item.matched.length > input.best.matched.length;

  // a deeper root breaks a tie of words; no root ranks below any root
  return (input.item.depth ?? -1) > (input.best.depth ?? -1);
};

/**
 * .what = the best scored candidate; ties go to the first declared; null for none
 * .why = a strict outrank keeps the first of equals, as every other tie in a split does
 */
const getOneBestFirst = <
  T extends {
    slug: string;
    named: number;
    matched: string[];
    depth: number | null;
  },
>(input: {
  scored: T[];
}): T | null =>
  input.scored.reduce<T | null>(
    (best, item) =>
      best === null || isOutranked({ best, item }) ? item : best,
    null,
  );

/**
 * .what = the dotted stem of a basename, less its layer and extension segments at the end
 * .why = `driver.route.foo.acceptance.test.ts` is about `driver.route.foo`; the suffix names
 *        its layer, which every domain's tests share
 */
const getAllStemSegments = (input: { basename: string }): string[] => {
  const segments = input.basename.split('.');
  const cutAt = segments.findIndex(
    (segment, index) => index > 0 && TOKENS_OF_LAYER.has(segment.toLowerCase()),
  );
  const kept = cutAt === -1 ? segments.slice(0, -1) : segments.slice(0, cutAt);
  return kept.length === 0 ? segments.slice(0, 1) : kept;
};

/**
 * .what = the dotted segments every stem in the group shares, from the front
 */
const getAllSegmentsInCommon = (input: { stems: string[][] }): string[] => {
  const [first, ...rest] = input.stems;
  if (!first) return [];
  const length = first.findIndex(
    (segment, index) => !rest.every((stem) => stem[index] === segment),
  );
  return length === -1 ? first : first.slice(0, length);
};

/**
 * .what = the narrowest glob that claims a group of unclaimed files that share one home and
 *         one directory
 * .why = 🔴 a top-level directory is a horizontal layer — `blackbox/**` sweeps every domain's
 *        contract tests into one partition (rule.forbid.horizontal-partitions). so a group in
 *        a top-level dir is claimed by its shared filename stem, cut after the domain word
 *        that chose its home (`blackbox/driver.route.*`); a group with no shared stem is
 *        claimed file by file. a deeper directory is a subdomain, so it is claimed whole and
 *        its peers ride along — 🔴 unless another partition already splits that dir, where a
 *        whole-dir claim would pull every peer file into a second partition; there the group
 *        is claimed by stem too. a file at the repo root is claimed alone
 */
const asGlobOfGroup = (input: {
  dir: string | null;
  paths: string[];
  matched: string[];
  /** whether another partition already roots a glob at or below this dir */
  split: boolean;
}): Map<string, string> => {
  // a file at the repo root, or a group in a subdomain dir no other partition splits, keeps
  // the plain claim
  const dir = input.dir;
  if (dir === null) return new Map(input.paths.map((path) => [path, path]));
  if (dir.includes('/') && !input.split)
    return new Map(input.paths.map((path) => [path, `${dir}/**`]));

  // the stem the group shares, cut after the last segment that holds a matched domain word
  const common = getAllSegmentsInCommon({
    stems: input.paths.map((path) =>
      getAllStemSegments({ basename: path.slice(path.lastIndexOf('/') + 1) }),
    ),
  });
  const lastMatch = common.reduce(
    (last, segment, index) =>
      asReviewPartitionTokensOfText({ text: segment }).some((token) =>
        input.matched.includes(token),
      )
        ? index
        : last,
    -1,
  );
  const stem = lastMatch === -1 ? common : common.slice(0, lastMatch + 1);

  // a shared stem claims the group, and the snapshots its tests write beside it; with none,
  // each file is claimed alone
  if (stem.length === 0)
    return new Map(input.paths.map((path) => [path, path]));
  return new Map(
    input.paths.map((path) => [
      path,
      `${dir}/{,${DIR_OF_SNAPSHOTS}/}${stem.join('.')}.*`,
    ]),
  );
};

/**
 * .what = whether a partition other than the home roots a glob at or below a dir
 * .why = such a dir is already shared across domains, so a whole-dir claim into one of them
 *        would duplicate every peer file into a second partition
 */
const isDirSplitByOtherPartition = (input: {
  dir: string | null;
  slug: string;
  partitions: Array<{ slug: string; globs: string[] }>;
}): boolean => {
  const dir = input.dir;
  if (dir === null) return false;
  return input.partitions
    .filter((partition) => partition.slug !== input.slug)
    .flatMap((partition) => partition.globs)
    .map((glob) => asRootOfGlob({ glob }))
    .some(
      (root) => root !== null && (root === dir || root.startsWith(`${dir}/`)),
    );
};

/**
 * .what = the homes of a set of unclaimed files, where every file of a subdomain dir that no
 *         declared partition splits shares ONE home: the slug most of them chose, ties to the
 *         first declared
 * .why = 🔴 such a dir is claimed whole (`${dir}/**`). if its files leaned toward two homes,
 *        each home's group claimed the same whole dir, so the repair put one glob into two
 *        partitions and every file of the dir rode in both prompts (dogfood 2026-10-08, a moved
 *        `review/poke/` dir split 3:4 between `warmer` and `review`). one dir, one home
 * .note = a top-level dir or a dir another partition already splits is claimed by stem or file
 *         by file, never whole, so its files keep their own homes
 */
const asHomesUnitedPerDir = <
  T extends { slug: string; dir: string | null; globOfDomain: string | null },
>(input: {
  homes: T[];
  partitions: Array<{ slug: string; globs: string[] }>;
}): T[] => {
  // the order the slugs were declared in, so a tie goes to the first
  const rankOf = (slug: string): number => {
    const index = input.partitions.findIndex((item) => item.slug === slug);
    return index === -1 ? input.partitions.length : index;
  };

  // the one home of each dir claimed whole: the most chosen slug, ties to the first declared
  const homeByDir = new Map(
    [...new Set(input.homes.map((item) => item.dir))]
      .filter(
        (dir): dir is string =>
          dir !== null &&
          dir.includes('/') &&
          !isDirSplitByOtherPartition({
            dir,
            slug: '',
            partitions: input.partitions,
          }),
      )
      .map((dir) => {
        const slugs = input.homes
          .filter((item) => item.dir === dir && item.globOfDomain === null)
          .map((item) => item.slug);
        const best = [...new Set(slugs)].sort(
          (a, b) =>
            slugs.filter((slug) => slug === b).length -
              slugs.filter((slug) => slug === a).length ||
            rankOf(a) - rankOf(b),
        )[0];
        return [dir, best] as const;
      })
      .filter((entry): entry is readonly [string, string] => !!entry[1]),
  );

  // each homed file of such a dir takes the dir's one home
  return input.homes.map((item) => {
    const united = item.dir === null ? undefined : homeByDir.get(item.dir);
    if (united === undefined || item.globOfDomain !== null) return item;
    return { ...item, slug: united };
  });
};

/**
 * .what = the directory that owns a path; null at the repo root
 * .why = 🔴 a jest `__snapshots__` dir is transparent: a snapshot belongs with the test that
 *        wrote it. read as its own dir, `blackbox/__snapshots__/x.snap` was claimed whole as
 *        `blackbox/__snapshots__/**` — every domain's snapshots in one partition
 *        (rule.forbid.horizontal-partitions) — and a test and its snapshot fell into two groups
 */
const asDirOfPath = (input: { path: string }): string | null => {
  const cut = input.path.lastIndexOf('/');
  if (cut === -1) return null;
  const dir = input.path.slice(0, cut);
  if (dir === DIR_OF_SNAPSHOTS) return null;
  return dir.endsWith(`/${DIR_OF_SNAPSHOTS}`)
    ? dir.slice(0, -DIR_OF_SNAPSHOTS.length - 1)
    : dir;
};

/**
 * .what = each unclaimed file's home and the narrowest glob that claims it
 * .why = files that share a home and a directory share one glob, so the group is claimed by
 *        what they have in common rather than by the widest dir above any one of them. a file
 *        no declared partition fits is placed in the named domain its own path names
 *        (`asReviewPartitionDomainOfPath`), claimed at that domain's dir — never a remainder
 *        (seed S52)
 */
const getAllPlacements = (input: {
  unclaimed: string[];
  partitions: Array<{ slug: string; globs: string[] }>;
  route: string | null;
}): Array<{ path: string; slug: string; glob: string }> => {
  // each file's home among the declared partitions, else the domain its path names
  const tokensBySlug = getAllTokensOfPartitions({
    partitions: input.partitions,
    route: input.route,
  });
  const homesOfFiles = input.unclaimed.map((path) => {
    const home = asHomeOfUnclaimed({
      path,
      partitions: input.partitions,
      tokensBySlug,
    });
    const domain =
      home === null ? asReviewPartitionDomainOfPath({ path }) : null;
    return {
      path,
      slug: home?.slug ?? domain!.slug,
      matched: home?.matched ?? [],
      dir: asDirOfPath({ path }),
      globOfDomain: domain?.glob ?? null,
    };
  });

  // a dir claimed whole gets one home, so its glob never lands in two partitions
  const homes = asHomesUnitedPerDir({
    homes: homesOfFiles,
    partitions: input.partitions,
  });

  // one glob per group of files that share a declared home and a directory
  const homed = homes.filter((item) => item.globOfDomain === null);
  const keyOf = (item: { slug: string; dir: string | null }): string =>
    `${item.slug}\u0000${item.dir ?? ''}`;
  const globByPath = new Map(
    [...new Set(homed.map(keyOf))].flatMap((key) => {
      const group = homed.filter((item) => keyOf(item) === key);
      return [
        ...asGlobOfGroup({
          dir: group[0]!.dir,
          paths: group.map((item) => item.path),
          matched: [...new Set(group.flatMap((item) => item.matched))],
          split: isDirSplitByOtherPartition({
            dir: group[0]!.dir,
            slug: group[0]!.slug,
            partitions: input.partitions,
          }),
        }),
      ];
    }),
  );

  // the placements, in the order the files were given
  return homes.map((item) => ({
    path: item.path,
    slug: item.slug,
    glob: item.globOfDomain ?? globByPath.get(item.path) ?? item.path,
  }));
};

/**
 * .what = one `--partition` value from a slug and its globs, as a comma list
 * .why = the inverse of `asReviewPartitionsFromFlags`: a bare comma list round-trips through
 *        the one parser, and needs no brace the shell could expand (seed S53)
 */
const asFlagOfPartition = (input: { slug: string; globs: string[] }): string =>
  `${input.slug}=${input.globs.join(',')}`;

/**
 * .what = the distinct globs placed into one slug, in placement order
 * .why = one named projection, so the fold reads "the globs this slug gains" rather than a
 *        filter/map/Set to simulate (rule.forbid.inline-decode-friction)
 */
const getAllGlobsPlacedInSlug = (input: {
  placed: Array<{ slug: string; glob: string }>;
  slug: string;
}): string[] => [
  ...new Set(
    input.placed
      .filter((item) => item.slug === input.slug)
      .map((item) => item.glob),
  ),
];

/**
 * .what = the globs each held partition gains — its placed globs, plus the route spec where
 *         it lacked it — less those it already declares; partitions that gain none dropped
 * .why = one named projection, so the repair reads "what the held set gains" rather than a
 *        nested map/filter to simulate (rule.require.named-transformers)
 */
const getAllGlobsGainedOfPartitions = (input: {
  declared: Array<{ slug: string; globs: string[] }>;
  placed: Array<{ slug: string; glob: string }>;
  routeGlobs: string[];
  routeAbsentFrom: string[];
}): Array<{ slug: string; globs: string[] }> =>
  input.declared
    .map((partition) => ({
      slug: partition.slug,
      globs: [
        ...getAllGlobsPlacedInSlug({
          placed: input.placed,
          slug: partition.slug,
        }),
        ...(input.routeAbsentFrom.includes(partition.slug)
          ? input.routeGlobs
          : []),
      ].filter((glob) => !partition.globs.includes(glob)),
    }))
    .filter((item) => item.globs.length > 0);

/**
 * .what = each new domain partition a placement owes — a placed slug no declared partition
 *         holds — with its placed globs and the route spec beside them
 * .why = one named projection, so the repair reads "which domains it creates" rather than a
 *        Set/filter/map to simulate (rule.require.named-transformers)
 */
const getAllPartitionsCreated = (input: {
  declared: Array<{ slug: string; globs: string[] }>;
  placed: Array<{ slug: string; glob: string }>;
  routeGlobs: string[];
}): Array<{ slug: string; globs: string[] }> => {
  const slugsDeclared = new Set(
    input.declared.map((partition) => partition.slug),
  );
  return [...new Set(input.placed.map((item) => item.slug))]
    .filter((slug) => !slugsDeclared.has(slug))
    .map((slug) => ({
      slug,
      globs: [
        ...getAllGlobsPlacedInSlug({ placed: input.placed, slug }),
        ...input.routeGlobs,
      ],
    }));
};

/**
 * .what = the paste-ready text of a repair, in the smallest form that closes the gap
 * .why = 🔴 one file claimed once cost a re-declaration of every partition (seed S51). so:
 *        - a route set whose gaps all fit held partitions → one `--claim … --into <slug>` per
 *          partition, the set written back whole by the tool (seed S53)
 *        - a route set that owes a new domain partition → the whole set, since a claim never
 *          creates a partition
 *        - a caller's own flags → only the flags to add beside theirs; a repeated slug merges
 */
const asRepairText = (input: {
  command: { head: string; tail: string } | null;
  partition: string[];
  gained: Array<{ slug: string; globs: string[] }>;
  created: Array<{ slug: string; globs: string[] }>;
}): { form: 'claim' | 'declare' | 'append'; command: string } => {
  // a caller's own flags: append the flags that close the gap
  if (input.command === null)
    return {
      form: 'append',
      command: [...input.gained, ...input.created]
        .map((item) => `  --partition '${asFlagOfPartition(item)}'`)
        .join(' \\\n'),
    };

  // a new domain partition is owed: declare the whole set
  if (input.created.length > 0)
    return {
      form: 'declare',
      command: asReviewPartitionDeclarationText({
        partition: input.partition,
        command: input.command,
      }),
    };

  // every gap fits a held partition: one claim per partition
  return {
    form: 'claim',
    command: [
      input.command.head,
      ...input.gained.map(
        (item) => `  --claim '${item.globs.join(',')}' --into ${item.slug}`,
      ),
      input.command.tail,
    ].join(' \\\n'),
  };
};

/**
 * .what = a declared partition set, repaired so it claims each unclaimed file and carries the
 *         bound route in each partition, plus the paste-ready text that closes the gap
 * .why = 🔴 a refusal that names only the gap leaves the driver to work out the fix by hand,
 *        which is the friction that breeds a stale set. every refusal of a split — the stone
 *        entrance, a route declaration, a review run — carries the repair from this one
 *        transformer, so the right move is the easy one and every surface proposes the same
 *        fix (rule.forbid.workarounds)
 *
 * .note = each file joins the partition that shares the most domain words with it (its slug
 *         and globs), with the deepest glob root above it as the tie-break. a file no declared
 *         partition fits joins the named domain its path names (seed S52). 🔴 a partition named
 *         `rest` is never a candidate home: the tool never routes a new file into a catch-all
 * .note = the set's order is kept, since it decides which partition grades a common file;
 *         a new domain partition is appended last
 * .note = `command` names the declaration's own verb: a route set is repaired by a
 *         `route.guard.partition` command its caller names (head + tail); a caller's own
 *         `--partition` flags have no verb, so the text is the flags to add beside theirs
 */
export const asReviewPartitionRepair = (input: {
  partition: string[];
  unclaimed: string[];
  /** the slugs of the partitions that lack the bound route — each gains `$route/**` */
  routeAbsentFrom: string[];
  /** the bound route; null for a run with none, whose new partitions then need no spec */
  route: string | null;
  /** the command that declares the set; null where the set is the caller's own flags */
  command: { head: string; tail: string } | null;
}): {
  partition: string[];
  placed: Array<{ path: string; slug: string; glob: string }>;
  form: 'claim' | 'declare' | 'append';
  command: string;
} => {
  // the declared set, parsed by the one parser
  const declared = asReviewPartitionsFromFlags({
    partition: input.partition,
  }).map((partition) => ({ slug: partition.slug, globs: partition.globs }));

  // place each unclaimed file in the partition of its domain; a catch-all is never a home
  const placed = getAllPlacements({
    unclaimed: input.unclaimed,
    partitions: declared.filter(
      (partition) => partition.slug !== SLUG_OF_CATCH_ALL,
    ),
    route: input.route,
  });

  // each held partition gains its placed globs, and the route spec where it lacked it
  const routeGlobs = input.route === null ? [] : [`${input.route}/**`];
  const gained = getAllGlobsGainedOfPartitions({
    declared,
    placed,
    routeGlobs,
    routeAbsentFrom: input.routeAbsentFrom,
  });

  // each new domain partition, with the route spec beside its globs
  const created = getAllPartitionsCreated({ declared, placed, routeGlobs });

  // the whole repaired set, the new domains last
  const partition = [
    ...declared.map((partition) =>
      asFlagOfPartition({
        slug: partition.slug,
        globs: [
          ...partition.globs,
          ...(gained.find((item) => item.slug === partition.slug)?.globs ?? []),
        ],
      }),
    ),
    ...created.map((item) => asFlagOfPartition(item)),
  ];

  // the smallest paste-ready text that closes the gap
  const text = asRepairText({
    command: input.command,
    partition,
    gained,
    created,
  });
  return { partition, placed, form: text.form, command: text.command };
};
