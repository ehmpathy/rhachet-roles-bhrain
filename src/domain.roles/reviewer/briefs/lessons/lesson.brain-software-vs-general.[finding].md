# software-specialized vs general-purpose brains

## .what

findings on why code-specialized brains respect section boundaries better than generalist brains

## .context

the review skill presents rules and targets in a single prompt with clear section headers. the brain must understand that examples in rules are illustrative, not content to review.

## .findings

### test results (clean chapter — no violations expected)

| brain | result | failure mode |
|-------|--------|--------------|
| `xai/grok/code-fast-1` | ✓ pass | — |
| `xai/grok/4-fast` | ✗ fail | flagged rule examples as target violations |
| `xai/grok/4.1-fast` | ✗ fail | flagged rule examples as target violations |
| `openai/gpt/4o` | ✗ fail | hallucinated text that doesn't exist in file |
| `claude/sonnet` | ✓ pass | — |

### failure details

**grok-4-fast and grok-4.1-fast**: treated examples from the rules section as target content. flagged "the dancing of the anemones" which appears only in `rule.no-gerunds.md` as a negative example — not in the target file.

**openai/gpt/4o**: hallucinated text that doesn't exist anywhere — reported phrases that differ from the actual file content.

## .root cause

### architecture differences

**grok-code-fast-1** ([xAI](https://x.ai/news/grok-code-fast-1)):
- built from scratch for agentic coding workflows
- 314B parameter MoE, 256K context
- pre-trained on corpus rich in code
- post-trained on real-world pull requests
- optimized for: read → search → edit → test

**grok-4.1** ([xAI model card](https://data.x.ai/2025-11-17-grok-4-1-model-card.pdf)):
- unified architecture for reasoning + non-reasoning
- generalist model, not code-specialized
- 2M context window, broad capabilities

### why code specialization matters

code-specialized models learn semantic boundaries fundamental to software:
- **function definitions vs function calls** — definition describes, doesn't invoke
- **imports vs usage** — imports declare, don't execute
- **comments vs code** — documentation vs executable
- **test fixtures vs assertions** — setup vs the test itself
- **examples in docs vs actual usage** — critical for review

grok-code-fast-1 learned from pull requests to distinguish:
- "this is an example in documentation" vs "this is content to review"
- "this section describes rules" vs "this section contains targets"

### research support

specialized models outperform general models on domain tasks ([V2Solutions](https://medium.com/@v2solutions/specialized-language-models-slms-why-smaller-domain-focused-ai-is-winning-in-2025-1930d21db2b2)):
- domain-specific training provides "profound and nuanced understanding of industry jargon"
- "accuracy, relevance, and reliability that general LLMs struggle to match in niche contexts"

smaller specialized models show "performance comparable to or even exceeding that of much larger LLMs in targeted benchmarks" ([NVIDIA](https://developer.nvidia.com/blog/how-small-language-models-are-key-to-scalable-agentic-ai/))

### the fundamental insight

**generalist models** (grok-4.1):
- over-apply pattern recognition across section boundaries
- treat examples in rules as "more data to analyze"
- fail to recognize semantic difference between sections

**code-specialized models** (grok-code-fast-1):
- sections have distinct purposes
- examples illustrate, they don't constitute the work
- the task is in the targets section, not the rules section

## .recommendation

use `xai/grok/code-fast-1` or `claude/sonnet` for review tasks that require respect for section boundaries.

avoid `xai/grok/4-fast`, `xai/grok/4.1-fast`, and `openai/gpt/4o` for this use case.

## .sources

- [Grok Code Fast 1 - xAI](https://x.ai/news/grok-code-fast-1)
- [Grok 4.1 Model Card](https://data.x.ai/2025-11-17-grok-4-1-model-card.pdf)
- [Why Specialized SLMs Outperform General-Purpose LLMs](https://onereach.ai/blog/small-specialized-language-models-vs-llms/)
- [Specialized Language Models - V2Solutions](https://medium.com/@v2solutions/specialized-language-models-slms-why-smaller-domain-focused-ai-is-winning-in-2025-1930d21db2b2)
- [Small Language Models for Agentic AI - NVIDIA](https://developer.nvidia.com/blog/how-small-language-models-are-key-to-scalable-agentic-ai/)
