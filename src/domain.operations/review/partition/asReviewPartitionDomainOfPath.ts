import { asReviewPartitionTokensOfText } from './asReviewPartitionTokensOfText';

/**
 * .what = the slug no repair ever grows
 * .why = 🔴 a catch-all groups files by the fact that no domain claimed them, which is no domain
 *        at all (seed S52, rule.forbid.horizontal-partitions). a partition a driver named `rest`
 *        is a real partition, but the tool never routes a new file into it, and never derives it
 */
export const SLUG_OF_CATCH_ALL = 'rest';

/**
 * .what = the dir segments that name a tier or a tree root, never a domain
 * .why = `src/` holds every domain, so a domain is read from the segments beneath it
 */
const DIRS_OF_ROOT = new Set(['src']);

/**
 * .what = the dir names that hold tests of every domain side by side
 */
const DIRS_OF_TEST_LAYER = new Set(['blackbox', 'test', 'tests', '__tests__']);

/**
 * .what = the dir jest writes a test's snapshots into, beside the test
 * .why = it is transparent: a snapshot belongs to the domain of the test that wrote it
 */
export const DIR_OF_SNAPSHOTS = '__snapshots__';

/**
 * .what = a plain partition slug from words — lowercase, each run of other chars cut to `-`
 */
const asSlugOfWords = (input: { words: string[] }): string =>
  input.words
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * .what = a derived slug that never collides with the catch-all slug
 */
const asSlugNotCatchAll = (input: { slug: string }): string =>
  input.slug === SLUG_OF_CATCH_ALL ? `${input.slug}-domain` : input.slug;

/**
 * .what = the named domain an unclaimed file belongs to, read from its own path: a slug and the
 *         glob that claims the domain
 * .why = 🔴 every changed file sits in an explicitly named domain partition (seed S52). where no
 *        declared partition fits a file, the repair proposes the domain its path already names —
 *        never a remainder. the glob is the domain's dir, so its peers ride along
 *
 * .note = the order of the reads:
 *         - a file at the repo root is `config` — a root file is config, by the shape of a repo
 *         - a file beneath a `briefs` dir is `briefs`, claimed at that dir
 *         - else the first dir beneath `src/` whose name carries a domain word names the domain
 *           (`.agent` → `agent`, `src/domain.roles` → `roles`, `src/domain.operations/git` → `git`)
 *         - else, in a test-layer dir, the file's stem names the domain
 *           (`blackbox/keyrack.unlock.acceptance.test.ts` → `keyrack`, at
 *           `blackbox/{,__snapshots__/}keyrack.*` — its snapshot rides the same claim)
 *         - else the tier dirs are the domain, two deep (`src/contract/cli` → `contract-cli`)
 */
export const asReviewPartitionDomainOfPath = (input: {
  path: string;
}): {
  slug: string;
  glob: string;
  /** the domain words of the dir that named the domain; null where no domain dir did */
  wordsOfDir: string[] | null;
} => {
  // a root file is config
  const segments = input.path.split('/');
  const dirs = segments.slice(0, -1);
  if (dirs.length === 0)
    return { slug: 'config', glob: input.path, wordsOfDir: null };

  // a brief is a brief, wherever its role keeps it
  const atBriefs = dirs.indexOf('briefs');
  if (atBriefs !== -1)
    return {
      slug: 'briefs',
      glob: `${dirs.slice(0, atBriefs + 1).join('/')}/**`,
      wordsOfDir: null,
    };

  // the first dir beneath the tree root that carries a domain word
  const start = DIRS_OF_ROOT.has(dirs[0]!) ? 1 : 0;
  const atDomain = dirs.findIndex(
    (dir, index) =>
      index >= start && asReviewPartitionTokensOfText({ text: dir }).length > 0,
  );
  if (atDomain !== -1) {
    const wordsOfDir = asReviewPartitionTokensOfText({ text: dirs[atDomain]! });
    return {
      slug: asSlugNotCatchAll({ slug: asSlugOfWords({ words: wordsOfDir }) }),
      glob: `${dirs.slice(0, atDomain + 1).join('/')}/**`,
      wordsOfDir,
    };
  }

  // a test-layer dir holds every domain's tests, so the file's own stem names its domain
  // .why = `blackbox/**` is a whole layer (rule.forbid.horizontal-partitions); the stem
  //        claims one domain's tests, and the `{,__snapshots__/}` arm claims the snapshots
  //        those tests write — so a snapshot never needs a second claim, and never earns a
  //        horizontal `__snapshots__/**` of its own
  const dirsOfOwner =
    dirs[dirs.length - 1] === DIR_OF_SNAPSHOTS ? dirs.slice(0, -1) : dirs;
  const stem = segments[segments.length - 1]!.split('.')[0]!;
  const wordsOfStem = asReviewPartitionTokensOfText({ text: stem });
  if (
    DIRS_OF_TEST_LAYER.has(dirsOfOwner[dirsOfOwner.length - 1]!) &&
    wordsOfStem.length > 0
  )
    return {
      slug: asSlugNotCatchAll({ slug: asSlugOfWords({ words: wordsOfStem }) }),
      glob: `${dirsOfOwner.join('/')}/{,${DIR_OF_SNAPSHOTS}/}${stem}.*`,
      wordsOfDir: null,
    };

  // no domain word: the tier dirs are the domain, up to two deep
  const tiers = dirs.slice(start, start + 2);
  const slug = asSlugOfWords({ words: tiers });
  return {
    slug: asSlugNotCatchAll({ slug: slug || 'config' }),
    glob:
      tiers.length === 0
        ? input.path
        : `${dirs.slice(0, start + tiers.length).join('/')}/**`,
    wordsOfDir: null,
  };
};
