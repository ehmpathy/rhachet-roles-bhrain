# domain.term.choice.reason: pointer

## .etymology

`pointer` is the plain word for a value whose whole job is to name where another artifact lives. it
carries no content of its own, and that is this file exactly: one path, or one mark, and naught else.

| candidate | why it lost |
|---|---|
| `bind` | already the truth this file derives from (`term=route.bind`). to call the derived copy a bind would make two concepts one word, and `rule.forbid.domain-term-ambiguity` forbids it |
| `index` | an index maps many keys to many places. this file maps one branch to one route |
| `bookmark` | a human's saved place. no human writes or reads this file; writers and a reader do |
| `link` | spent on the filesystem sense (`rhx symlink`), and this file is no symlink: the reader must tell a route from the multi-bind mark, which a symlink cannot hold |
| `ref` | spent on git's refs, and the file sits one hop from `.git/HEAD`'s own `ref:` line, which the reader parses too. two `ref`s in one reader would read as one concept |
| ✅ `pointer` | names the act (it points), holds no claim to be the truth, and collides with no term in this glossary |

## .evidence

### the instances it must cover (`rule.require.enumerate-before-you-name`)

| instance | covered |
|---|---|
| a branch bound to one route | the route path |
| a branch bound to two routes | `@multi-bind` |
| a branch bound to none | no file |
| a branch whose flag was removed by hand | the file names a route, and the reader finds no flag → blank |

`pointer` covers each: in every row the file points somewhere, or says it cannot.

### invariants

- a writer names a route in the pointer only where that route holds this branch's bind flag
- a writer that knows only its own flag never overwrites another bound route's name. it writes the
  mark (`asRouteStatusLinePointerNext`)
- only the full bind lookup (`route.drive` with no `--route`, `route.bind.set`) clears the mark
- an unbind deletes the pointer

### where the word was settled

first used in `.behavior/v2026_10_26.fix-statusline-reads-a-cached-route-file`, fulcrum F9 (the
pointer took its own file rather than a field in the node cache record).

## .parent

- `term=route.status.line._.choice._.md` — the line this pointer serves; its boundary is `route`
