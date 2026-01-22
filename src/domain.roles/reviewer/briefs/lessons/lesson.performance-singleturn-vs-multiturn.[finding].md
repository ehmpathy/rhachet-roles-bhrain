# single-turn vs multi-turn performance

## .what

research findings on LLM performance degradation in multi-turn conversations vs single-turn prompts

## .tldr

- **39% average performance drop** in multi-turn vs single-turn
- **degradation visible at just 2 turns** — not gradual
- **mitigation**: consolidate into single prompt ("concat-and-retry")
- **exception**: agentic tool-use loops succeed despite multi-turn structure

## .research

### study 1: "LLMs Get Lost In Multi-Turn Conversation" (Laban et al. 2025)

[arXiv:2505.06120](https://arxiv.org/abs/2505.06120) | [Microsoft Research](https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/)

tested 15 models across 200,000+ simulated conversations:

| metric | value |
|--------|-------|
| performance drop | 39% average |
| turns to degrade | 2 (immediate) |
| single-turn accuracy | ~90% |
| multi-turn accuracy | ~65% |
| aptitude loss | -15% |
| unreliability increase | +112% |

**root causes**:
1. models prematurely propose full answers, make assumptions
2. over-rely on previous (incorrect) attempts
3. "lost in the middle" — attend to first/last turns, neglect middle
4. verbose responses introduce assumptions that distract

**critical finding**: "when LLMs take a wrong turn in a conversation, they get lost and do not recover"

**surprising**: o3 and Deepseek-R1 (extended think) fared no better — longer replies introduced more assumptions

**mitigation**: "concat-and-retry" — consolidate into single prompt, accuracy returns to 90%+

### study 2: MT-Eval benchmark (Chung et al. 2024)

[arXiv:2401.16745](https://arxiv.org/abs/2401.16745)

- significant performance degradation across 11 LLMs
- degradation **not correlated** with model capabilities
- **key factors**: distance to relevant content + error propagation

### study 3: MINT benchmark (Wang et al. 2023)

[arXiv:2309.10691](https://arxiv.org/abs/2309.10691)

- **critical**: better single-turn ≠ better multi-turn
- Claude-2 > Claude-1 in single-turn, but Claude-1 benefits more from interaction
- SIFT and RLHF generally **hurt** multi-turn capabilities

### study 4: MultiChallenge benchmark (2025)

[arXiv:2501.17399](https://arxiv.org/abs/2501.17399)

- all frontier LLMs struggle with multi-turn challenges
- requires: instruction-follow + context allocation + in-context reason simultaneously

### context rot research

[Chroma Research](https://research.trychroma.com/context-rot)

- performance degrades as input tokens increase
- tested 18 models (GPT-4.1, Claude 4, Gemini 2.5, Qwen3)
- reliability decreases with longer inputs

### "lost in the middle" phenomenon

[Stanford paper](https://arxiv.org/abs/2307.03172) (Liu et al. 2023)

- U-shaped attention: strong on first/last, weak in middle
- 20 documents (~4K tokens): accuracy 70-75% → 55-60% when info in middle
- up to 30% degradation for middle-positioned info

## .why agentic tool-use succeeds

if multi-turn degrades, why do REPL brains (claude code, cursor) work?

**key difference: structure vs ambiguity**

| conversational multi-turn | agentic tool-use loops |
|---------------------------|------------------------|
| natural language, underspecified | structured JSON tool calls |
| user drips info across turns | system provides concrete feedback |
| model must infer/assume intent | model receives explicit results |
| no ground truth to anchor | tool outputs anchor each step |
| context accumulates noise | each turn has clear purpose |

**conversational fails because**:
- underspecification forces assumptions
- assumptions compound into errors
- errors aren't corrected
- model "talks when it should listen"

**agentic succeeds because**:
- each turn has structured purpose
- tool outputs provide ground truth
- errors surface explicitly
- goal-directed, not exploratory

## .implications for review skill

the review skill is a **single-turn structured task**:
- rules and targets fully specified upfront
- no back-and-forth needed
- clear section boundaries

this is optimal — keep it single-turn.

## .sources

### multi-turn degradation
- [LLMs Get Lost In Multi-Turn Conversation - arXiv](https://arxiv.org/abs/2505.06120)
- [LLMs Get Lost - Microsoft Research](https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/)
- [Why Language Models Get 'Lost' - Unite.AI](https://www.unite.ai/why-language-models-get-lost-in-conversation/)
- [MT-Eval - arXiv](https://arxiv.org/abs/2401.16745)
- [MINT - arXiv](https://arxiv.org/abs/2309.10691)
- [MultiChallenge - arXiv](https://arxiv.org/abs/2501.17399)
- [How LLMs Get Lost - Maxim](https://www.getmaxim.ai/blog/from-turn-1-to-turn-10-how-llms-get-lost-in-multi-turn-conversations/)

### context rot
- [Context Rot - Chroma Research](https://research.trychroma.com/context-rot)
- [Context rot challenge - Understanding AI](https://www.understandingai.org/p/context-rot-the-emerging-challenge)
- [Lost in the Middle - Stanford](https://arxiv.org/abs/2307.03172)

### agentic architectures
- [Effective Agents - Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [Context for AI Agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
