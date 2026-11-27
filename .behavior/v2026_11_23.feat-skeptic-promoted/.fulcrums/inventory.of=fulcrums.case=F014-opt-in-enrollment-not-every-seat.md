# F014 — "every seat" read as every seat that enrolls skeptic

- **fork**: the wish's outcome says every seat doubts and checks "on release". read it as (a) every seat that enrolls skeptic once the release ships, or (b) every seat, so the release must also make skeptic a default
- **read**: a bhrain role reaches a seat only through `rhx enroll … --roles`; `getRoleRegistry.ts` lists roles and enrolls none. a default for a consumer's seats lives in that consumer's enroll config; nheuron's switch is #818 step 6
- **taken**: (a). this pr ships the role, opt-in; it adds no default enrollment
- **rework**: clean — a default is one line of a consumer's enroll config, outside this repo; no code here changes either way
- **confidence**: 80%; "every seat" may mean the wisher wants a follow-up that sets skeptic as a default in each ehmpathy repo
- **where**: `1.vision.yield.md`, wisher question 3
- **verdict**: overturned to (b) by the driver on the wish's words (seed S11). `0.wish.md` .outcome: the role ships "so every seat doubts and checks before it acts, on release". the wish outranks the vision's guess. the means: rhachet's enroll takes the linked set as its default roleset (`getAllLinkedRoleRefs`: "enroll takes it as its default roleset"), so a linked role boots on every seat with no per-seat opt-in. in this repo the linked set is `prepare:rhachet`, and skeptic now sits in it (F36). in a consumer, every seat that links bhrain's skeptic boots it by default; nheuron's own switch is #818 step 6
