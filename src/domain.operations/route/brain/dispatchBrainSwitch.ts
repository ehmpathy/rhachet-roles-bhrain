import { spawn } from 'child_process';

import { delBrainApplyLogHandoff } from './delBrainApplyLogHandoff';
import { genBrainApplyLog } from './genBrainApplyLog';
import { setBrainApplyNote } from './setBrainApplyNote';

/**
 * .what = submits ONE slash command into the addressed clone, and returns at once
 * .why = `/model` and `/effort` share one delivery; only the command varies
 * .note = private: this file is its only consumer (`rule.prefer.wet-over-dry`). the invariants
 *         in `dispatchBrainSwitch`'s header are implemented here
 */
const dispatchOneSay = (input: {
  rhx: string;
  repoRoot: string;
  address: string;
  /** the slash command, whole — e.g. `/model opus` or `/effort high` */
  what: string;
  /** names the failed command in the breadcrumb, so two says are distinguishable */
  label: string;
}): { submitted: boolean } => {
  const log = genBrainApplyLog({ repoRoot: input.repoRoot });
  const child = spawn(
    input.rhx,
    ['clone', 'say', `@:${input.address}`, '--what', input.what],
    {
      cwd: input.repoRoot,
      detached: true,
      // stderr to the log, stdout discarded — so the log holds failures only
      stdio: log ? ['ignore', 'ignore', log.fd] : 'ignore',
    },
  );
  // release the parent's handoff fd on every arm; `spawn` already dup'd it into the child
  if (log) delBrainApplyLogHandoff({ log });

  // breadcrumb on spawn failure; never closes the fd (already closed above)
  child.on('error', (error) => {
    void setBrainApplyNote({
      repoRoot: input.repoRoot,
      text: `dispatchBrainSwitch: \`clone say\` spawn failed (${input.label}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  });
  child.unref();

  // `child.pid` is the exec verdict — see the header
  return { submitted: child.pid !== undefined };
};

/**
 * .what = submits the stone's prescription — `/model <brain>` and/or `/effort <effort>` — into
 *         the addressed clone, and returns at once
 * .why = the wish's sequence: `clone say @:<address> --what '/model <brain>'`, after `whoami`
 *        confirms the address
 *
 * .note = up to TWO says, never one fused. `/model` and `/effort` are separate slash commands,
 *         and a multi-line `--what` is committed as ONE bracketed-paste turn
 *         (`asCloneDispatchFrame`), not two commands
 * .note = the two says cannot garble — rhachet's per-clone write queue is a single writer — but
 *         their ORDER is unguaranteed: the brain say spawns first and usually lands first (`F29`)
 * .note = a failed brain say short-circuits the effort say: an effort is model-scoped, so it
 *         would land on the brain the guard meant to avoid
 * .note = `submitted` is the AND over the says attempted. a partial launch halts `spawn-failed`;
 *         the next tick re-dispatches both, which is benign since each say converges (`F14`)
 * .note = fire and forget: detached, unref'd, and a PLAIN return, never a promise. an await here
 *         deadlocks — `clone say` polls the transcript for up to 15s while the driver that must
 *         write it is blocked inside this hook (`case=5`)
 * .note = `child.pid !== undefined` IS the exec verdict: libuv's `uv_spawn` reports an execve
 *         failure synchronously, so `pid` is set only if fork AND exec succeeded. clamped by the
 *         ENOENT / EACCES / EISDIR cases in the integration test — a runtime that breaks this
 *         turns them red
 * .note = the `error` listener is required: node re-raises an unheard `error` as an uncaught
 *         exception, which would crash the hook after it returned
 * .note = diagnostics go to `.log/bhrain/brain/apply.log`, never `console.error` — the engine
 *         does not own that channel, and the unref'd dispatch may exit first (`F15`). only
 *         failures write (~100 bytes each), so the log needs no rotation
 * .note = the handoff fd is closed unconditionally right after `spawn`. the `error` handler must
 *         NOT close it: it fires later, when the fd number may belong to another file
 * .note = it reports the LAUNCH only. whether the brain accepted the slug is unreadable (`F5`),
 *         so the caller records it as `requested`, never `switched`
 */
export const dispatchBrainSwitch = (input: {
  rhx: string;
  repoRoot: string;
  address: string;

  /** the declared `/model` argument, or null where the guard declared only an effort */
  brain: string | null;

  /**
   * .what = the declared `/effort` argument, or null
   * .why = null rather than optional, so every caller states the answer
   *        (`rule.forbid.undefined-inputs`)
   */
  effort: string | null;
}): { submitted: boolean } => {
  // brain say first; its failure ends the dispatch. a null brain = effort alone, no `/model` owed
  const brainSay = input.brain
    ? dispatchOneSay({
        rhx: input.rhx,
        repoRoot: input.repoRoot,
        address: input.address,
        what: `/model ${input.brain}`,
        label: `brain=${input.brain}`,
      })
    : { submitted: true };
  if (!brainSay.submitted) return { submitted: false };

  // no effort declared → the brain say IS the whole prescription
  if (!input.effort) return { submitted: true };

  const effortSay = dispatchOneSay({
    rhx: input.rhx,
    repoRoot: input.repoRoot,
    address: input.address,
    what: `/effort ${input.effort}`,
    label: `effort=${input.effort}`,
  });
  return { submitted: effortSay.submitted };
};
