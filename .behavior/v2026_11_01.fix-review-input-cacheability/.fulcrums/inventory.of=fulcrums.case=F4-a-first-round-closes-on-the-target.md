# F4 — a first round closes on the target, not on the rubric

## .the fork

the corpus-first layout moved the rubric to the prompt's tail. a prompt with a conversation still
closes on `## now review`. a prompt with none (a lane's first round, or a hand run) closed on
`</rules>` or `</refs>`, under a header that says not to flag them. the prior layout closed on
`<target>`, so recency fell on the work.

- **A, taken.** a closer renders in every shape. with a conversation it is byte-identical to the
  prior closer. without one it reads: *the rules above are the rubric* (or *the rules and refs
  above are*, where a `<refs>` section rides). *the <target> section is what you review. grade the
  target against the rubric, then report on the target.*
- **B.** keep strict content equality (same content, new order), and accept a first round that
  closes on the rubric.

## .why A

the content-equality bar exists to serve the wish's last deliverable: verdicts unchanged. B meets
the bar and moves the reviewer's final read from the work to the rubric, which is the one change
of order most likely to move a verdict. A adds ~190 chars to first-round prompts, at the very end,
so it costs no cache. a prompt with a conversation is byte-identical to before.

## .rework

clean. one branch in `asCloser` (`asPromptTail.ts`); revert it, its `[case4]` in
`asPromptTail.test.ts`, and the `[case5]` clamp in `compileReviewPrompt.layout.integration.test.ts`.

## .confidence — 80%, and why not higher

the director's verdict bar names content equality, and A adds content to one shape. it is the
shape the bar did not foresee, and the addition only restores where the prompt closes.

## .verdict

ruled 2026-11-06 by the director: **A**, the best guess stands. a clean rework that touches no
credential and no prod write.
