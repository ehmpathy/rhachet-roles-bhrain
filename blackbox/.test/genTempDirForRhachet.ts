import { genTempDir } from 'test-fns';

/**
 * .what = creates a temp directory ready for rhachet roles link
 * .why = enables acceptance tests with git repo and node_modules symlink
 * .note = the ONE copy. `invokeRouteSkill` and `invokeReviewSkill` re-export it, so a change to
 *         the symlink set lands once — two copies were once edited in lockstep for one brain swap
 */
export const genTempDirForRhachet = (input: {
  slug: string;
  clone: string;
}): string => {
  return genTempDir({
    slug: input.slug,
    clone: input.clone,
    git: true,
    symlink: [
      // symlink rhachet-roles-bhrain package for the roles under test
      {
        at: 'node_modules/rhachet-roles-bhrain/package.json',
        to: 'package.json',
      },
      { at: 'node_modules/rhachet-roles-bhrain/dist', to: 'dist' },
      {
        at: 'node_modules/rhachet-roles-bhrain/rhachet.repo.yml',
        to: 'rhachet.repo.yml',
      },
      // symlink .bin for npx to find rhx/rhachet commands
      { at: 'node_modules/.bin', to: 'node_modules/.bin' },
      // symlink rhachet so rhx entrypoint can find ../rhachet/bin/rhx
      { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
      // symlink .pnpm for pnpm-generated wrapper scripts that use relative paths
      // .why = rhx wrapper does $basedir/../.pnpm/... which needs .pnpm to exist
      { at: 'node_modules/.pnpm', to: 'node_modules/.pnpm' },
      // symlink brain packages for brain discovery
      // .why = discoverBrainPackages reads the fixture's package.json, then imports each brain
      //        package BY NAME resolved from the fixture root. node's lookup walks the fixture's
      //        own node_modules and its parents under /tmp — it never reaches the repo's — so an
      //        absent symlink makes every brain unloadable and any review the fixture drives
      //        malfunctions
      {
        at: 'node_modules/rhachet-brains-openrouter',
        to: 'node_modules/rhachet-brains-openrouter',
      },
      {
        at: 'node_modules/rhachet-brains-anthropic',
        to: 'node_modules/rhachet-brains-anthropic',
      },
      {
        at: 'node_modules/rhachet-brains-openai',
        to: 'node_modules/rhachet-brains-openai',
      },
    ],
  });
};
