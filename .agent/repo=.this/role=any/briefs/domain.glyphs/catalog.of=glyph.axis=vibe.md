# catalog.of=glyph.axis=vibe

## .what

the repo's **voice** — the mascot, and the flourishes that carry its tone. this axis marks no
concept; it marks who speaks, and how.

## .the members

| glyph | holds |
|---|---|
| 🦉 | the repo mascot — the owl's voice, on every surface, in every role |
| 🪷 | lotus — stillness, before action |
| ✨ | sparkles — clarity, all clear |
| 🍵 | tea — contemplation, no rush |
| 🌴🤙 | a route complete — the owl's end-of-drive habit. the one exception; see below |

## 🟡 .the mascot is a SLOT, not a decoration

`ReviewVibe` declares it as a field:

```ts
export interface ReviewVibe {
  mascot: string;    // 🦉 here, 🐢 in ehmpathy
  artifact: string;  // the role's marker
}
```

⇒ so a role's output carries **both** — the repo's voice and the role's marker — and a consumer
repo swaps only the first. that is what makes a bhrain skill legible inside `ehmpathy`.

## 🟡 .a flourish claims no axis, so it is NOT reusable as a marker

**a flourish carries no concept, so a reader cannot triage on it** — which is exactly why 🪷, ✨,
and 🍵 must never be promoted to a role or phase marker. a glyph that means *"the owl is calm
here"* cannot also mean *"the librarian holds the floor"*.

## .the palette bound — it binds the ROLE axis, not every axis

every **role marker** is drawn from the owl's `.emojis` list in `im_a.bhrain_owl.md`, with no
exceptions. that is the axis where a glyph names a speaker, so an off-palette entry there is an
off-voice one.

🟡 **the other axes are not so bound, and the register shows it.** the `rung` ladder (🧠 💧 🔩 🪨),
the `halt` set (👋 ✋ 💥), and 🌾 on `phase` are all off-palette and all correctly claimed — **they
mark a STATE, never a speaker**, so a voice palette has no jurisdiction over them.

⇒ so the palette is the register **for voice**; this catalog is the register for every axis.

## .off-palette splits THREE ways, and two of them are legitimate

| off-palette because… | verdict | examples |
|---|---|---|
| it marks a state, so no voice governs it | ✅ legitimate | 🧠 💧 🔩 🪨 · 👋 ✋ 💥 · 🌾 |
| it marks the owl's own end-of-drive habit, at an intersection | ✅ the exception | 🌴🤙 |
| it marks a tone in this repo's own speech | 🔴 a defect | — |

**a state marker is exempt from the palette.** a vibe glyph is governed by it — **except where the
line it sits on reports more than one repo's work.**

## ✅ 🌴🤙 — the exception, and it is the OWL'S OWN

both glyphs are the seaturtle's (`rule.im_an.ehmpathy_seaturtle.md`): 🌴 island life, 🤙 hang loose.

- neither is in the owl's `.emojis` list
- they ship on this repo's route status line — `🗿 route complete 🌴🤙` — and `stepRouteDrive.ts`
  comments the pair as *"done, hang loose."*

⇒ **that is no drift. the glyphs CROSS, for the owl.**

> *"lets just say that 🌴🤙 is an exception where we allow 🌴🤙 to cross for the owl. most of the
> time, owls dont hang out at the beach, but at the end of a drive, they often like to"*
> — the wisher, 2026-08-31 (`.seeds/inventory.of=seeds.case=S18-*.md`)

- the owl is at the beach because the drive is done
- an owl does not hang out there most of the time — and at the end of a drive, it likes to
- ⇒ so the pair is no foreign vibe on loan; it is the owl's own earned end-of-drive habit, in a
  place the owl genuinely goes

🟡 and that account outranks the credit one it replaced:

- under a credit account, a reviewer could argue the credit is unnecessary on a solo drive
- under this one the question does not arise — the habit is the owl's, whoever else was in the room

## .and it is ALSO a credit — the intersection is why the owl goes at all

the two accounts compose. the reason a completed route is the owl's beach moment is that it is the
one line where several actors' work lands at once:

| actor | mascot | what they contributed |
|---|---|---|
| the driver | 🦉 the owl | drove the stones |
| the behaver | 🦫 the beaver | bound the behavior the route serves |
| the mechanic | 🐢 the seaturtle | did the work the stones asked for |

**a foreign vibe there names who else was in the room.** to swap it for an owl glyph would report
that the owl finished alone, which is false.

> *"this is where the driver intersects. this is where beavers meet turtles; and others too…
> this is the one exception… an example of teamwork."*
> — the wisher, 2026-08-31 (`.seeds/inventory.of=seeds.case=S17-*.md`)

## 🟡 .the test — is the line ABOUT the collaboration, or merely uttered amid one?

the exception is narrow, and this is what stops it from absorbing the rule:

| the line | verdict |
|---|---|
| reports a handoff or a completion several actors reached together | ✅ borrow their vibe. it credits them |
| is this repo's **own** speech — a rule, an error, a header, a nudge | 🔴 owl glyphs only |

⇒ **`define.bhrain-repo-mascot` still binds everywhere else.** its claim — *"all stdout,
treestruct headers, and vibes here use owl glyphs"* — governs the owl's own voice, and a credit to
a teammate is not the owl who speaks as someone else.

🟡 **and the borrowed glyph must be the teammate's real one.** 🌴🤙 is legitimate because it is
genuinely the seaturtle's; an invented beach glyph would credit nobody and would be the defect this
exception is often mistaken for.

## .see also

- `im_a.bhrain_owl.md` (driver) — the palette, and the owl persona in full
- `define.bhrain-repo-mascot` — the mascot-vs-marker split
- `catalog.of=glyph._.md` — the index across every axis
