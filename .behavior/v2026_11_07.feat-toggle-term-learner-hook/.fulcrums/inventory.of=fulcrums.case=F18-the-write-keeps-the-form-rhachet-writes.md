# F18 — the write keeps the form rhachet writes

## .the fork

- **A.** the write keeps the file's indent and trailer newline, and otherwise writes `JSON.stringify` form, as rhachet does
- **B.** keep any hand format (minified, compact arrays, crlf), or print a `reformats = whole file` leaf when the round trip differs

## .taken — A

rhachet writes this file whole as `` `${JSON.stringify(input.settings, null, 2)}\n` `` on every hook sync (`rhachet-brains-anthropic/src/hooks/config.dao.js` `writeClaudeCodeSettings`). so any file rhachet manages is already in stringify form, and a hand format does not survive the next `rhx init` in any case. A keeps the two traits a human editor changes without intent (indent width, trailer newline); case12 clamps them. B would need a format-aware json editor, or a second render path whose only job is to warn about a reformat that rhachet makes anyway.

## .rework — clean

an additive leaf in the cli, fed by one round-trip compare.

## .confidence — 85%, why not higher

an old-layout repo that never runs `rhx init --hooks` could keep a hand format for a long time.

## .where

`src/domain.operations/learn/termsHook/asSettingsText.ts`
