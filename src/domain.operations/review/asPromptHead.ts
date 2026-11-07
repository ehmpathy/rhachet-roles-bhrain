import {
  MARKER_OF_OUTPUT_FORMAT,
  MARKER_OF_TARGET,
} from './getOneHeadMarkerOffsets';

/**
 * .what = the prompt's shared head — every block that the lanes of one level send
 *         byte for byte, within one round
 * .why = a prompt cache keys on the exact byte prefix from token 0, so every
 *        byte placed ahead of the first byte two requests differ on can be read
 *        from cache, and every byte behind it cannot. this head is composed
 *        widest-share first (`rule.require.order-prompt-bytes-by-reuse-breadth`):
 *
 *          1. instructions + diff howto + goal  — identical for every lane of one goal
 *          2. output format                     — identical for every review ever
 *          3. the target corpus                 — identical for every lane of a level
 *                                                 that binds one corpus
 *
 *        the lane's own rubric and refs trail it, in the tail (`asPromptTail`).
 *        a guard pours a level's lanes seconds apart, nine lanes over one corpus, each
 *        with its own rubric: a rubric ahead of the corpus parted every lane from its
 *        peers there, so each paid the corpus in full. with the corpus here, the lanes
 *        compute one head, the level's prime meet (keyed brain + head) primes it once,
 *        and the peers read it from cache.
 *
 * 🔴 .note = the trade, stated so a reader does not hoist the rubric ahead of the corpus:
 *         a rubric does not ride a cross-round prefix. it sits behind the corpus, and a
 *         round whose driver repaired a file or whose base moved parts the prefix ahead
 *         of it. a rubric is ~7% of a heavy prompt; the corpus a level shares is ~88%,
 *         read by N−1 peers. with the rubric ahead of the corpus, heavy levels cached ~1%
 *         per round (`.behavior/v2026_11_01.fix-review-input-cacheability/appendix/measurement.before.md`)
 *
 * 🟡 .note = the second trade: the head rides as the SYSTEM prompt, so the reviewed code
 *         now rides there too. a target body is repo-supplied text, and an instruction
 *         planted in a diff now reads at system trust where it read at user trust. the
 *         harm is bounded: a review's output is a verdict a guard tallies, and a forged
 *         clean verdict still meets the driver's passage and the human gate. the cache
 *         anchor is worth it, and the `<target>` fence plus the closer ("the <target>
 *         section … is what you review") keep the target named as data
 *
 * .note = "static" names that the head is byte-identical across the LANES of one round,
 *         not across rounds: the corpus moves when the driver repairs a file. across
 *         rounds the cache still serves a lane up to its first changed target, since
 *         `getAllTargetsByCacheStability` sorts the repaired ones last
 *
 *        the goal block parts an `exhaustive` lane from a `representative` one ahead of
 *        block 2, so two lanes of different goals share only the instructions and the
 *        diff howto.
 *
 * .note = the goal block sits ahead of the output format on purpose, though the
 *         output format is the more universal of the two
 *         (rule.require.order-prompt-sections-by-volatility-then-size):
 *         - the census cuts the head by its markers: `instructions` runs from token 0
 *           to `MARKER_OF_OUTPUT_FORMAT`, and `outputFormat` from there to the target
 *           block (`getOneHeadMarkerOffsets`). a hoist would fold the goal into
 *           `outputFormat` and make that row per-goal, so the census would mis-name
 *           what it measures
 *         - the gain is bounded by ~1.7k chars, and only between two lanes of
 *           DIFFERENT goals on one stone. lanes of one stone almost always share a
 *           goal, and for them the order is moot: both blocks match
 *         ⇒ the trade costs at most one output-format block per cross-goal pair, and
 *           buys a census whose rows each hold one volatility
 *         - the break-even: the hoist gains `p × 1.7k` chars read at the cache rate,
 *           where `p` is the chance a lane's prefix is served from a replica a lane of
 *           ANOTHER goal warmed. a replica pin keyed on the system prompt would part two
 *           goals, since the goal block rides inside it: `p = 0` wherever such a pin
 *           holds. where no pin rides the call (`rhachet-brains-openrouter@0.1.4` sends
 *           none; see `asRoleOfSharedPrefix`), the hoist gains at most ~1.7k × (1 − 1/31)
 *           ≈ 1.6k chars per cross-goal pair — below
 *           the cost of one census row that mis-names what it measures
 *
 * .note = every instruction item is unconditional, and reads correctly whether or
 *         not its section is present ("if a <refs> section appears below…"). an
 *         item appended only when a section exists would move this whole head's
 *         first divergent byte to the top of the prompt
 *         (research.review-cost-and-cache).
 */
