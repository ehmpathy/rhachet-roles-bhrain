# F4 — prod-dep cycles excluded from the dpdm check

## .the fork
the upgrade adds `test:lint:cycles` (dpdm over `src/**`, node_modules included, `exclude: []`). it finds 27 cycles, all inside dependencies, none in `src/`:

| package | reach | cycle |
|---|---|---|
| rhachet, declastruct-aws, @aws-sdk/* | dev (+ peer) | internal |
| helpful-errors@1.5.x | prod, transitive via iso-price, as-procedure, wrapper-fns | `HelpfulError.js <-> withHelpfulError.js` |
| domain-objects@0.31.x | prod, transitive via as-procedure, simple-in-memory-cache, wrapper-fns | `DomainObject.js <-> hydrateNestedDomainObjects.js` |
| bottleneck | prod, third-party, via @ehmpathy/as-command, wrapper-fns | `Bottleneck.js <-> Group.js` |
| readable-stream | prod, third-party, via archiver | `_stream_duplex.js <-> _stream_*.js` |

`rule.forbid.dpdm-exclude-change` (mechanic) allows a devDep exclude and forbids a prod one. options:
- **A.** exclude the dev ones only; lint stays red until upstream ships clean releases. no green pr
- **B.** exclude the dev ones, and hold the four prod ones as a named exception, each line with its cycle, its reach, and the condition to drop it
- **C.** replace archiver and the bottleneck wrappers. large, out of this upgrade's scope

## .taken: B
- the latest published releases of the direct deps still pin the cyclic copies: iso-price 1.2.0, as-procedure 1.1.13, wrapper-fns 1.1.7, @ehmpathy/as-command 1.0.5, rhachet-artifact 1.0.4 were tried, no cycle cleared; the bumps were reverted
- bottleneck and readable-stream are third-party; no edit of ours reaches them
- org precedent: `rhachet-roles-ghlitch/.dpdmrc.yaml` excludes helpful-errors, domain-objects, bottleneck the same way
- each exclude is scoped to one store dir (`/<name>@`, version-pinned for the two org packages), so no peer is hidden and a fixed release of helpful-errors or domain-objects is checked again
- none of these cycles is new: they shipped on main before; the check is what is new

## .rework: clean
delete the four prod lines in `.dpdmrc.yaml`. no caller depends on them.

## .confidence: 90%, why not higher
the swaps are proven by types, lint, unit, and the snapshot integration suites; the live thinker steps that use `withRetry` / `withTimeout` are retired from ci, so their runtime path is proven only by the unit clamps.

## .where
`.dpdmrc.yaml`; found in stone `3.1.repair.test.defects`.

## .verdict
ruled by the driver, under a director bound of no prod exclude left behind: **C for the third-party residue, overrides for the org cycles. zero prod excludes.**
- org cycles: `pnpm.overrides` pins every transitive `helpful-errors@<1.7` to 1.7.5 and every `domain-objects@<0.34` to 0.34.0, the clean releases
- `bottleneck`: no longer installed. `wrapper-fns` was used for `withRetry` + `withTimeout` only, in 10 thinker steps; each is now a local operation at `src/domain.roles/thinker/` (unit clamped). `@ehmpathy/as-command` wrapped one codegen command, which now runs plain
- `readable-stream`: no longer installed. `captureSnapshot` zips with `fflate` (zero deps, one bundled file) in place of `archiver`; the snapshot integration suites (32 tests) read the zip back via `unzip`. install reason: `appendix/package.install.reason.for_fflate.md`
- `.dpdmrc.yaml` holds dev excludes only; `test:lint` passes
- the upstream asks (`485257c39520be13`, `36db125e9fb634f6`) stay queued: they would let other consumers keep wrapper-fns and as-command
