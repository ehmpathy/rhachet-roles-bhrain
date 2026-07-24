/**
 * .what = the canonical paths of the domain.terms glossary + its staleness sentinel
 * .why = the onStop hook keys off the exact progress path and the sweep writes to
 *        exactly that path; a single source of truth keeps the two faces in
 *        lockstep. exact path conformance is required — the hook only nudges when
 *        this precise sentinel is stale.
 * .note = paths are relative to the git root, which is the cwd for every hook +
 *         skill invocation (rule.forbid.cwd-outside-gitroot)
 */
export const getDomainTermsPaths = (): {
  glossaryDir: string;
  readmePath: string;
  readmeSymlink: { at: string; to: string };
  glossaryGitignorePath: string;
  ruleSymlinks: { at: string; to: string }[];
  cacheDir: string;
  cacheGitignorePath: string;
  progressPath: string;
} => {
  // the glossary lives INSIDE briefs/ — the boot loader only pools files under
  // <role>/briefs/, so this is the only place a role's boot can reach it. this is
  // what makes the vision's "boots for every role" promise actually fire.
  const glossaryDir = '.agent/repo=.this/role=any/briefs/domain.terms';
  const cacheDir =
    '.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms';

  // the two rule briefs are the learner role's; the glossary dir advertises its
  // governance via a symlink back. the target is the INSTALL-MANAGED brief location
  // — `.agent/repo=bhrain/role=learner/briefs/` — NOT a `src/` path. that indirection
  // is present in EVERY repo the learner boots into: the install machinery points it
  // at `dist/` here and at `node_modules/rhachet-roles-bhrain/dist/` in a consumer.
  // a `src/` target would exist only in this repo's dev tree and dangle in every
  // consumer — and consumers are the whole point. four hops up reaches `.agent/`.
  const relToLearnerBriefs = '../../../../repo=bhrain/role=learner/briefs';

  return {
    glossaryDir,
    readmePath: `${glossaryDir}/.readme.md`,
    // the readme is the learner role's brief too — the glossary dir links back to
    // it, exactly as it does the two rules. one source of truth in the briefs,
    // reached here via the same install-managed target, so a reword to the brief
    // reaches every consumer's glossary with no regeneration step
    readmeSymlink: {
      at: `${glossaryDir}/.readme.md`,
      to: `${relToLearnerBriefs}/readme.domain-terms.md`,
    },
    // the glossary hosts ephemeral boot-test sentinels (term=__boottest__*) in CI —
    // the boot-reachability test writes one into this real dir to exercise the
    // wildcard boot glob, since a tempdir cannot reproduce the committed symlink
    // chain. a narrow .gitignore excludes only that sentinel prefix (real term
    // clusters stay tracked), so a test killed mid-run can never leak cruft to git.
    // findserted by the scaffold so the guard self-heals + is verifiable in-scope
    glossaryGitignorePath: `${glossaryDir}/.gitignore`,
    ruleSymlinks: [
      {
        at: `${glossaryDir}/rule.require.domain-term-itemization.md`,
        to: `${relToLearnerBriefs}/rule.require.domain-term-itemization.md`,
      },
      {
        at: `${glossaryDir}/rule.forbid.domain-term-synonyms.md`,
        to: `${relToLearnerBriefs}/rule.forbid.domain-term-synonyms.md`,
      },
    ],
    cacheDir,
    // the cache holds the walltime progress sentinel — an ephemeral file that
    // must never reach git (a committed sentinel would be a timestamp in the
    // tree). a self-exclusive .gitignore keeps the dir tracked but its contents
    // out, per the extant rmsafe-trash precedent
    cacheGitignorePath: `${cacheDir}/.gitignore`,
    progressPath: `${cacheDir}/progress.md`,
  };
};
