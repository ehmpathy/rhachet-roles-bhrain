# brain selection for review skill

## .what

summary of findings on brain selection for the review skill

## .recommendation

use `xai/grok/code-fast-1` or `claude/sonnet` for review tasks.

avoid `xai/grok/4-fast`, `xai/grok/4.1-fast`, and `openai/gpt/4o`.

## .test results (clean chapter — no violations expected)

| brain | result | failure mode |
|-------|--------|--------------|
| `xai/grok/code-fast-1` | ✓ pass | — |
| `xai/grok/4-fast` | ✗ fail | flagged rule examples as violations |
| `xai/grok/4.1-fast` | ✗ fail | flagged rule examples as violations |
| `openai/gpt/4o` | ✗ fail | hallucinated text |
| `claude/sonnet` | ✓ pass | — |

## .detailed findings

see:
- `lesson.brain-software-vs-general.[finding].md` — why code-specialized models respect section boundaries
- `lesson.performance-singleturn-vs-multiturn.[finding].md` — why single-turn prompts outperform multi-turn
