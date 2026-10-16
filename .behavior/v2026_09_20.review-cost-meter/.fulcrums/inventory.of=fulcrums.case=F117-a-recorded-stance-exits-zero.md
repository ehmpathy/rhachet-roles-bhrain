# F117 — a recorded stance (concede or dispute) exits 0, not 2

- raised 2026-10-06, by the driver, while it dogfooded per-concern dispositions at 5.1 i008
- rework: **clean** — one transformer (`asRouteStoneSetExitCode`) and its test; revert is one condition
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **85%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — exit 2 on a concede (prior shape, a reviewer's r2 n2 ask)** | an exit 0 would tell a hook the stone is clear while the conceded fix is still owed |
| **B — exit 0 on any recorded stance (as shipped)** | the act succeeded; exit 2 means "fix this before the act can happen" (`rule.require.exit-code-semantics`). a driver who chains dispositions with `&&` had the chain cut after the first |

## .taken, and why

**B.** no hook or skill reads the exit code of `--as conceded`; the hold is enforced by the
entrance gate and the guard on the next `--as arrived`, so A's protection guarded no reader.
its cost was real and measured: the dogfood chain of concessions stopped at the first one, and
rhachet printed `✋ blocked by constraints` over a success.

## .rework, and why

**clean.** re-add one condition in `asRouteStoneSetExitCode`; its unit and integration tests flip.

## .confidence, and why it is not higher

it reverses a reviewer's explicit ask. a future hook that does read the stance exit code
would want A — none exists today.

## .where

`src/domain.operations/route/asRouteStoneSetExitCode.ts` · `src/contract/cli/route.ts`

## .verdict

— (awaits the council)
