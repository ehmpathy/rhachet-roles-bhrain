import * as fs from 'fs/promises';

import { genFile } from './genFile';
import { genSymlink } from './genSymlink';
import { getDomainTermsPaths } from './getDomainTermsPaths';

/**
 * .what = gen the domain.terms glossary scaffold — dir, readme, rule symlinks, and the
 *         cache dir (+ its .gitignore) that holds the staleness sentinel
 * .why = the wish mandates a deterministic scaffold that bootstraps the dir; this is
 *        idempotent by construction. the cache .gitignore is findsert (stable, keep local
 *        edits); the readme + rule symlinks are UPSERT so each run reconciles them to
 *        the declared install-managed target — a re-run converges to the declared state
 *        without churn, and self-heals a re-pointed link (rule.require.idempotent-operations).
 * .note = the scaffold writes only what EVERY repo needs. the glossary-dir .gitignore
 *         that excludes the __boottest__ sentinel is NOT here — that sentinel is written
 *         solely by this repo's boot-reachability test, so its leak-guard belongs to that
 *         test, not to a scaffold every consumer runs (it would litter consumers with a
 *         rule for a file they never create).
 */
export const genDomainTermsScaffold = async (): Promise<{
  glossaryDir: string;
  created: string[];
}> => {
  const paths = getDomainTermsPaths();

  // .note = deliberate mutation: collect the paths this run actually created
  const created: string[] = [];

  // findsert the glossary dir + the cache dir (staleness sentinel lives there)
  await fs.mkdir(paths.glossaryDir, { recursive: true });
  await fs.mkdir(paths.cacheDir, { recursive: true });

  // findsert a self-exclusive .gitignore into the cache via the shared race-safe
  // primitive — the sweep writes a walltime progress sentinel here; without this it
  // is one `git add` from a commit (a timestamp in the tree). tracks the dir,
  // excludes its contents. genFile's atomic `wx` create keeps `created`
  // deterministic under concurrent runs
  const { created: gitignoreCreated } = await genFile({
    at: paths.cacheGitignorePath,
    content: '*\n!.gitignore\n',
  });
  if (gitignoreCreated) created.push(paths.cacheGitignorePath);

  // upsert the readme symlink — its source of truth is a learner brief, linked back
  // via the install-managed target, exactly as the two rules are. upsert reconciles a
  // stale link (a moved brief, or a prior run's target) to the declared `to`, so a
  // reword to the brief reaches every consumer's glossary with no regeneration step
  const { created: readmeCreated } = await genSymlink({
    at: paths.readmeSymlink.at,
    to: paths.readmeSymlink.to,
    idem: 'upsert',
  });
  if (readmeCreated) created.push(paths.readmeSymlink.at);

  // upsert each rule symlink via the shared race-safe primitive. the target is the
  // install-managed brief location, so upsert reconciles a stale link (a renamed rule,
  // or a prior run's target) to the declared `to` instead of a link to a ghost —
  // converge to the state, not mere existence (rule.require.idempotent-operations)
  for (const link of paths.ruleSymlinks) {
    const { created: linkCreated } = await genSymlink({
      at: link.at,
      to: link.to,
      idem: 'upsert',
    });
    if (linkCreated) created.push(link.at);
  }

  return { glossaryDir: paths.glossaryDir, created };
};
