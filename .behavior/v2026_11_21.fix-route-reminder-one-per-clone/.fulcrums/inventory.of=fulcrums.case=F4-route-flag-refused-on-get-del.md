# F4 — `--route` refused on `get|del`, kept on `gen`

- **fork**: (a) refuse `--route` on `get|del` with a ConstraintError that names the fix; `gen --route X` writes focus = X · (b) accept and ignore `--route` · (c) keep `--route` as a filter: report the clone daemon only when focus = X
- **taken**: (a). (b) is a silent surprise (`rule.forbid.surprises`). (c) keeps a per-route mental model the fix removes. `gen --route` has a real role — it seeds focus for a hand spawn
- **rework**: clean — a cli arg parse
- **confidence**: 80% — an extant caller may pass `--route` to `get`; the error names the one-word fix
- **where**: `1.vision.yield.md` · what is awkward · `case=4`
