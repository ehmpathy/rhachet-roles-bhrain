/**
 * .what = cli entrypoint for the learner memory guard skill
 * .why = enables shell invocation via package-level import, isolated on its own
 *        cli subpath so the hook loads minimal modules (see
 *        rule.require.isolated-cli-subpath-exports)
 */
import { asToolInvocation } from '@src/domain.operations/memory/asToolInvocation';
import { getMemoryGuardVerdict } from '@src/domain.operations/memory/getMemoryGuardVerdict';

import { asMemoryGuardNudge } from './asMemoryGuardNudge';

/**
 * .what = read the tool-invocation payload as a string (communicator: raw i/o)
 * .why = the memory.guard.sh wrapper captures the harness stdin and hands it to
 *        node on its own stdin, via a here-string; never via an env var, which
 *        linux caps near 128KB
 */
const readStdin = async (): Promise<string> => {
  // .note = deliberate mutation: accumulate stdin chunks as they stream in
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

/**
 * .what = cli entrypoint for the memory.guard PreToolUse hook
 * .why = halts writes to claude native memory and redirects to durable capture
 *
 * reads tool invocation JSON from stdin (from the claude code harness)
 * exits 0 if allowed (silent)
 * exits 2 if blocked (owl nudge to stderr)
 */
export const memoryGuard = async (): Promise<void> => {
  // read stdin (communicator)
  const raw = await readStdin();

  // cast the invocation; a payload it cannot judge is allowed, never halted
  const { tool } = asToolInvocation({ raw });
  if (!tool) return;

  // evaluate verdict
  const verdict = getMemoryGuardVerdict({
    toolName: tool.name,
    toolInput: tool.input,
    cwd: tool.cwd,
  });

  // if allowed, silent exit
  if (verdict.verdict === 'allowed') return;

  // blocked: emit the owl nudge and halt hard (no retry-override for memory paths)
  console.error(asMemoryGuardNudge({ path: verdict.path, act: verdict.act }));
  process.exit(2);
};
