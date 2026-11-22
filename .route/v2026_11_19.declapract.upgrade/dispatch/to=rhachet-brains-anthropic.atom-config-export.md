## .what
publish a stable subpath export for the atom config (`CONFIG_BY_ATOM_SLUG`), e.g. `rhachet-brains-anthropic/atoms/config`.

## .why
rhachet-roles-bhrain prices transcripts per exact versioned model slug (`claude/opus/v4.5`). discovery via `rhachet/brains` lists only the version-less aliases, so bhrain reads the versioned specs from `rhachet-brains-anthropic/dist/domain.operations/atoms/BrainAtom.config`, an internal dist path.

that path is not a contract. an internal move, or an `exports` field added to package.json, breaks bhrain silently: it then renders every model `unpriced`.

## .ask
- add the config (or a read such as `getAllAtomSpecsVersioned()`) to the public exports
- bhrain then swaps its deep import for the export

## .seen
rhachet-roles-bhrain, branch `beav/feat-declapract-upgrade`, `src/domain.operations/reflect/tokens/getAllTokenRatesByModel.ts`
