#!/bin/bash
# mock-review-prose.sh - a reviewer whose stdout carries NO numeric count
#
# .why = `getReviewCountsViaRegex` finds no `N blockers` / `N nitpicks` pair here, so
#        the guard falls back to `getReviewCountsViaBrain` — the ONLY path that reads
#        RHACHET_FALLBACK_BRAIN_TIMEOUT_MS. the env refusal fires at
#        `getFallbackTimeoutMs()`, which runs BEFORE the brain call, so this mock
#        costs no LLM tokens and needs no credentials.
#
# .note = deliberately prose-only. a numeric count anywhere in this output would be
#         picked up by the regex tally and the fallback would never be reached.

echo "the code looks reasonable to me overall"
echo "i have no further remarks at this time"
exit 0
