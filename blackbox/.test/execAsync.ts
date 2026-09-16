import { type ExecOptions, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import { linkRole } from './linkRole';

/**
 * .what = the shared exec used by every fixture harness, with one fast path
 * .why  = fixtures invoke `npx rhachet roles link --role X` 322 times across the suite.
 *         every call pays an npx lookup plus a node JIT boot of the rhachet cli, and
 *         produces a byte-identical tree each time (see linkRole for why). one shared
 *         wrapper serves all 322 call sites from a cache without a single test edit.
 *
 *         intercepted here rather than at the call sites because the subject of these
 *         tests is the SKILL, never `roles link` — the link is fixture scaffold. a
 *         change at 322 call sites is 322 chances to alter what a test proves; a change
 *         at one seam is one.
 */
const execRaw = promisify(exec);

/** .what = the exact fixture-scaffold command this wrapper serves from cache */
const asRolesLinkRequest = (
  cmd: string,
): { role: string; repo?: string } | null => {
  const tokens = cmd.trim().split(/\s+/);
  const isRolesLink =
    tokens[0] === 'npx' &&
    tokens[1] === 'rhachet' &&
    tokens[2] === 'roles' &&
    tokens[3] === 'link';
  if (!isRolesLink) return null;

  const rest = tokens.slice(4);
  const readFlag = (name: string): string | undefined => {
    const at = rest.indexOf(`--${name}`);
    return at === -1 ? undefined : rest[at + 1];
  };
  const role = readFlag('role');
  if (!role) return null;

  // any flag beyond --role/--repo changes what the link writes; fall through to the
  // real cli rather than serve a cached tree that does not match the ask
  const known = new Set(['--role', '--repo']);
  const flags = rest.filter((t) => t.startsWith('--'));
  if (flags.some((f) => !known.has(f))) return null;

  return { role, repo: readFlag('repo') };
};

/**
 * .what = the switch that turns the cache off
 * .why = a before/after has to be reproducible, and a claim measured on a tree that no
 *        longer exists is a claim nobody can check. with this switch the SAME tree
 *        measures both sides: `ACCEPTANCE_LINK_CACHE=off` restores the original
 *        one-cli-call-per-fixture behavior.
 */
const isCacheOff = (): boolean => process.env.ACCEPTANCE_LINK_CACHE === 'off';

/**
 * .what = rewrites `npx <bin>` to the local `node_modules/.bin/<bin>` for rhachet's clis
 * .why  = `npx` re-resolves the binary on EVERY call. measured on this box, 20 reps:
 *           rhx via npx                    1127 ms
 *           rhx via ./node_modules/.bin     107 ms
 *           bash -c true (spawn floor)        4 ms
 *         ⇒ a ~1020 ms tax per call, for a lookup whose answer never changes. the suite
 *         makes 329 such calls, so it pays roughly 5.6 MINUTES to re-learn one path.
 *
 *         the rewrite runs the SAME executable — `npx rhx` resolves to exactly this
 *         shim — so it changes speed and not one byte of behavior.
 *
 * .note = falls back to the original command when the shim is absent, so a fixture whose
 *         node_modules is shaped differently still works. this is a fast path, never a
 *         requirement.
 */
const asDirectBinCmd = (cmd: string, cwd: string): string => {
  if (process.env.ACCEPTANCE_NPX_DIRECT === 'off') return cmd;
  return cmd.replace(
    /(^|[\s;&|(])npx\s+(rhx|rhachet)\b/g,
    (whole, lead: string, bin: string) => {
      const shim = path.join(cwd, 'node_modules', '.bin', bin);
      return fs.existsSync(shim) ? `${lead}"${shim}"` : whole;
    },
  );
};

export const execAsync = async (
  cmd: string,
  opts?: ExecOptions,
): Promise<{ stdout: string; stderr: string }> => {
  const link = isCacheOff() ? null : asRolesLinkRequest(cmd);
  if (link && opts?.cwd) {
    await linkRole({ ...link, cwd: String(opts.cwd) });
    return { stdout: '', stderr: '' };
  }
  const direct = opts?.cwd ? asDirectBinCmd(cmd, String(opts.cwd)) : cmd;
  return (await execRaw(direct, opts)) as { stdout: string; stderr: string };
};
