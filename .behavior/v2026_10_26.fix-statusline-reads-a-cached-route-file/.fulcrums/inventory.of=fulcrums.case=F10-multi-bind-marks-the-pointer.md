# F10 — the multi-bind is marked in the pointer, not in the status file

- **the fork:** the vision says that on a multi-bind the writer "writes the fault line into the
  file". (a) write `🗿 two routes bound…` into a status file; (b) write the mark `@multi-bind` into
  the branch's pointer, and let the reader print the fault line when it reads the mark
- **taken:** (b). a multi-bind has two routes, so there is no one route whose status file could
  hold the fault: a fault line written beside route A would be wrong for route B, and the reader
  would still pick one of them. the pointer is the one per-branch file, so the mark lands where the
  ambiguity lives. the reader prints the fault line itself, and the line the vision specifies is
  unchanged
- **rework:** clean — a different file receives the fault; the reader's output is the same bytes
- **confidence:** 92%. the doubt: the mark clears only on a full bind lookup, so a hand-removed
  flag holds it until the next drive (a con the vision already names)
- **where:** `src/domain.operations/route/statusLine/file/setRouteStatusLinePointerAsMultiBindOrWarn.ts`,
  `asRouteStatusLinePointerNext.ts`; reader `route.status.line.sh`
