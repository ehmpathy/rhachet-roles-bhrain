# self-review: behavior-declaration-adherance (r5)

## verification against blueprint

I read the blueprint and compared each section against the implementation.

### §1: cli flag parse (`route.ts`)

| blueprint spec | implementation | line | verified |
|----------------|----------------|------|----------|
| add `yield: { type: 'string' }` | options has yield | 724 | verified |
| add `hard: { type: 'string' }` | options has hard | 725 | verified |
| add `soft: { type: 'string' }` | options has soft | 726 | verified |
| validate --hard and --soft mutually exclusive | `if (hasHard && hasSoft) throw` | 784-787 | verified |
| validate --hard conflicts with --yield keep | `if (hasHard && options.yield === 'keep') throw` | 790-793 | verified |
| validate --soft conflicts with --yield drop | `if (hasSoft && options.yield === 'drop') throw` | 796-799 | verified |
| validate --yield value must be keep or drop | `if (hasYield && options.yield !== 'keep' && options.yield !== 'drop')` | 802-805 | verified |
| validate yield flags only allowed with --as rewound | `if ((hasYield \|\| hasHard \|\| hasSoft) && options.as !== 'rewound')` | 808-812 | verified |
| derive final yield value with default 'keep' | ternary: hasHard → drop, hasSoft → keep, else yield ?? 'keep' | 815-822 | verified |
| pass yieldMode to stepRouteStoneSet | `yield: yieldMode` | 850 | verified |

### §2: orchestrator pass-through (`stepRouteStoneSet.ts`)

| blueprint spec | implementation | line | verified |
|----------------|----------------|------|----------|
| extend input with `yield?: 'keep' \| 'drop'` | input type has yield | 29 | verified |
| pass yield to setStoneAsRewound | `yield: input.yield` | 67 | verified |

### §3: rewind with yield archival (`setStoneAsRewound.ts`)

| blueprint spec | implementation | line | verified |
|----------------|----------------|------|----------|
| extend input with `yield?: 'keep' \| 'drop'` | input type has yield | 24 | verified |
| extend return with yieldOutcomes array | return type has `yieldOutcomes: Array<{...}>` | 30-33 | verified |
| track yieldOutcomes for each stone | `const yieldOutcomes: Array<...> = []` | 77-78 | verified |
| if yield === 'drop': call archiveStoneYield | `if (input.yield === 'drop') { archiveStoneYield(...) }` | 96-101 | verified |
| if yield !== 'drop': check extant via same glob | `const yieldGlob = \`${stone.name}.yield*\`; enumFilesFromGlob(...)` | 103-109 | verified |
| push outcome to yieldOutcomes | `yieldOutcomes.push({ stone, outcome })` | 101, 109-111 | verified |

### §4: archive function (`archiveStoneYield.ts`)

| blueprint spec | implementation | line | verified |
|----------------|----------------|------|----------|
| jsdoc `.what` | `.what = archive all yield files for a stone to .route/.archive/` | 7 | verified |
| jsdoc `.why` | `.why = enables --yield drop to move yields out of the way on rewind` | 8 | verified |
| jsdoc `.note` | `.note = uses same glob pattern as getAllStoneArtifacts` | 10-11 | verified |
| input: `{ stone: string; route: string }` | matches exactly | 13-15 | verified |
| return: `{ outcome: 'archived' \| 'absent'; count: number }` | matches exactly | 16-18 | verified |
| glob pattern: `${stone}.yield*` | `const yieldGlob = \`${input.stone}.yield*\`` | 21 | verified |
| if no yield files: return absent | `if (yieldFiles.length === 0) return { outcome: 'absent', count: 0 }` | 28 | verified |
| archive dir: `.route/.archive` | `path.join(input.route, '.route', '.archive')` | 31 | verified |
| ensure archive dir exists | `fs.mkdir(archiveDir, { recursive: true })` | 32 | verified |
| collision check via fs.access | `archiveExists = await fs.access(archivePath).then(...)` | 41-44 | verified |
| if collision: append timestamp suffix | `archivePath = path.join(archiveDir, \`${baseName}.${timestamp}\`)` | 46-47 | verified |
| move file to archive | `await fs.rename(yieldFile, archivePath)` | 51 | verified |
| return archived with count | `return { outcome: 'archived', count: yieldFiles.length }` | 54 | verified |

## conclusion

all 4 sections of the blueprint are implemented exactly as specified:
1. cli flag parse ✓ (10 specs verified)
2. orchestrator pass-through ✓ (2 specs verified)
3. rewind with yield archival ✓ (6 specs verified)
4. archive function ✓ (14 specs verified)

total: 32 blueprint specifications verified.
