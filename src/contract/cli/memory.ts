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
 *        linux caps near 128KB, and which a parent shell may leave set
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
 * reads tool invocation JSON from stdin (from the claude code harness), and returns
 * one outcome; it never exits. memory.guard.sh maps the outcome to stderr and code:
 * - neither = allowed: exit 0, silent
 * - a fault = a payload the guard cannot judge: the one fault line, exit 1, so the
 *   call proceeds and the blind spot is named
 * - a nudge = blocked: the owl nudge to stderr, exit 2 (no retry-override)
 */
export const memoryGuard = async (): Promise<{
  fault: { cause: string; fix: string } | null;
  nudge: string | null;
}> => {
  // read stdin (communicator)
  const raw = await readStdin();

  // cast the invocation; a payload it cannot read is named, empty stdin is silent
  const { tool, unjudgeable } = asToolInvocation({ raw });
  if (unjudgeable)
    return {
      fault: {
        cause: unjudgeable,
        fix: 'none needed for this call; if it recurs, report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues',
      },
      nudge: null,
    };
  if (!tool) return { fault: null, nudge: null };

  // evaluate verdict
  const verdict = getMemoryGuardVerdict({
    toolName: tool.name,
    toolInput: tool.input,
    cwd: tool.cwd,
  });

  // allowed: silent; blocked: the owl nudge, which the skill writes and exits 2 on
  if (verdict.verdict === 'allowed') return { fault: null, nudge: null };
  return {
    fault: null,
    nudge: asMemoryGuardNudge({ path: verdict.path, act: verdict.act }),
  };
};
