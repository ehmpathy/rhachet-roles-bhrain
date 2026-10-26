# F16 — the subpath command ships with the init that writes it; no skew fallback

- **the fork:** a settings file that names `cli/route.status.line` on an install that lacks the
  export fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`, and the harness shows a blank line. (a) a
  command that falls back to `cli/route` when the subpath is absent · (b) no fallback
- **taken:** (b). the command is written by `init.claude.status-line`, which ships in the same
  package version as the export, so an init writes the subpath only from an install that has it.
  the skew needs a settings file carried to an older install by hand. a fallback would add a
  second probe to every repaint's command, and hide the skew it exists to cover
- **against:** a committed settings file read by a worktree with an older `node_modules` shows a
  blank line, with stderr hidden by the harness, until `rhx upgrade`
- **rework:** clean — the jsonc command is one string
- **confidence: 80%**
- **where:** `src/domain.roles/driver/inits/init.claude.status-line.jsonc`, `package.json` exports
