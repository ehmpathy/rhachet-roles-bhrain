# domain.term: status.line

term.chosen   = status.line
term.kind     = noun
term.boundary = route
term.synonyms.forbidden:
- statusbar
- status.bar
- footer
- prompt.line

## .what

**the one line a seat's harness paints under the prompt, which names the bound route's current
stone and its status.**

the harness repaints it often; the route moves rarely. so the line is rendered when the route
moves, into a status file beside the route (`$route/.route/.status.line.json`), and a repaint only
reads that file. a stale or absent file reads as such on the line, never as a silent blank.

| part | what it is |
|---|---|
| the status file | the rendered line, its stamp, and when it was written — one per route |
| the pointer | which route the line reads for a branch (`term=route.status.line.pointer`) |
| the reader | `route.status.line.sh` — bash, no child process per repaint |
| the writer | `setRouteStatusLineFile` — runs as the last act of each move |

## .refs

- `src/domain.operations/route/stepRouteStatusLine.ts` — the render
- `src/domain.operations/route/statusLine/file/setRouteStatusLineFile.ts` — the writer
- `src/domain.operations/route/statusLine/file/asRouteStatusLineFilePath.ts` — the status file path
- `src/domain.roles/driver/skills/route.status.line.sh` — the reader
- `src/domain.roles/driver/inits/init.claude.status-line.ts` — binds the reader as the seat's statusLine

## .reason

- `term=route.status.line._.choice.reason.md`
