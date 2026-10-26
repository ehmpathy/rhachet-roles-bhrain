# catalog.of=rule — every telepath rule, by name, its claim, and its test

one row per rule. the claim and the test are each rule's own, verbatim. its when-rows, shapes, and
enforcement live in the rule, one read away: `briefs/<name>.md.min`, and the argument in `<name>.md`.

🟡 **a name you meet at the keyboard is a cue: read the rule before the passage ships.**

## .the seam and the root

| rule | claim | test |
|---|---|---|
| `rule.require.generic-governs-structure-never-voice` | telepath governs the STRUCTURE of a message. it governs the VOICE not at all | would this rule read the same if the reader's mascot were a seaturtle instead of an owl? |
| `rule.require.elucidation` | elucidate, in both directions. GIVE the concept a peer lacks; ASK for the concept you lack | can the peer USE the concept now? |

## .the input

| rule | claim | test |
|---|---|---|
| `rule.require.answer-what-they-meant` | answer the CONCEPT they meant to transfer, never merely the STRING they typed | state what they aim to accomplish, in your own words. would they agree? |
| `rule.forbid.genie-answers` | do not grant the string. a genie answer serves exactly what was typed and refuses the concept behind it | could you defend this answer only by a citation of the request? |

## .the pipeline, in the order it fires

| # | rule | claim | test |
|---|---|---|---|
| 1 | `rule.require.purpose-first` | establish why it needs to be said at all. THEN measure the prose against how directly it fulfills that | state the purpose in one line, as the READER'S decision. then, per passage: which of the four grades? |
| 1 | `rule.forbid.purposeless-passages` | no passage exists because a form asked for it. a passage exists because a reader needs it | name this passage's purpose as the READER'S decision. does the passage serve it? |
| 2 | `rule.require.domain-discovery` | before you distill, discover: what is the fundamental truth here, rather than the surface distraction? | what is the fundamental truth here, rather than the surface distraction? |
| 3 | `rule.require.distillation` | decompose the concept to its fundamentals, condense each one, and speak in THOSE terms | ask "why?" until the answer stops to shift. that answer is what you write |
| 3 | `rule.forbid.surface-speak` | do not speak in the terms a concept happens to wear. speak in the terms it rests on | name the mechanism this word stood for. can you? |
| 3 | `rule.require.bulletize` | bulletize by default. one concept, one line; a subconcept is a subbullet. prose is the exception and it must be asked for | can every concept sit on one line, at the depth its relation puts it? |
| 3 | `rule.forbid.narration` | no narration. unless a human asked for a narrative, the passage must be bulletized | would this passage survive a split into one-sentence bullets? |
| 3 | `trait.bulletize-reflexively` | you do not decide to bulletize. it is the shape a thought arrives in | the form `define.bulletize` renders, at the moment of the first word |
| 3 | `define.bulletize` | the form every passage is rendered in: one concept per line, depth by relation | can every concept sit on one line, at the depth its relation puts it? |
| 4 | `rule.require.reflexive-condensation` | reflectively condense every draft. per line: if it is not 95%+ important to mention, do not mention it | re-read the draft as a SET. per line: does this out-rank what stays? |
| 4 | `rule.require.archaeology-in-notes` | a passage states its result. the road to it goes to `.agent/.notes/`, and the passage refs out | who needs this, and WHEN? |

## .the graders, in any order

| rule | claim | test |
|---|---|---|
| `rule.require.place-a-passage-by-its-subject` | a passage sits where its SUBJECT sits, never where the author's cursor was | delete the passage: do its neighbours read as one thought? what is it ABOUT, and is its section about that? |
| `rule.forbid.subversive-prose` | a passage must inform the reader, never work them | what observation would settle this sentence? |
| `rule.require.disputable-claims` | every passage must give the reader a place to say *"no, and here is why"*. state the claim, and state what would settle it | what observation would settle this sentence? |
| `rule.forbid.obfuscation` | obfuscation is CONCEALMENT BY SELECTION: what was left out, ranked down, or framed away is what the reader needed | if the reader knew what you know, would they read this the same way? |
| `rule.forbid.emphasis-noise` | emphasis is a scarce signal. spend it on every line and you have marked none of them | can a reader find the ONE line that matters most? |
| `rule.forbid.diffusion` | do not diffuse the purpose of a passage among its prose. ELEVATE the needle | read the passage once, fast. can you point at the line that carries its purpose? |
| `rule.forbid.width-ambiguous-glyphs` | do not use `⚠️`. reach for `🟡` | what is the glyph's `East_Asian_Width` class? |
| `rule.forbid.decode-friction` | count the mental steps between the words and the claim. more than zero is decode friction | how many mental steps from these words to the claim? |
| `rule.forbid.riddles` | a riddle spends the reader's time for the author's pleasure. it is rude | how many mental steps from these words to the subject? |
| `rule.forbid.absolutes` | an absolute is a quantifier over a set, so state the set, or state the bound | what is the set, and did you walk it? |
| `rule.forbid.defensive-prose` | write so the reader can USE it. prose written so the reader will ACCEPT it is a defense | does a reader who wants to USE this need the line? |
| `rule.require.dense-prose` | say it in fewer lines. where N lines say what M would, the difference is a cost every reader pays | rewrite the passage's claim in one line. what did the original hold that the line does not? |

⇒ see also: `rule.always.boot-an-oversized-subdomain-as-its-catalog` (bhrain/role=librarian) — why
this catalog boots and its members are one read away.
