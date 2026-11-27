# F1: a published role's course output lands in `.agent/repo=.mods/role=$role/`

- **fork**: (a) the rhachet mod overlay · (b) `.agent/repo=.this/role=$role/` beside the published role · (c) a radio task upstream to the role's package
- **taken**: (a). rhachet 1.54.1 boots a mod over its published role (`parseRoleModBootYaml.js`); (b) would read as a second native role of the same slug; (c) does not reach the role in this repo until a release
- **rework**: clean — one target-dir transformer
- **confidence**: 80% — mods are new in rhachet; their boot-budget interaction is unmeasured here
- **where**: `1.vision.yield.md` `.what this builds`
- **verdict**: settled by the wisher (S2) — both homes, source primary: an own role (listed in `rhachet.repo.yml`) lands in its `src/` dirs; a linked role lands in the mod; a native role in place. shipped as `getOneEducationRole`
