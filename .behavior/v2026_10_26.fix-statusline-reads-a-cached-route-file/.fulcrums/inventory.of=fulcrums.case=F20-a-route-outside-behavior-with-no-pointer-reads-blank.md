# F20 — a route bound outside `.behavior/` with no pointer reads blank until its next drive or bind (5.3 enroll-verif-snapshot-blemishes i004 blocker.2 disputed)

## .the fork
- a: the reader finds any bound route with no pointer, so it walks the repo for bind flags on a repaint
- b: the no-pointer fallback globs `.behavior/*` alone; a route elsewhere shows from its first drive or bind

## .taken, why
b. the wish's subject is per-repaint cost. a repo walk on a repaint is the cost the wish removes, paid on every repaint of every seat that lacks a pointer. the gap is narrow: a pointer is written by every drive, bind, and stone move, so only a fresh clone or a `git clean -fdx` loses it, and only a route outside the conventional home then reads blank, for one move. `.behavior/*` routes read `status unknown`, never blank (reader case4b). the catalog holds this as a blind spot with its reason. the help text that stated the rule wrong is repaired in this round: it now says a route under `.behavior/` is found by a glob, and a route bound elsewhere reads blank until its next drive or bind.

## .rework
clean: widen the fallback glob in the reader, one file and its tests.

## .confidence
88%. below 93% because the frequency of routes outside `.behavior/` was not measured; the repo's own routes all live there.

## .where
`.agent/repo=bhrain/role=driver/skills/route.status.line.sh` no-pointer fallback · catalog blind spot · `asStatusLineHelp.ts`.

## .verdict
open — disputed in i004.
