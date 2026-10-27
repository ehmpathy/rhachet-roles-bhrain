# domain.term.choice.reason: status.line

## .etymology

`status line` is the harness's own word: claude code names the config key `statusLine`, and every
seat reads it under that name. the command that renders it is `rhx route.status.line`. to adopt the
harness word keeps one name across the config, the command, and the code.

rejected:

| word | why not |
|---|---|
| `statusbar` / `status.bar` | a gui word; the surface is one line of text, not a bar of widgets |
| `footer` | names a place, not a purpose; `artifact.footer` already holds the word here |
| `prompt.line` | the line sits beside the prompt and is not part of it |

## .the boundary — route, never driver

the line reports a ROUTE's state: its bound route, its current stone, that stone's status. the
driver role ships the reader, but a role is never a boundary (`rule.require.boundary-qualified-terms`).
the test *"status line, of WHAT?"* answers in one word: of a route. so the boundary is `route`, and
the command name `route.status.line` already said so.

## .evidence

instances the word must cover, enumerated before the choice:

- the config key a seat's harness reads (`statusLine` in settings json)
- the rendered text (`🗿 3.blueprint · arrived …`)
- the command that renders it (`rhx route.status.line`)
- the status file that caches the render (`$route/.route/.status.line.json`)
- the bash reader that prints it per repaint

each is the same concept seen from a different seat: the one line that shows a route's place.
neighbours it must exclude: `route.drive`'s full tree (many lines, on demand), a guard's review
tree (a stone's verdict, not a route's place).

### invariants

- a repaint spawns no node process; it reads the status file only
- a stale or absent status file reads as such on the line, never as a blank
- the status file is derived state; the passage ledger and the bind flag are the truth

### where the word was settled

predates this cluster (PR #700 and before). itemized in
`.behavior/v2026_10_26.fix-statusline-reads-a-cached-route-file`, where the status file and the
pointer split the term into parts.
