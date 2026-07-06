/**
 * .what = cli entrypoint for the learner memory guard skill
 * .why = enables shell invocation via package-level import, isolated on its own
 *        cli subpath so the hook loads minimal modules (see
 *        rule.require.isolated-cli-subpath-exports)
 */
import { asToolInvocation } from '@src/domain.operations/memory/asToolInvocation';
import { getMemoryGuardVerdict } from '@src/domain.operations/memory/getMemoryGuardVerdict';

/**
 * .what = owl wisdom for the memory guard halt
 * .why = the bot's urge to remember is good — the nudge honors it, then redirects
 */
const OWL_WISDOM_GUARD = '🦉 hold on, friend — that memory would fade.';

/**
 * .what = emit the owl-themed redirect nudge to stderr
 * .why = stderr (not stdout) per rule.forbid.stdout-on-exit-errors; cli hooks
 *        surface stderr on non-zero exit
 */
const emitRedirectNudge = (input: { path: string }): void => {
  const { path } = input;
  console.error(OWL_WISDOM_GUARD);
  console.error('');
  console.error('📜 memory.guard');
  console.error(`   ├─ ✋ blocked: write to claude native memory`);
  console.error(`   │  └─ ${path}`);
  console.error('   │');
  console.error('   ├─ why');
  console.error(
    '   │  └─ ~/.claude memory is machine-local + invisible in git',
  );
  console.error('   │     it will not survive for the next traveler');
  console.error('   │');
  console.error('   ├─ capture it durably instead');
  console.error(
    '   │  ├─ lesson → .agent/repo=.this/role=any/briefs/<name>.md',
  );
  console.error(
    '   │  └─ tactic → .agent/repo=.this/role=any/skills/<name>.sh',
  );
  console.error('   │');
  console.error('   ├─ ⚠️ machine-local secrets or paths?');
  console.error(
    '   │  └─ generalize them — keep the raw secret or path out of durable memory',
  );
  console.error('   │');
  console.error(
    '   └─ 🪷 the instinct is right — pave the path for whoever comes next',
  );
};

/**
 * .what = read the tool-invocation payload as a string (communicator: raw i/o)
 * .why = the memory.guard.sh wrapper captures the harness stdin into
 *        RHACHET_STDIN to work around node -e stdin inheritance (same pattern as
 *        route.bounce); prefer it, and fall back to process.stdin for callers
 *        (e.g. tests) that pipe directly
 */
const readStdin = async (): Promise<string> => {
  // prefer RHACHET_STDIN (set by the memory.guard.sh wrapper in the real harness)
  const envStdin = process.env.RHACHET_STDIN;
  if (envStdin !== undefined) return envStdin;

  // fallback: read process.stdin directly (callers that pipe via execSync)
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

  // cast the invocation; null tool = empty or malformed → fail-open (allow)
  const { tool } = asToolInvocation({ raw });
  if (!tool) return;

  // evaluate verdict
  const verdict = getMemoryGuardVerdict({
    toolName: tool.name,
    toolInput: tool.input,
  });

  // if allowed, silent exit
  if (verdict.verdict === 'allowed') {
    return;
  }

  // blocked: emit the owl nudge and halt hard (no retry-override for memory paths)
  emitRedirectNudge({ path: verdict.path });
  process.exit(2);
};
