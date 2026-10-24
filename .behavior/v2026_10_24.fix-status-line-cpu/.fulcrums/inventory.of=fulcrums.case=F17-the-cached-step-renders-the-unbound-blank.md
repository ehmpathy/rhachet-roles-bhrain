# F17 — the cached step renders the unbound blank itself

- **the fork:** an unbound seat must print the blank line. (a) `stepRouteStatusLine` accepts
  `route: null`, looks the bind up, and maps unbound to blank · (b) `stepRouteStatusLine` takes
  `route: string`; the cached step owns the lookup and maps unbound to
  `asStatusLine({ kind: 'blank' })`
- **taken:** (b). the legacy export forwards to the subpath entry, so the cached step is the one
  caller, and it always holds the route before it renders. "unbound means blank" and the bind lookup
  each have one home; the bytes of the blank line have one owner, `asStatusLine`
- **against:** a future caller that holds no route must look the bind up itself
- **rework:** clean — widen the input to `route: string | null` and restore the lookup branch
- **confidence: 85%**
- **where:** `statusLine/stepRouteStatusLineCached.ts` (`getOneRenderedLine`),
  `route/stepRouteStatusLine.ts`
