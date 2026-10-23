# F13 · keep the two driver inits standalone, and keep each suite's test fixtures local

## .the fork
the decomposition lane (`arch-opport-decomposition`, 5.1 i001) raised two nitpicks:
- n2: factor the shared "pick target by layout / warn-and-pass / backup / atomic replace" of
  `init.claude.status-line.sh` and `init.claude.permissions.route.sh` into a sourced file
- n3: move the `asStable*` tokenizers and the other test fixtures out of the suites

for each: (a) extract, or (b) keep it in place.

## .taken, and why at the time
(b) on both.

- n2: two instances, not three — `rule.prefer.wet-over-dry` asks to wait for the third. the two
  share a skeleton but not a body: one merges a `statusLine` and gates on the actor's roles, the
  other strips denies and findserts allows. a sourced file adds a third file, a source path
  resolved at runtime inside an init that must never fail `rhx init`, and a coupling where a
  change to one init's warn shape moves the other's. the reviewer itself names the third
  instance as the trigger.
- n3: `rule.require.single-responsibility` governs a prod module's exports. these test fixtures
  are not exported; each tokenizer is shaped to its own suite's output (a backup name, a renderer
  command, a temp path), so a shared util would gather three unrelated shapes under one name.

## .rework
clean — an extraction, any time a third init with this shape lands.

## .confidence — 88%
the shared file becomes right the moment a third init needs the same layout pick; the call is
about when, not whether.

## .where
`src/domain.roles/driver/inits/`.

## .verdict
open