export const asPromptHead = (input: {
  goalInstructions: string;
  /** the target band every lane of the level, or every partition of the split, sends */
  targetSection: string;
}): string => `# review task

you are a reviewer. apply the rules below to the target files.

## CRITICAL INSTRUCTIONS — READ CAREFULLY

1. ONLY review content in the <target> section
2. NEVER flag anything from the <rules> section — rules contain examples of bad patterns for illustration only
3. if you see "bad: X" or "good: Y" in a rule, those are examples to learn from, NOT content to flag
4. the "locations" array must ONLY contain paths from <target>, never from <rules>
5. if you cannot find the violation in <target>, do not report it
6. if a <refs> section appears below, it holds reference documents for context — use them to inform your review, but do not flag content from refs
7. if a <conversation> section appears below, it is the prior peer-review dialogue — your earlier critiques (.given, with detailed .report) and the driver's responses (.taken). for each prior point the driver answers with a [REPAIR] (a claimed code fix) or a [REFUTE] (a reasoned argument the critique does not hold). weigh each on its merits: (a) [REPAIR] present in <target> → drop the point; (b) [REPAIR] absent from <target> → re-raise it; (c) [REFUTE] that is sound (e.g. extant code out of scope, a false positive, a deliberate tradeoff) → concede and drop it, the driver need not change code to be right; (d) [REFUTE] that is unsound → hold the point and say why the argument fails. the driver is a peer, not a subordinate — a well-argued [REFUTE] is a valid resolution. do NOT flag content from conversation

## how to use the diff (FOCUS ON THE DELTA)

every \`<target.diff>\` block is a change this pr made, marked by its \`kind\`:

- \`<target.diff path="..." kind="+">\` — a file this pr ADDED. its whole body is the change, shown as plain lines with no \`+\` prefix. every line is new code and may be flagged; count line numbers from its first line, and copy "snippet.code" from it as is.
- \`<target.diff path="..." kind="-" />\` — a file this pr DELETED. it is gone — do not review or flag it.
- \`<target.diff path="..." kind="~">\` — a file this pr EDITED. it carries hunks (what changed), and a \`<target.file path="...">\` block carries the full current file, for context.

for an edited file:

- focus your review on the diff — the lines this pr added or changed. do NOT churn unrelated untouched code; fix-forward. BUT DO flag untouched code that this change breaks.
- line numbers for "locations" come from the diff hunk headers (\`@@ -X,Y +A,B @@\`) — the \`+A\` side is the authoritative anchor for changed lines. use those numbers rather than count content lines by hand.
- copy "snippet.code" from the clean \`<target.file>\` content, NEVER from the diff's \`+\`/\`-\` prefixed lines.
- diff \`-\` lines are REMOVED code — this pr deletes them, they no longer exist. NEVER flag a \`-\` line. only \`+\` lines and surrounding context are code that exists and may be flagged.
${input.goalInstructions}

${MARKER_OF_OUTPUT_FORMAT}

IMPORTANT: output your review as text directly. do not use any tools to write files. your final response must be the JSON object below, printed as plain text.

note: the "locations" array must contain ONLY paths from the <target> section. never include rule file paths in locations.

\`\`\`json
{
  "done": true,
  "blockers": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\\nconst x = badPattern();"
      }
    }
  ],
  "nitpicks": [
    {
      "rule": "path/to/rule.md (which rule was violated)",
      "title": "short title for the issue",
      "description": "detailed multiline explanation of the issue.\\ninclude context about why this violates the rule.\\nbe specific about what needs to change.",
      "locations": ["path/to/target-file.ts:42 (only target files, never rule files)"],
      "snippet": {
        "lang": "ts",
        "code": "// the exact code from the target file that violates the rule\\nconst x = badPattern();"
      }
    }
  ]
}
\`\`\`

IMPORTANT: every violation MUST include a "snippet" with the actual code from the target file that violates the rule. copy the exact code so the reader can identify the violation.

if no issues found, output: \`{"done": true, "blockers": [], "nitpicks": []}\`

${MARKER_OF_TARGET} (REVIEW THIS SECTION ONLY)

<target>
${input.targetSection}
</target>
`;
