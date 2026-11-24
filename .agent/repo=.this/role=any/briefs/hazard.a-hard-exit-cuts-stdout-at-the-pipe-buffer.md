# hazard.a-hard-exit-cuts-stdout-at-the-pipe-buffer

> **a node skill that writes a large report and then calls `process.exit()` loses every byte a slow reader had not drained. set `process.exitCode` and let the process end on its own.**

## .why
stdout to a pipe is async in node. past the pipe buffer (64KB on linux), writes queue in memory until the reader drains them. `process.exit()` ends the process at once and drops the queue. the reader sees a report cut mid-line, with the verdict (the last line) gone, and the exit code still says success or failure as if the report were whole.

a fast reader (jest's `spawnSync`) drains in time, so the defect hides in tests and shows only behind a slow one: `rhx skill | rhx grepsafe ...`.

## .the test
pipe a report past 64KB into `{ sleep 1; cat; }`, with `set -o pipefail`, and assert the last line arrives. measure bytes (`Buffer.byteLength`), not chars: a tree glyph is three bytes.

| when… | then… |
|---|---|
| a skill ends with `console.log(report); process.exit(code)` | set `process.exitCode = code` instead |
| an early refusal exits before any large write | `process.exit` is fine there; naught is queued |
| a report can grow with the repo | clamp it with the slow-reader case |

## .worked example
`audit.test.intentions` cut its branch report at 8,193 bytes behind a slow reader; its case8 went red with the hard exit and green with `process.exitCode` (2026-11-23, `.route/v2026_11_19.declapract.upgrade`).
