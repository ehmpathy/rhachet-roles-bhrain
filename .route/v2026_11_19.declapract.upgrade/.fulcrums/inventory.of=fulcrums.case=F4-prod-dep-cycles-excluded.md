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

## .confidence: 80%, why not higher
the mechanic rule names a prod exclude a blocker, and B acts against that stated bound. the case for B rests on "unfixable here", which the bump trial measured; the director granted the call.

## .where
`.dpdmrc.yaml`; found in stone `3.1.repair.test.defects`.

## .verdict
ruled by the driver, on the director's grant: **upgrade, then hold only the third-party residue**.
- the org cycles are eliminated, not excluded: `pnpm.overrides` pins every transitive `helpful-errors@<1.7` to 1.7.5 and every `domain-objects@<0.34` to 0.34.0, the clean releases. types, unit (5638), and integration (3930) pass under the overrides
- two stay excluded, each line with its fix: `bottleneck` (2.19.5 is its last release; reached only via wrapper-fns and @ehmpathy/as-command, dispatched to both owners, `485257c39520be13` + `36db125e9fb634f6`) and `readable-stream` (4.7.0, latest, still cyclic; a dream to replace archiver's zip writer)
- this is the simplest sound design: one override block and a two-line exclude. a dependency swap in two feature paths cannot be proven by the green-pr deadline
- 🟡 the stone's self review forbids any prod exclude; the residue is surfaced to the director, not hidden
