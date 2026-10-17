# F11 · read the repo actor's roles from `<actor>/actor.json` direct, not via `rhx actor list`

## .the fork
- (a) read `$CLAUDE_DIR/../../actor.json` and its `.roles`
- (b) call `rhachet actor list --output json` and pick the repo actor's row
- (c) read neither: test the link `.agent/repo=bhrain/role=driver`

## .taken, and why at the time
(a). the list names each actor by `exid` and `repoPath`, never by brain dir, so (b) cannot say which
actor owns the target file without a hard-coded `repo=ambient` exid. (a) reads the record that sits
beside the very brain dir the init writes, and adds no subprocess.

## .rework
clean — one block in `init.claude.status-line.sh`, plus cases 9 and 14.

## .confidence — 85%, and why it is not higher
(a) couples to rhachet's on-disk record: its name, its place, and its `.roles` key.

## .where
`src/domain.roles/driver/inits/init.claude.status-line.sh`, the split-layout role check.

## .verdict
superseded by (c) — a peer lane (i003 r10 blocker.1) showed the record is a cache. rhachet writes
the repo actor's `actor.json` only at a clone enroll, and passes `rolesAmbient: rolesLinked` when
it derives the repo actor. so at `rhx init --roles driver` in an extant repo the record still lacks
driver, and (a) skipped — the wish's own symptom. (c) reads the source rhachet derives from. clamped
by status-line `[case14]` (record lags, binds), `[case14b]` (record malformed, binds, no warn),
`[case14c]` (driver unlinked, record lists driver, our line removed); reverted to (a), case14 goes red.
