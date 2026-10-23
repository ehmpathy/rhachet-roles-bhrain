/**
 * .what = words that name a LAYER or a file kind — what a file is, never what it is about
 * .why = a test suffix, an extension, or a tier dir is shared by every domain, so a match on
 *        one says naught about which partition a file belongs to
 *        (rule.forbid.horizontal-partitions); only a domain word may score a home
 */
export const TOKENS_OF_LAYER = new Set([
  'src',
  'blackbox',
  'test',
  'tests',
  'acceptance',
  'integration',
  'unit',
  'spec',
  'snap',
  'snapshots',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'json',
  'md',
  'min',
  'yml',
  'yaml',
  'sh',
  'index',
  'lib',
  'dist',
  'domain',
  'operations',
  'objects',
  'contract',
  'access',
  'cli',
  'api',
  'sdk',
  'utils',
  'get',
  'set',
  'gen',
  'del',
  'one',
  'all',
]);

/**
 * .what = the lowercase domain words of a path, a slug, or a glob's literal text
 * .why = a camel name and a dotted name both carry their domain in words (`setOnePrime` →
 *        `prime`, `driver.route.foo` → `route`); one split serves the file and the partition
 *        alike, so their words compare like for like
 */
export const asReviewPartitionTokensOfText = (input: {
  text: string;
}): string[] =>
  input.text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !TOKENS_OF_LAYER.has(token));
